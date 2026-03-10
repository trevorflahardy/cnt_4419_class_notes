import { filterQuestions, getChapters, type BankQuestion, type Chapter, type McQuestion } from './useQuestionBank'

export type SaGrade = 'correct' | 'partial' | 'incorrect'
export type QuizView = 'setup' | 'active' | 'review'

export const LEVELS = [
  { min: 0, name: 'Rookie', emoji: '🌱' },
  { min: 100, name: 'Learner', emoji: '📚' },
  { min: 250, name: 'Coder', emoji: '💻' },
  { min: 500, name: 'Defender', emoji: '🛡️' },
  { min: 900, name: 'Expert', emoji: '⚡' },
  { min: 1400, name: 'Master', emoji: '🏆' },
] as const

// ── Module-level state: persists across tab switches ──
const view = ref<QuizView>('setup')
const questions = ref<BankQuestion[]>([])
const currentIdx = ref(0)
const answers = ref<(number | boolean | string | null)[]>([])
const saSubmitted = ref<boolean[]>([])
const saGrades = ref<Record<number, SaGrade>>({})
const aiExplanations = ref<Record<number, string>>({})
const isExplaining = ref<Record<number, boolean>>({})
const explainError = ref<Record<number, string>>({})
const xpThisRound = ref(0)
const isPreparingQuiz = ref(false)
const prepareQuizError = ref('')
const chapters = ref<Chapter[]>([])

// Config (persists between sessions)
const selectedChapter = ref<number | null>(null)
const selectedType = ref<'mc' | 'tf' | 'sa' | 'all'>('all')
const selectedDifficulty = ref<'easy' | 'medium' | 'hard' | 'mixed'>('mixed')
const questionCount = ref(10)

// XP — persisted in localStorage
const xp = ref(0)
if (import.meta.client) {
  xp.value = parseInt(localStorage.getItem('quiz-xp') ?? '0') || 0
}

watch(xp, val => {
  if (import.meta.client) localStorage.setItem('quiz-xp', String(val))
})

// ── Derived state ──
const currentLevel = computed(() => {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp.value >= LEVELS[i]!.min) return LEVELS[i]!
  }
  return LEVELS[0]!
})

const nextLevel = computed(() => {
  for (const level of LEVELS) {
    if (xp.value < level.min) return level
  }
  return null
})

const xpToNextLevel = computed(() => (nextLevel.value ? nextLevel.value.min - xp.value : 0))

const currentQuestion = computed(() => questions.value[currentIdx.value] ?? null)
const currentAnswer = computed(() => answers.value[currentIdx.value] ?? null)
const isAnswered = computed(() => {
  const a = answers.value[currentIdx.value]
  return a !== null && a !== undefined
})

const score = computed(() => {
  const total = questions.value.length
  let correct = 0, partial = 0
  questions.value.forEach((q, i) => {
    const ans = answers.value[i]
    if (q.type === 'mc' && ans === (q as McQuestion).answer) correct++
    else if (q.type === 'tf' && ans === q.answer) correct++
    else if (q.type === 'sa') {
      const g = saGrades.value[q.id]
      if (g === 'correct') correct++
      else if (g === 'partial') partial++
    }
  })
  const pct = total > 0 ? Math.round(((correct + partial * 0.5) / total) * 100) : 0
  return { correct, partial, total, percentage: pct }
})

const chapterBreakdown = computed(() => {
  const map = new Map<number, { correct: number; total: number; chapterId: number }>()
  questions.value.forEach((q, i) => {
    if (!map.has(q.chapter)) map.set(q.chapter, { correct: 0, total: 0, chapterId: q.chapter })
    const e = map.get(q.chapter)!
    e.total++
    if (isCorrectAnswer(i)) e.correct++
  })
  return Array.from(map.values()).map(e => {
    const ch = chapters.value.find(c => c.id === e.chapterId)
    const pct = e.total > 0 ? (e.correct / e.total) * 100 : 0
    return { ...e, name: ch?.name ?? 'Unknown', emoji: ch?.emoji ?? '📚', pct }
  })
})

async function ensureChaptersLoaded() {
  if (chapters.value.length > 0) return
  chapters.value = await getChapters()
}

// ── Pure actions (no composable deps) ──
function isCorrectAnswer(idx: number): boolean {
  const q = questions.value[idx]
  if (!q) return false
  const ans = answers.value[idx]
  if (q.type === 'mc') return ans === (q as McQuestion).answer
  if (q.type === 'tf') return ans === q.answer
  if (q.type === 'sa') return saGrades.value[q.id] === 'correct' || saGrades.value[q.id] === 'partial'
  return false
}

function awardXp(amount: number) {
  xp.value += amount
  xpThisRound.value += amount
}

async function startQuiz() {
  isPreparingQuiz.value = true
  prepareQuizError.value = ''

  try {
    await ensureChaptersLoaded()
    const qs = await filterQuestions({
      chapter: selectedChapter.value,
      type: selectedType.value,
      difficulty: selectedDifficulty.value,
      count: questionCount.value,
      shuffle: true,
    })

    questions.value = qs
    currentIdx.value = 0
    answers.value = new Array(qs.length).fill(null)
    saSubmitted.value = new Array(qs.length).fill(false)
    saGrades.value = {}
    aiExplanations.value = {}
    isExplaining.value = {}
    explainError.value = {}
    xpThisRound.value = 0
    view.value = 'active'
  } catch (err) {
    prepareQuizError.value = err instanceof Error ? err.message : 'Failed to load quiz questions.'
  } finally {
    isPreparingQuiz.value = false
  }
}

