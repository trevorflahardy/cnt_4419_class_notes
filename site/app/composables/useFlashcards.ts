import { useAiModel } from '../composables/useAiModel';

interface Flashcard {
    id: string
    front: string
    back: string
    topic: string
    tags: string[]
    intervalDays: number
    ease: number
    dueAt: number
    seen: number
}

interface GenerateFlashcardsConfig {
    count: number
    focus: string
}

interface FlashcardRating {
    quality: 'again' | 'good' | 'easy'
}

function safeJsonArray<T>(text: string): T[] {
    const match = text.match(/\[[\s\S]*\]/)
    if (!match) return []

    try {
        const parsed = JSON.parse(match[0]) as T[]
        return Array.isArray(parsed) ? parsed : []
    } catch {
        return []
    }
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

export function useFlashcards() {
    const rag = useRag()
    const model = useAiModel()
    const confetti = useConfetti()

    const cards = useState<Flashcard[]>('flashcards-cards', () => loadFromStorage())
    const isGenerating = useState<boolean>('flashcards-is-generating', () => false)
    const generationError = useState<string>('flashcards-generation-error', () => '')
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

        try {
            await ensureReady()
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
            for await (const token of stream) {
                response += token
            }

            const parsed = safeJsonArray<{ front: string; back: string; topic?: string; tags?: string[] }>(response)
            const next = normalizeCards(parsed).slice(0, config.count)
            if (next.length === 0) {
                throw new Error('AI returned invalid flashcards. Please try again.')
            }

            cards.value = append ? [...cards.value, ...next] : next
            currentIndex.value = 0
            showAnswer.value = false
            correctRatings.value = 0
            answeredRatings.value = 0
        } catch (err) {
            generationError.value = err instanceof Error ? err.message : 'Failed to generate flashcards.'
        } finally {
            isGenerating.value = false
        }
    }

    function rateCurrent(rating: FlashcardRating['quality']) {
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

    function toggleAnswer() {
        showAnswer.value = !showAnswer.value
    }

    return {
        model,
        cards,
        hasDeck,
        isGenerating,
        generationError,
        dueCards,
        totalDue,
        currentCard,
        currentIndex,
        showAnswer,
        completion,
        generate,
        rateCurrent,
        restartDueSession,
        exportDeck,
        importDeck,
        toggleAnswer,
    }
}
