/** A single flashcard with spaced-repetition scheduling metadata. */
interface Flashcard {
    id: string
    front: string
    back: string
    topic: string
    tags: string[]
    /** Current review interval in days. */
    intervalDays: number
    /** SM-2-style ease factor (higher = longer intervals). */
    ease: number
    dueAt: number
    seen: number
}

interface GenerateFlashcardsConfig {
    count: number
    focus: string
}

/** User's self-assessment rating for a flashcard review. */
type FlashcardRating = 'again' | 'good' | 'easy'

function safeJsonArray<T>(text: string): T[] {
    const trimmed = text.trim()

    const tryParseArray = (input: string): T[] => {
        try {
            const parsed = JSON.parse(input) as unknown
            if (Array.isArray(parsed)) return parsed as T[]
            if (parsed && typeof parsed === 'object' && Array.isArray((parsed as any).cards)) {
                return (parsed as any).cards as T[]
            }
            return []
        } catch {
            return []
        }
    }

    const direct = tryParseArray(trimmed)
    if (direct.length) return direct

    const withoutCodeFence = trimmed
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/\s*```$/i, '')

    const fenceParsed = tryParseArray(withoutCodeFence)
    if (fenceParsed.length) return fenceParsed

    const arrayMatch = withoutCodeFence.match(/\[[\s\S]*\]/)
    if (arrayMatch) {
        const matched = tryParseArray(arrayMatch[0])
        if (matched.length) return matched
    }

    const objectMatch = withoutCodeFence.match(/\{[\s\S]*\}/)
    if (objectMatch) {
        const objMatched = tryParseArray(objectMatch[0])
        if (objMatched.length) return objMatched
    }

    return []
}

function extractSummarySentence(text: string): string {
    const sentence = text
        .split(/[.!?]+/)
        .map(s => s.trim())
        .find(s => s.length > 24)

    if (!sentence) return text.slice(0, 180).trim()
    return sentence.slice(0, 200).trim()
}

function buildFallbackCards(
    chunks: Array<{ text: string; page: number; heading: string }>,
    count: number,
    focus: string
): Array<{ front: string; back: string; topic?: string; tags?: string[] }> {
    const fallback: Array<{ front: string; back: string; topic?: string; tags?: string[] }> = []
    const target = Math.max(1, count)

    const focusLower = focus.toLowerCase()
    const selectedChunks = chunks.filter(chunk => {
        if (!focusLower) return true
        return (
            chunk.heading.toLowerCase().includes(focusLower) ||
            chunk.text.toLowerCase().includes(focusLower)
        )
    })

    const sourceChunks = selectedChunks.length ? selectedChunks : chunks

    for (let i = 0; i < sourceChunks.length && fallback.length < target; i++) {
        const chunk = sourceChunks[i]!
        const summary = extractSummarySentence(chunk.text)
        if (!summary) continue

        fallback.push({
            front: `What is the key idea in ${chunk.heading}?`,
            back: summary,
            topic: chunk.heading,
            tags: ['notes', `page-${chunk.page}`],
        })
    }

    const generic = [
        {
            front: 'Why is input validation important in secure coding?',
            back: 'Input validation reduces malformed or malicious data entering the system and helps prevent common vulnerabilities.',
            topic: 'Input Validation',
            tags: ['secure-coding'],
        },
        {
            front: 'What is the difference between authentication and authorization?',
            back: 'Authentication verifies identity, while authorization determines what an authenticated user is allowed to do.',
            topic: 'AuthN/AuthZ',
            tags: ['secure-coding'],
        },
        {
            front: 'Why should sensitive data be encrypted at rest and in transit?',
            back: 'Encryption protects confidentiality if storage media or network traffic is exposed to unauthorized parties.',
            topic: 'Data Protection',
            tags: ['secure-coding'],
        },
        {
            front: 'What is least privilege?',
            back: 'Least privilege grants only the minimum access necessary, reducing blast radius if an account or process is compromised.',
            topic: 'Access Control',
            tags: ['secure-coding'],
        },
    ]

    let genericIndex = 0
    while (fallback.length < target) {
        fallback.push(generic[genericIndex % generic.length]!)
        genericIndex++
    }

    return fallback.slice(0, target)
}

const STORAGE_KEY = 'cnt4419-flashcards-v1'

function loadFromStorage(): Flashcard[] {
    if (!import.meta.client) return []
    try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (!raw) return []
        const parsed = JSON.parse(raw) as Flashcard[]
        return Array.isArray(parsed) ? parsed : []
    } catch {
        return []
    }
}

function saveToStorage(cards: Flashcard[]) {
    if (!import.meta.client) return
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cards))
    } catch {
        // quota exceeded or private mode — silently ignore
    }
}

/**
 * Composable for AI-generated flashcards with spaced-repetition scheduling.
 *
 * Cards are persisted to localStorage and scheduled using a simplified SM-2
 * algorithm. Supports AI generation, import/export, and manual deck management.
 */
export function useFlashcards() {
    const rag = useRag()
    const model = useAiModel()
    const confetti = useConfetti()

    const cards = useState<Flashcard[]>('flashcards-cards', () => loadFromStorage())
    const isGenerating = useState<boolean>('flashcards-is-generating', () => false)
    const generationError = useState<string>('flashcards-generation-error', () => '')
    const generationProgress = useState<number>('flashcards-generation-progress', () => 0)
    const generationStatus = useState<string>('flashcards-generation-status', () => '')
    const currentIndex = useState<number>('flashcards-current-index', () => 0)
    const showAnswer = useState<boolean>('flashcards-show-answer', () => false)
    const correctRatings = useState<number>('flashcards-correct-ratings', () => 0)
    const answeredRatings = useState<number>('flashcards-answered-ratings', () => 0)

    // Persist cards to localStorage whenever they change
    if (import.meta.client) {
        watch(cards, (newCards) => saveToStorage(newCards), { deep: true })
    }

    const dueCards = computed(() => {
        const now = Date.now()
        return cards.value
            .filter(card => card.dueAt <= now)
            .sort((a, b) => a.dueAt - b.dueAt)
    })

    const hasDeck = computed(() => cards.value.length > 0)
    const totalDue = computed(() => dueCards.value.length)
    const currentCard = computed(() => dueCards.value[currentIndex.value] ?? null)

    const completion = computed(() => {
        if (totalDue.value === 0) return 0
        return Math.round((Math.min(currentIndex.value, totalDue.value) / totalDue.value) * 100)
    })

    async function ensureReady() {
        await rag.load()
        await model.init()
    }

    function normalizeCards(items: Array<{ front: string; back: string; topic?: string; tags?: string[] }>): Flashcard[] {
        const now = Date.now()
        return items
            .filter(item => item?.front?.trim() && item?.back?.trim())
            .map((item, index) => ({
                id: `${now}-${index}-${Math.random().toString(36).slice(2, 8)}`,
                front: item.front.trim(),
                back: item.back.trim(),
                topic: item.topic?.trim() || 'General',
                tags: Array.isArray(item.tags) ? item.tags : [],
                intervalDays: 1,
                ease: 2.3,
                dueAt: now,
                seen: 0,
            }))
    }

    async function generate(config: GenerateFlashcardsConfig, append = false) {
        isGenerating.value = true
        generationError.value = ''
        generationProgress.value = 0
        generationStatus.value = 'Loading note embeddings...'

        try {
            generationProgress.value = 12
            await ensureReady()
            generationStatus.value = 'Preparing flashcard context...'
            generationProgress.value = 35
            const chunks = rag.embeddings.value?.chunks ?? []
            const focus = config.focus.trim()
            const contextChunks = chunks
                .filter(chunk => !focus || chunk.heading.toLowerCase().includes(focus.toLowerCase()) || chunk.text.toLowerCase().includes(focus.toLowerCase()))
                .slice(0, 12)

            const contextText = contextChunks.length
                ? contextChunks.map((chunk, i) => `[${i + 1}] (${chunk.heading}, p.${chunk.page}) ${chunk.text}`).join('\n\n')
                : 'No note chunks available from embeddings.json. Generate from secure coding fundamentals.'

            const prompt = `Generate exactly ${config.count} study flashcards for secure coding.${focus ? ` Focus strongly on: ${focus}.` : ''}
Return ONLY JSON as an array of objects with this shape:
[
  {"front":"...","back":"...","topic":"...","tags":["..."]}
]
Keep each front concise and each back accurate but short.`

            const stream = model.chat([
                {
                    role: 'system',
                    content:
                        'You create high-quality study flashcards. Return only valid JSON. No markdown, no prose outside JSON.',
                },
                {
                    role: 'user',
                    content: `Context:\n${contextText}\n\n${prompt}`,
                },
            ])

            let response = ''
            let tokenCount = 0
            generationStatus.value = 'Generating flashcards with AI...'
            generationProgress.value = 55
            for await (const token of stream) {
                response += token
                tokenCount++
                generationProgress.value = Math.min(88, 55 + Math.floor(tokenCount / 6))
            }

            const parsed = safeJsonArray<{ front: string; back: string; topic?: string; tags?: string[] }>(response)
            let next = normalizeCards(parsed).slice(0, config.count)
            if (next.length === 0) {
                generationStatus.value = 'AI output was malformed, building deterministic fallback cards...'
                generationProgress.value = 92
                next = normalizeCards(buildFallbackCards(chunks, config.count, focus)).slice(0, config.count)
            }

            generationStatus.value = 'Finalizing deck...'
            generationProgress.value = 98
            cards.value = append ? [...cards.value, ...next] : next
            currentIndex.value = 0
            showAnswer.value = false
            correctRatings.value = 0
            answeredRatings.value = 0
            generationStatus.value = 'Flashcards ready'
            generationProgress.value = 100
        } catch (err) {
            generationError.value = err instanceof Error ? err.message : 'Failed to generate flashcards.'
            generationStatus.value = ''
            generationProgress.value = 0
        } finally {
            isGenerating.value = false
        }
    }

    function rateCurrent(rating: FlashcardRating) {
        const card = currentCard.value
        if (!card) return

        const idx = cards.value.findIndex(c => c.id === card.id)
        if (idx < 0) return

        const next = { ...cards.value[idx]! }
        next.seen += 1

        if (rating === 'again') {
            next.intervalDays = 1
            next.ease = Math.max(1.5, next.ease - 0.2)
        } else if (rating === 'good') {
            next.intervalDays = Math.max(1, Math.round(next.intervalDays * next.ease))
            next.ease = Math.min(2.8, next.ease + 0.05)
            correctRatings.value += 1
        } else {
            next.intervalDays = Math.max(2, Math.round(next.intervalDays * (next.ease + 0.45)))
            next.ease = Math.min(3.0, next.ease + 0.1)
            correctRatings.value += 1
        }

        answeredRatings.value += 1
        next.dueAt = Date.now() + next.intervalDays * 24 * 60 * 60 * 1000

        cards.value[idx] = next
        showAnswer.value = false
        currentIndex.value += 1

        const completed = currentIndex.value >= totalDue.value
        if (completed && answeredRatings.value > 0) {
            const ratio = correctRatings.value / answeredRatings.value
            if (ratio >= 0.8) {
                confetti.trigger(2200)
            }
        }
    }

    function restartDueSession() {
        currentIndex.value = 0
        showAnswer.value = false
        correctRatings.value = 0
        answeredRatings.value = 0
    }

    function exportDeck() {
        const payload = {
            version: 1,
            exportedAt: new Date().toISOString(),
            cards: cards.value,
        }
        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const anchor = document.createElement('a')
        anchor.href = url
        anchor.download = 'cnt4419-flashcards.json'
        anchor.click()
        URL.revokeObjectURL(url)
    }

    async function importDeck(file: File) {
        const text = await file.text()
        const raw = JSON.parse(text) as { cards?: Flashcard[] }
        const imported = Array.isArray(raw.cards) ? raw.cards : []

        const known = new Set(cards.value.map(c => `${c.front}::${c.back}`))
        const additions = imported.filter(card => {
            const key = `${card.front}::${card.back}`
            if (known.has(key)) return false
            known.add(key)
            return true
        })

        cards.value = [...cards.value, ...additions]
    }

    function deleteCard(id: string) {
        const idx = cards.value.findIndex(c => c.id === id)
        if (idx < 0) return
        cards.value.splice(idx, 1)
        // If we deleted the current card or one before it, adjust index
        if (currentIndex.value >= dueCards.value.length) {
            currentIndex.value = Math.max(0, dueCards.value.length - 1)
        }
        showAnswer.value = false
    }

    function clearDeck() {
        cards.value = []
        currentIndex.value = 0
        showAnswer.value = false
        correctRatings.value = 0
        answeredRatings.value = 0
    }

    function toggleAnswer() {
        showAnswer.value = !showAnswer.value
    }

    return {
        model,
        cards,
        hasDeck,
        isGenerating,
        generationError,
        generationProgress,
        generationStatus,
        dueCards,
        totalDue,
        currentCard,
        currentIndex,
        showAnswer,
        completion,
        generate,
        rateCurrent,
        restartDueSession,
        deleteCard,
        clearDeck,
        exportDeck,
        importDeck,
        toggleAnswer,
    }
}
