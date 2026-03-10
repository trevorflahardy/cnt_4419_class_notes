export interface Chapter {
    id: number
    name: string
    emoji: string
    desc: string
    color: string
}

export type Difficulty = 'easy' | 'medium' | 'hard'

export interface McQuestion {
    id: number
    chapter: number
    type: 'mc'
    difficulty: Difficulty
    question: string
    options: string[]
    answer: number
    explanation: string
}

export interface TfQuestion {
    id: number
    chapter: number
    type: 'tf'
    question: string
    answer: boolean
    explanation: string
}

export interface SaQuestion {
    id: number
    chapter: number
    type: 'sa'
    question: string
    answer: string
}

export type BankQuestion = McQuestion | TfQuestion | SaQuestion

interface QuestionBankIndex {
    version: number
    chapters: Chapter[]
    totals: QuestionStats
    chapterStats: Record<string, QuestionStats>
}

interface ChapterPayload {
    version: number
    chapter: number
    questions: BankQuestion[]
}

interface QuestionStats {
    all: number
    mc: number
    tf: number
    sa: number
    easy: number
    medium: number
    hard: number
    mc_easy: number
    mc_medium: number
    mc_hard: number
}

const indexCache = shallowRef<QuestionBankIndex | null>(null)
const chapterQuestionsCache = new Map<number, BankQuestion[]>()

const defaultStats: QuestionStats = {
    all: 0,
    mc: 0,
    tf: 0,
    sa: 0,
    easy: 0,
    medium: 0,
    hard: 0,
    mc_easy: 0,
    mc_medium: 0,
    mc_hard: 0,
}

function cloneStats(stats: Partial<QuestionStats> | undefined): QuestionStats {
    return { ...defaultStats, ...(stats ?? {}) }
}

function shuffleInPlace<T>(arr: T[]) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
            ;[arr[i], arr[j]] = [arr[j]!, arr[i]!]
    }
}

function shuffleMcOptions(question: McQuestion): McQuestion {
    const indexed = question.options.map((opt, i) => ({ opt, i }))
    shuffleInPlace(indexed)
    return {
        ...question,
        options: indexed.map(x => x.opt),
        answer: indexed.findIndex(x => x.i === question.answer),
    }
}

function getStatsForFilters(
    stats: QuestionStats,
    type: 'mc' | 'tf' | 'sa' | 'all',
    difficulty: 'easy' | 'medium' | 'hard' | 'mixed',
): number {
    if (type === 'tf') return stats.tf
    if (type === 'sa') return stats.sa
    if (type === 'mc') {
        if (difficulty === 'mixed') return stats.mc
        return stats[`mc_${difficulty}`]
    }

    // type === 'all'
    if (difficulty === 'mixed') return stats.all
    return stats.tf + stats.sa + stats[`mc_${difficulty}`]
}

export async function loadQuestionBankIndex(): Promise<QuestionBankIndex> {
    if (indexCache.value) return indexCache.value
    const index = await $fetch<QuestionBankIndex>('/question-bank-index.json')
    indexCache.value = {
        ...index,
        totals: cloneStats(index.totals),
        chapterStats: Object.fromEntries(
            Object.entries(index.chapterStats ?? {}).map(([key, value]) => [key, cloneStats(value)]),
        ),
    }
    return indexCache.value
}

export async function getChapters(): Promise<Chapter[]> {
    const index = await loadQuestionBankIndex()
    return index.chapters
}

export async function getTotalQuestionCount(chapterId: number | null = null): Promise<number> {
    const index = await loadQuestionBankIndex()
    if (chapterId === null) return index.totals.all
    return cloneStats(index.chapterStats[String(chapterId)]).all
}

export async function getFilteredQuestionCount(opts: {
    chapter?: number | null
    type?: 'mc' | 'tf' | 'sa' | 'all'
    difficulty?: 'easy' | 'medium' | 'hard' | 'mixed'
}): Promise<number> {
    const index = await loadQuestionBankIndex()
    const type = opts.type ?? 'all'
    const difficulty = opts.difficulty ?? 'mixed'

    if (opts.chapter) {
        const chapterStats = cloneStats(index.chapterStats[String(opts.chapter)])
        return getStatsForFilters(chapterStats, type, difficulty)
    }

    return getStatsForFilters(index.totals, type, difficulty)
}

export async function loadChapterQuestions(chapterId: number): Promise<BankQuestion[]> {
    const cached = chapterQuestionsCache.get(chapterId)
    if (cached) return cached

    const payload = await $fetch<ChapterPayload>(`/question-bank-chapters/chapter-${chapterId}.json`)
    const questions = Array.isArray(payload.questions) ? payload.questions : []
    chapterQuestionsCache.set(chapterId, questions)
    return questions
}

export async function filterQuestions(opts: {
    chapter?: number | null
    type?: 'mc' | 'tf' | 'sa' | 'all'
    difficulty?: 'easy' | 'medium' | 'hard' | 'mixed'
    count?: number
    shuffle?: boolean
}): Promise<BankQuestion[]> {
    const index = await loadQuestionBankIndex()

    const chapterIds = opts.chapter
        ? [opts.chapter]
        : index.chapters.map(ch => ch.id)

    const chapterBuckets = await Promise.all(chapterIds.map(id => loadChapterQuestions(id)))
    let questions = chapterBuckets.flat()

    const type = opts.type ?? 'all'
    const difficulty = opts.difficulty ?? 'mixed'

    if (type !== 'all') questions = questions.filter(q => q.type === type)

    if (difficulty !== 'mixed') {
        questions = questions.filter(q => {
            if (q.type !== 'mc') return true
            return q.difficulty === difficulty
        })
    }

    if (opts.shuffle !== false) {
        shuffleInPlace(questions)
        questions = questions.map(q => (q.type === 'mc' ? shuffleMcOptions(q) : q))
    }

    if (opts.count) questions = questions.slice(0, opts.count)
    return questions
}