function submitMcAnswer(optionIdx: number) {
  if (isAnswered.value) return
  answers.value[currentIdx.value] = optionIdx
  const q = currentQuestion.value
  if (!q || q.type !== 'mc') return
  awardXp(optionIdx === (q as McQuestion).answer ? 10 : 2)
}

function submitTfAnswer(val: boolean) {
  if (isAnswered.value) return
  answers.value[currentIdx.value] = val
  const q = currentQuestion.value
  if (!q || q.type !== 'tf') return
  awardXp(val === q.answer ? 8 : 2)
}

function submitSaText(text: string) {
  if (saSubmitted.value[currentIdx.value]) return
  answers.value[currentIdx.value] = text
  saSubmitted.value[currentIdx.value] = true
}

function selfGradeSa(grade: SaGrade) {
  const q = currentQuestion.value
  if (!q || q.type !== 'sa') return
  saGrades.value[q.id] = grade
  awardXp({ correct: 15, partial: 8, incorrect: 2 }[grade])
}

function nextQuestion() { if (currentIdx.value < questions.value.length - 1) currentIdx.value++ }
function prevQuestion() { if (currentIdx.value > 0) currentIdx.value-- }
function goToQuestion(idx: number) { currentIdx.value = Math.max(0, Math.min(idx, questions.value.length - 1)) }

function resetQuiz() {
  view.value = 'setup'
  questions.value = []
  currentIdx.value = 0
  answers.value = []
  saSubmitted.value = []
  saGrades.value = {}
  aiExplanations.value = {}
  isExplaining.value = {}
  explainError.value = {}
}

export function useStaticQuiz() {
  // Composables that need setup context live here
  const rag = useRag()
  const model = useAiModel()
  const confetti = useConfetti()

  function finishQuiz() {
    view.value = 'review'
    if (score.value.percentage >= 80) confetti.trigger(2000)
  }

  async function explainWithAI(questionIdx: number) {
    const q = questions.value[questionIdx]
    if (!q || isExplaining.value[q.id]) return

    isExplaining.value = { ...isExplaining.value, [q.id]: true }
    explainError.value = { ...explainError.value, [q.id]: '' }

    try {
      if (!rag.isLoaded.value) await rag.load()
      if (!model.isReady.value) await model.init()

      const searchText = q.question + (q.type === 'mc' ? ' ' + q.options.join(' ') : '')
      const results = rag.searchByText(searchText, 3)
      const context = results.map((r, i) => `[${i + 1}] ${r.heading}: ${r.text}`).join('\n\n')

      let correctAnswerText = ''
      if (q.type === 'mc') correctAnswerText = q.options[(q as McQuestion).answer] ?? ''
      else if (q.type === 'tf') correctAnswerText = q.answer ? 'TRUE' : 'FALSE'

      const prompt = `You are a teaching assistant for a Secure Coding course (CNT 4419).

A student got this question wrong. Explain clearly why the correct answer is right.

QUESTION: ${q.question}
CORRECT ANSWER: ${correctAnswerText}
${'explanation' in q ? `HINT: ${(q as any).explanation}` : ''}

RELEVANT COURSE NOTES:
${context || 'No relevant excerpts found.'}

Give a 2-3 sentence explanation that helps the student understand the key concept. Be direct and clear.`

      let response = ''
      const stream = model.chat([
        { role: 'system', content: 'You are a concise, helpful teaching assistant for a secure coding course. Answer in 2-3 sentences.' },
        { role: 'user', content: prompt },
      ])
      for await (const token of stream) {
        response += token
        aiExplanations.value = { ...aiExplanations.value, [q.id]: response }
      }
    } catch (err) {
      explainError.value = {
        ...explainError.value,
        [q.id]: err instanceof Error ? err.message : 'Failed to generate explanation.',
      }
    } finally {
      isExplaining.value = { ...isExplaining.value, [q.id]: false }
    }
  }

  return {
    // Config
    selectedChapter, selectedType, selectedDifficulty, questionCount, chapters,
    // State
    view, questions, currentIdx, answers, saSubmitted, saGrades,
    aiExplanations, isExplaining, explainError,
    // Derived
    currentQuestion, currentAnswer, isAnswered, score, chapterBreakdown,
    // XP
    xp, xpThisRound, currentLevel, nextLevel, xpToNextLevel, LEVELS,
    // Loading state
    isPreparingQuiz, prepareQuizError,
    // Actions
    startQuiz, submitMcAnswer, submitTfAnswer, submitSaText, selfGradeSa,
    nextQuestion, prevQuestion, goToQuestion, finishQuiz, resetQuiz,
    explainWithAI, isCorrectAnswer,
    // Model availability for UI
    modelAvailable: model.isAvailable,
  }
}
