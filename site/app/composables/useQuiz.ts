import { useAiModel } from '../composables/useAiModel';

interface QuizQuestion {
    question: string
    options: string[]
    correctIndex: number
    explanation: string
    topic: string
    difficulty: 'easy' | 'medium' | 'hard'
}

interface QuizConfig {
    numQuestions: number
    difficulty: 'easy' | 'medium' | 'hard' | 'mixed'
    topics: string[]
}

export function useQuiz() {
    const rag = useRag()
    const model = useAiModel()

    const quizState = ref<'setup' | 'loading' | 'active' | 'review'>('setup')
    const questions = ref<QuizQuestion[]>([])
    const currentQuestionIndex = ref(0)
    const userAnswers = ref<(number | null)[]>([])
    const isGenerating = ref(false)
    const generationError = ref('')
    const generationProgress = ref(0)
    const generationStatus = ref('')

    const score = computed(() => {
        const total = questions.value.length
        let correct = 0
        for (let i = 0; i < total; i++) {
            if (userAnswers.value[i] === questions.value[i]?.correctIndex) {
                correct++
            }
        }
        return {
            correct,
            total,
            percentage: total > 0 ? Math.round((correct / total) * 100) : 0,
        }
    })

    const availableTopics = computed(() => rag.topics.value)

    async function generateQuiz(config: QuizConfig) {
        quizState.value = 'loading'
        isGenerating.value = true
        generationError.value = ''
        generationProgress.value = 0
        generationStatus.value = 'Loading note embeddings...'

        try {
            generationProgress.value = 12
            await rag.load()

            generationStatus.value = 'Loading AI model...'
            generationProgress.value = 28
            await model.init()

            // Gather relevant chunks
            generationStatus.value = 'Preparing question context...'
            generationProgress.value = 42
            const allChunks = gatherChunks(config)

            generationStatus.value = 'Generating quiz questions...'
            generationProgress.value = 55
            const generatedQuestions = await generateWithLLM(allChunks, config)

            if (generatedQuestions.length === 0) {
                throw new Error('Unable to generate quiz questions from the current notes.')
            }

            generationStatus.value = 'Finalizing quiz...'
            generationProgress.value = 95
            questions.value = generatedQuestions
            userAnswers.value = new Array(generatedQuestions.length).fill(null)
            currentQuestionIndex.value = 0
            quizState.value = 'active'
            generationProgress.value = 100
            generationStatus.value = 'Quiz ready'
        } catch (err) {
            console.error('[useQuiz] Failed to generate quiz:', err)
            generationError.value =
                err instanceof Error
                    ? err.message
                    : 'Quiz generation failed. Please try again.'
            quizState.value = 'setup'
            generationStatus.value = ''
            generationProgress.value = 0
        } finally {
            isGenerating.value = false
        }
    }

    function gatherChunks(config: QuizConfig) {
        if (!rag.embeddings.value) return []

        const chunks = rag.embeddings.value.chunks
        if (config.topics.length > 0) {
            const filtered = chunks.filter(c =>
                config.topics.some(t => c.heading.toLowerCase().includes(t.toLowerCase()))
            )
            return filtered.length > 0 ? shuffleArray(filtered) : shuffleArray(chunks)
        }
        return shuffleArray(chunks)
    }

    async function generateWithLLM(
        chunks: Array<{ text: string; page: number; heading: string }>,
        config: QuizConfig
    ): Promise<QuizQuestion[]> {
        const contextChunks = chunks.slice(0, Math.min(chunks.length, 12))
        const contextText = contextChunks.length
            ? contextChunks
                  .map((c, i) => `[${i + 1}] (${c.heading}, Page ${c.page}): ${c.text}`)
                  .join('\n\n')
            : 'No extracted class-note chunks available. Generate questions based on secure coding course content.'

        const difficultyInstruction =
            config.difficulty === 'mixed'
                ? 'Mix easy, medium, and hard questions.'
                : `All questions should be ${config.difficulty} difficulty.`

        const prompt = `Based on the following class notes context, generate exactly ${config.numQuestions} multiple choice questions. ${difficultyInstruction}

Each question must have exactly 4 options (A, B, C, D) with one correct answer.

Respond ONLY with valid JSON in this exact format:
[
  {
    "question": "...",
    "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
    "correctIndex": 0,
    "explanation": "...",
    "topic": "...",
    "difficulty": "easy|medium|hard"
  }
]

Context:
${contextText}`

        const chatMessages = [
            {
                role: 'system',
                content:
                    'You are a quiz generator for a Secure Coding course. Generate multiple choice questions based on the provided context. Respond only with valid JSON.',
            },
            { role: 'user', content: prompt },
        ]

        let response = ''
        const stream = model.chat(chatMessages)
        let tokenCount = 0
        for await (const token of stream) {
            response += token
            tokenCount++
            generationProgress.value = Math.min(88, 55 + Math.floor(tokenCount / 6))
        }

        try {
            // Try to extract JSON from response
            const jsonMatch = response.match(/\[[\s\S]*\]/)
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]) as QuizQuestion[]
                generationProgress.value = 92
                return parsed.slice(0, config.numQuestions)
            }
        } catch (parseErr) {
            console.warn('[useQuiz] Failed to parse LLM response:', parseErr)
        }

        generationStatus.value = 'AI format was invalid, using deterministic fallback...'
        generationProgress.value = 90
        return generateFallback(chunks, config)
    }

    function generateFallback(
        chunks: Array<{ text: string; page: number; heading: string }>,
        config: QuizConfig
    ): QuizQuestion[] {
        const result: QuizQuestion[] = []
        const usedChunks = chunks.slice(0, Math.max(chunks.length, config.numQuestions * 2))

        // Extract key terms from all available chunks for distractors
        const allKeyTerms = extractAllKeyTerms(chunks)

        for (let i = 0; i < config.numQuestions && i < usedChunks.length; i++) {
            const chunk = usedChunks[i]!
            const question = createQuestionFromChunk(chunk, allKeyTerms, config.difficulty, i)
            if (question) {
                result.push(question)
            }
        }

        // If we didn't get enough questions, try more chunks
        if (result.length < config.numQuestions) {
            for (
                let i = result.length;
                i < config.numQuestions && i < chunks.length;
                i++
            ) {
                const chunk = chunks[i % chunks.length]!
                const question = createQuestionFromChunk(
                    chunk,
                    allKeyTerms,
                    config.difficulty,
                    i + 100
                )
                if (question) {
                    result.push(question)
                }
            }
        }

        return result.slice(0, config.numQuestions)
    }

    function extractAllKeyTerms(
        chunks: Array<{ text: string; heading: string }>
    ): string[] {
        const terms = new Set<string>()
        for (const chunk of chunks) {
            // Extract capitalized terms, quoted terms, and terms after "is/are/means"
            const sentences = chunk.text.split(/[.!?]+/)
            for (const sentence of sentences) {
                // Find terms in definitions (e.g., "X is ...")
                const defMatch = sentence.match(
                    /\b([A-Z][a-zA-Z\s]{2,30})\b\s+(?:is|are|refers to|means)/
                )
                if (defMatch?.[1]) terms.add(defMatch[1].trim())

                // Find capitalized multi-word terms
                const capMatches = sentence.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+\b/g)
                if (capMatches) capMatches.forEach(m => terms.add(m))

                // Find quoted terms
                const quoteMatches = sentence.match(/"([^"]+)"/g)
                if (quoteMatches) quoteMatches.forEach(m => terms.add(m.replace(/"/g, '')))
            }

            // Also use headings as key terms
            if (chunk.heading) terms.add(chunk.heading)
        }

        return [...terms].filter(t => t.length > 2 && t.length < 50)
    }

    function createQuestionFromChunk(
        chunk: { text: string; page: number; heading: string },
        allTerms: string[],
        difficulty: 'easy' | 'medium' | 'hard' | 'mixed',
        seed: number
    ): QuizQuestion | null {
        const sentences = chunk.text
            .split(/[.!?]+/)
            .map(s => s.trim())
            .filter(s => s.length > 20)

        if (sentences.length === 0) return null

        // Pick a sentence using seed for determinism
        const sentenceIdx = seed % sentences.length
        const sentence = sentences[sentenceIdx]!

        // Try to find a key concept in this sentence
        const conceptMatch =
            sentence.match(
                /\b([A-Z][a-zA-Z\s]{2,25})\b\s+(?:is|are|refers to|means|provides)/
            ) ||
            sentence.match(/\b((?:the\s)?[a-z]+\s+[a-z]+(?:\s+[a-z]+)?)\b/i)

        if (!conceptMatch) {
            // Fallback: ask about the topic/heading
            const otherTerms = allTerms
                .filter(t => t !== chunk.heading)
                .sort(() => seededRandom(seed) - 0.5)
                .slice(0, 3)

            if (otherTerms.length < 3) return null

            const options = shuffleWithSeed(
                [chunk.heading, ...otherTerms],
                seed
            )
            const correctIndex = options.indexOf(chunk.heading)

            return {
                question: `Which topic covers the following concept: "${sentence.slice(0, 100)}..."?`,
                options: options.map((o, i) => `${String.fromCharCode(65 + i)}) ${o}`),
                correctIndex,
                explanation: `This concept is from the "${chunk.heading}" section (Page ${chunk.page}).`,
                topic: chunk.heading,
                difficulty: resolveDifficulty(difficulty, seed),
            }
        }

        const keyTerm = conceptMatch[1]!.trim()
        const blankSentence = sentence.replace(keyTerm, '________')

        // Get 3 distractors from other key terms
        const distractors = allTerms
            .filter(
                t =>
                    t.toLowerCase() !== keyTerm.toLowerCase() &&
                    t !== chunk.heading
            )
            .sort(() => seededRandom(seed + 1) - 0.5)
            .slice(0, 3)

        if (distractors.length < 3) {
            // Not enough distractors, create generic ones
            distractors.push(
                ...['Authentication', 'Encryption', 'Validation', 'Authorization']
                    .filter(d => d.toLowerCase() !== keyTerm.toLowerCase())
                    .slice(0, 3 - distractors.length)
            )
        }

        const allOptions = [keyTerm, ...distractors.slice(0, 3)]
        const shuffled = shuffleWithSeed(allOptions, seed + 2)
        const correctIndex = shuffled.indexOf(keyTerm)

        return {
            question: `Complete the following from the class notes: "${blankSentence}"`,
            options: shuffled.map((o, i) => `${String.fromCharCode(65 + i)}) ${o}`),
            correctIndex,
            explanation: `The correct answer is "${keyTerm}". From: ${chunk.heading} (Page ${chunk.page}).`,
            topic: chunk.heading,
            difficulty: resolveDifficulty(difficulty, seed),
        }
    }

    function resolveDifficulty(
        difficulty: 'easy' | 'medium' | 'hard' | 'mixed',
        seed: number
    ): 'easy' | 'medium' | 'hard' {
        if (difficulty !== 'mixed') return difficulty
        const levels: ('easy' | 'medium' | 'hard')[] = ['easy', 'medium', 'hard']
        return levels[seed % 3]!
    }

    function seededRandom(seed: number): number {
        const x = Math.sin(seed + 1) * 10000
        return x - Math.floor(x)
    }

    function shuffleArray<T>(arr: T[]): T[] {
        const copy = [...arr]
        for (let i = copy.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1))
                ;[copy[i], copy[j]] = [copy[j]!, copy[i]!]
        }
        return copy
    }

    function shuffleWithSeed<T>(arr: T[], seed: number): T[] {
        const copy = [...arr]
        for (let i = copy.length - 1; i > 0; i--) {
            const j = Math.floor(seededRandom(seed + i) * (i + 1))
                ;[copy[i], copy[j]] = [copy[j]!, copy[i]!]
        }
        return copy
    }

    function submitAnswer(optionIndex: number) {
        userAnswers.value[currentQuestionIndex.value] = optionIndex
    }

    function nextQuestion() {
        currentQuestionIndex.value = Math.min(
            currentQuestionIndex.value + 1,
            questions.value.length - 1
        )
    }

    function prevQuestion() {
        currentQuestionIndex.value = Math.max(currentQuestionIndex.value - 1, 0)
    }

    function finishQuiz() {
        quizState.value = 'review'
    }

    function resetQuiz() {
        quizState.value = 'setup'
        questions.value = []
        currentQuestionIndex.value = 0
        userAnswers.value = []
        isGenerating.value = false
        generationProgress.value = 0
        generationStatus.value = ''
    }

    return {
        quizState,
        questions,
        currentQuestionIndex,
        userAnswers,
        score,
        availableTopics,
        isGenerating,
        generationError,
        generationProgress,
        generationStatus,
        generateQuiz,
        submitAnswer,
        nextQuestion,
        prevQuestion,
        finishQuiz,
        resetQuiz,
    }
}
