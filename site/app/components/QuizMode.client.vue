<template>
    <div class="mx-auto max-w-3xl px-4 py-8">
        <!-- ==================== SETUP VIEW ==================== -->
        <Transition name="fade-slide" mode="out-in">
            <div v-if="quizState === 'setup'" key="setup" class="space-y-5">
                <!-- Page title -->
                <div class="flex items-center gap-3">
                    <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                        <UIcon name="i-heroicons-academic-cap-solid" class="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <h1 class="text-xl font-bold text-highlighted">Practice Quiz</h1>
                        <p class="text-sm text-muted">AI-generated from your class notes</p>
                    </div>
                </div>

                <!-- WebGPU unavailable -->
                <div v-if="!webGpuAvailable"
                    class="flex items-start gap-3 rounded-xl border border-red-300 bg-red-50 px-4 py-3 dark:border-red-800/50 dark:bg-red-950/30">
                    <UIcon name="i-heroicons-exclamation-triangle" class="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
                    <div>
                        <p class="text-sm font-semibold text-red-700 dark:text-red-400">WebGPU not available</p>
                        <p class="mt-0.5 text-xs text-red-600/80 dark:text-red-400/70">
                            Your browser doesn't support WebGPU. Try Chrome 113+ or Edge 113+. Quiz generation requires
                            it.
                        </p>
                    </div>
                </div>

                <!-- Model not downloaded -->
                <div v-else-if="!modelReady"
                    class="flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 dark:border-amber-800/50 dark:bg-amber-950/30">
                    <UIcon name="i-heroicons-cpu-chip" class="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
                    <div class="flex-1 min-w-0">
                        <p class="text-sm font-semibold text-amber-700 dark:text-amber-400">AI model not downloaded</p>
                        <p class="mt-0.5 text-xs text-amber-600/80 dark:text-amber-400/70">
                            You must download the on-device AI model before generating a quiz.
                        </p>
                        <div v-if="modelLoading" class="mt-2 space-y-1">
                            <UProgress :model-value="modelProgress" size="xs" color="warning" />
                            <p class="text-xs text-amber-600/70 dark:text-amber-400/60">{{ modelProgressText }}</p>
                        </div>
                        <UButton v-if="!modelLoading" size="xs" color="warning" variant="soft" class="mt-2"
                            icon="i-lucide-download" @click="downloadModel">
                            Download AI Model
                        </UButton>
                    </div>
                </div>

                <!-- Settings -->
                <div class="grid gap-4 sm:grid-cols-2">
                    <div class="rounded-xl border border-default bg-default/60 p-4 space-y-3">
                        <p class="text-xs font-semibold uppercase tracking-wider text-muted">Questions</p>
                        <div class="flex flex-wrap gap-2">
                            <button v-for="n in questionCounts" :key="n"
                                class="flex h-9 w-9 items-center justify-center rounded-lg text-sm font-semibold transition-all"
                                :class="numQuestions === n
                                    ? 'bg-primary text-white shadow-sm'
                                    : 'border border-default text-muted hover:border-primary hover:text-primary'"
                                @click="numQuestions = n">
                                {{ n }}
                            </button>
                        </div>
                    </div>
                    <div class="rounded-xl border border-default bg-default/60 p-4 space-y-3">
                        <p class="text-xs font-semibold uppercase tracking-wider text-muted">Difficulty</p>
                        <div class="flex flex-wrap gap-2">
                            <button v-for="d in difficulties" :key="d.value"
                                class="rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all" :class="selectedDifficulty === d.value
                                    ? d.activeClass
                                    : 'border-default text-muted hover:text-highlighted'"
                                @click="selectedDifficulty = d.value">
                                {{ d.label }}
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Topics -->
                <div v-if="availableTopics.length > 0"
                    class="rounded-xl border border-default bg-default/60 p-4 space-y-3">
                    <div class="flex items-center justify-between">
                        <p class="text-xs font-semibold uppercase tracking-wider text-muted">
                            Topics <span class="ml-1 normal-case font-normal text-muted/70">(optional)</span>
                        </p>
                        <button v-if="selectedTopics.length > 0"
                            class="text-xs text-muted hover:text-primary transition-colors"
                            @click="selectedTopics = []">Clear all</button>
                    </div>
                    <div class="flex flex-wrap gap-1.5">
                        <button v-for="topic in availableTopics" :key="topic"
                            class="rounded-full border px-2.5 py-1 text-xs transition-all" :class="selectedTopics.includes(topic)
                                ? 'border-primary bg-primary/10 text-primary font-medium'
                                : 'border-default text-muted hover:border-primary/50 hover:text-primary/80'"
                            @click="toggleTopic(topic)">
                            {{ topic }}
                        </button>
                    </div>
                </div>

                <!-- Generate -->
                <div class="space-y-2">
                    <button
                        class="w-full flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-semibold transition-all"
                        :class="modelReady && !isGenerating
                            ? 'bg-primary text-white shadow-md hover:brightness-110 active:scale-[0.98]'
                            : 'cursor-not-allowed bg-default border border-default text-muted'"
                        :disabled="!modelReady || isGenerating" @click="handleGenerate">
                        <UIcon name="i-lucide-sparkles" class="h-4 w-4" />
                        {{ isGenerating ? 'Generating...' : 'Generate Quiz' }}
                    </button>
                    <p v-if="generationError"
                        class="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600 dark:border-red-800/40 dark:bg-red-950/30 dark:text-red-400">
                        <UIcon name="i-heroicons-exclamation-circle" class="h-3.5 w-3.5 shrink-0" />
                        {{ generationError }}
                    </p>
                </div>
            </div>

            <!-- LOADING -->
            <div v-else-if="quizState === 'loading'" key="loading"
                class="flex min-h-[50vh] flex-col items-center justify-center gap-8">
                <div class="relative flex h-20 w-20 items-center justify-center">
                    <div class="absolute inset-0 rounded-full bg-primary/10 animate-ping" />
                    <div class="relative flex h-16 w-16 items-center justify-center rounded-full bg-primary/15">
                        <UIcon name="i-lucide-sparkles" class="h-8 w-8 text-primary animate-pulse" />
                    </div>
                </div>
                <div class="text-center space-y-2 max-w-xs">
                    <h3 class="text-lg font-bold text-highlighted">Generating your quiz…</h3>
                    <Transition name="fade" mode="out-in">
                        <p :key="currentLoadingMessage" class="text-sm text-muted">{{ currentLoadingMessage }}</p>
                    </Transition>
                </div>
                <div class="flex gap-1.5">
                    <div v-for="i in 3" :key="i" class="h-1.5 w-1.5 rounded-full bg-primary/40 animate-bounce"
                        :style="{ animationDelay: `${(i - 1) * 150}ms` }" />
                </div>
            </div>

            <!-- ACTIVE -->
            <div v-else-if="quizState === 'active'" key="active" class="space-y-5">
                <!-- Progress -->
                <div class="space-y-1.5">
                    <div class="flex items-center justify-between text-xs font-medium text-muted">
                        <span>Question {{ currentQuestionIndex + 1 }}<span class="text-muted/50"> / {{ questions.length
                        }}</span></span>
                        <span>{{ answeredCount }} answered</span>
                    </div>
                    <div class="h-1.5 w-full overflow-hidden rounded-full bg-default">
                        <div class="h-full rounded-full bg-primary transition-all duration-500"
                            :style="{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }" />
                    </div>
                </div>

                <!-- Question card -->
                <Transition name="fade-slide" mode="out-in">
                    <div :key="currentQuestionIndex"
                        class="rounded-2xl border border-default bg-default/70 p-5 sm:p-6 space-y-5">
                        <div class="flex flex-wrap items-center gap-2">
                            <span class="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                                {{ currentQuestion?.difficulty }}
                            </span>
                            <span class="rounded-full border border-default px-2.5 py-0.5 text-xs text-muted">
                                {{ currentQuestion?.topic }}
                            </span>
                        </div>
                        <p class="text-base font-semibold leading-relaxed text-highlighted sm:text-lg">
                            {{ currentQuestion?.question }}
                        </p>
                        <div class="space-y-2.5">
                            <button v-for="(option, idx) in currentQuestion?.options" :key="idx"
                                class="group w-full flex items-center gap-3 rounded-xl border-2 px-4 py-3 text-left text-sm transition-all duration-150 focus:outline-none"
                                :class="answerOptionClass(idx)" :disabled="userAnswers[currentQuestionIndex] !== null"
                                @click="handleSelectAnswer(idx)">
                                <span
                                    class="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold transition-colors"
                                    :class="answerLetterClass(idx)">
                                    {{ letters[idx] }}
                                </span>
                                <span class="flex-1 leading-snug">{{ stripPrefix(option) }}</span>
                                <span v-if="userAnswers[currentQuestionIndex] !== null">
                                    <UIcon v-if="idx === currentQuestion?.correctIndex"
                                        name="i-heroicons-check-circle-solid" class="h-5 w-5 text-green-500" />
                                    <UIcon v-else-if="idx === userAnswers[currentQuestionIndex]"
                                        name="i-heroicons-x-circle-solid" class="h-5 w-5 text-red-500" />
                                </span>
                            </button>
                        </div>
                        <Transition name="fade">
                            <div v-if="userAnswers[currentQuestionIndex] !== null && currentQuestion?.explanation"
                                class="flex gap-2.5 rounded-xl border border-amber-400/20 bg-amber-500/[0.08] px-4 py-3">
                                <UIcon name="i-heroicons-light-bulb" class="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                                <p class="text-sm leading-relaxed text-muted">{{ currentQuestion?.explanation }}</p>
                            </div>
                        </Transition>
                    </div>
                </Transition>

                <!-- Navigation -->
                <div class="flex items-center justify-between gap-3">
                    <button
                        class="flex items-center gap-1.5 rounded-lg border border-default px-3 py-2 text-sm text-muted transition hover:border-primary/50 hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
                        :disabled="currentQuestionIndex === 0" @click="prevQuestion()">
                        <UIcon name="i-heroicons-chevron-left" class="h-4 w-4" /> Back
                    </button>
                    <div class="flex flex-wrap justify-center gap-1.5">
                        <button v-for="(_, qi) in questions" :key="qi"
                            class="h-2.5 w-2.5 rounded-full border-2 transition-all duration-200"
                            :class="dotClasses(qi)" @click="goToQuestion(qi)" />
                    </div>
                    <button v-if="currentQuestionIndex < questions.length - 1"
                        class="flex items-center gap-1.5 rounded-lg border border-default px-3 py-2 text-sm text-muted transition hover:border-primary/50 hover:text-primary"
                        @click="nextQuestion()">
                        Next
                        <UIcon name="i-heroicons-chevron-right" class="h-4 w-4" />
                    </button>
                    <button v-else
                        class="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:brightness-110"
                        @click="finishQuiz()">
                        Finish
                        <UIcon name="i-heroicons-flag" class="h-4 w-4" />
                    </button>
                </div>
            </div>

            <!-- REVIEW -->
            <div v-else-if="quizState === 'review'" key="review" class="space-y-6">
                <div class="overflow-hidden rounded-2xl border border-default">
                    <div
                        class="flex flex-col items-center gap-4 bg-gradient-to-br from-primary/10 via-transparent to-transparent px-6 py-8">
                        <ScoreDisplay :score="score.correct" :total="score.total" :percentage="score.percentage" />
                        <p class="max-w-sm text-center text-sm text-muted">
                            {{ score.percentage >= 80 ? '🎉 Excellent work — you nailed it!'
                                : score.percentage >= 60 ? 'Good effort. Review the missed questions below.'
                                    : 'Keep studying and try again soon!' }}
                        </p>
                    </div>
                </div>

                <!-- Topic breakdown -->
                <div v-if="topicBreakdown.length > 1"
                    class="rounded-2xl border border-default bg-default/60 p-5 space-y-4">
                    <div class="flex items-center gap-2">
                        <UIcon name="i-heroicons-chart-bar" class="h-4 w-4 text-muted" />
                        <p class="text-sm font-semibold text-highlighted">Performance by Topic</p>
                    </div>
                    <div class="space-y-3">
                        <div v-for="tb in topicBreakdown" :key="tb.topic">
                            <div class="mb-1 flex items-center justify-between text-xs">
                                <span class="max-w-[70%] truncate font-medium text-muted">{{ tb.topic }}</span>
                                <span class="tabular-nums font-semibold" :class="tb.color">{{ tb.correct }}/{{ tb.total
                                }}</span>
                            </div>
                            <div class="h-1.5 w-full overflow-hidden rounded-full bg-default">
                                <div class="h-full rounded-full transition-all duration-700" :class="tb.barClass"
                                    :style="{ width: `${tb.total > 0 ? (tb.correct / tb.total) * 100 : 0}%` }" />
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Question review -->
                <div class="overflow-hidden rounded-2xl border border-default">
                    <div class="flex items-center gap-2 border-b border-default px-5 py-3">
                        <UIcon name="i-heroicons-clipboard-document-list" class="h-4 w-4 text-muted" />
                        <p class="text-sm font-semibold text-highlighted">Full Question Review</p>
                    </div>
                    <div class="divide-y divide-default">
                        <div v-for="(q, qi) in questions" :key="qi" class="space-y-3 px-5 py-4">
                            <div class="flex items-start gap-3">
                                <span
                                    class="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                                    :class="userAnswers[qi] === q.correctIndex ? 'bg-green-500' : 'bg-red-500'">
                                    {{ qi + 1 }}
                                </span>
                                <p class="text-sm font-medium leading-relaxed text-highlighted">{{ q.question }}</p>
                            </div>
                            <div class="ml-9 space-y-1.5">
                                <div v-for="(opt, oi) in q.options" :key="oi"
                                    class="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs"
                                    :class="reviewOptionClass(qi, oi)">
                                    <UIcon v-if="oi === q.correctIndex" name="i-heroicons-check-circle-solid"
                                        class="h-3.5 w-3.5 shrink-0 text-green-500" />
                                    <UIcon v-else-if="oi === userAnswers[qi] && oi !== q.correctIndex"
                                        name="i-heroicons-x-circle-solid" class="h-3.5 w-3.5 shrink-0 text-red-500" />
                                    <span v-else class="h-3.5 w-3.5 shrink-0" />
                                    <span>{{ stripPrefix(opt) }}</span>
                                </div>
                            </div>
                            <div v-if="userAnswers[qi] !== q.correctIndex && q.explanation"
                                class="ml-9 flex gap-2 rounded-lg border border-amber-400/20 bg-amber-500/[0.08] px-3 py-2">
                                <UIcon name="i-heroicons-light-bulb"
                                    class="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
                                <p class="text-xs leading-relaxed text-muted">{{ q.explanation }}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Actions -->
                <div class="flex flex-col gap-3 sm:flex-row sm:justify-center">
                    <button
                        class="flex items-center justify-center gap-2 rounded-xl border border-default px-6 py-2.5 text-sm font-medium text-muted transition hover:border-primary/50 hover:text-primary"
                        @click="resetQuiz()">
                        <UIcon name="i-heroicons-arrow-path" class="h-4 w-4" /> Retake Quiz
                    </button>
                    <button
                        class="flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-110"
                        @click="handleNewQuiz()">
                        <UIcon name="i-lucide-sparkles" class="h-4 w-4" /> New Quiz
                    </button>
                </div>
            </div>
        </Transition>
    </div>
</template>

<script setup lang="ts">
import { useAiModel } from '../composables/useAiModel';

const {
    quizState,
    questions,
    currentQuestionIndex,
    userAnswers,
    score,
    generateQuiz,
    submitAnswer,
    nextQuestion,
    prevQuestion,
    finishQuiz,
    resetQuiz,
    isGenerating,
    generationError,
    availableTopics,
} = useQuiz()
const model = useAiModel()
const confetti = useConfetti()
const modelReady = computed(() => model.isReady.value)
const modelLoading = computed(() => model.isLoading.value)
const modelProgress = computed(() => model.progress.value)
const modelProgressText = computed(() => model.progressText.value)
const webGpuAvailable = computed(() => model.isAvailable.value)

// ─── Setup state ───
const questionCounts = [5, 10, 15, 20]
const numQuestions = ref(10)
const selectedDifficulty = ref<'easy' | 'medium' | 'hard' | 'mixed'>('mixed')
const selectedTopics = ref<string[]>([])

const letters = ['A', 'B', 'C', 'D']

const difficulties = [
    { value: 'easy', label: 'Easy', activeClass: 'border-green-500 bg-green-500/10 text-green-600 dark:text-green-400' },
    { value: 'medium', label: 'Medium', activeClass: 'border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400' },
    { value: 'hard', label: 'Hard', activeClass: 'border-red-500 bg-red-500/10 text-red-600 dark:text-red-400' },
    { value: 'mixed', label: 'Mixed', activeClass: 'border-primary bg-primary/10 text-primary' },
]

function toggleTopic(topic: string) {
    const idx = selectedTopics.value.indexOf(topic)
    if (idx >= 0) {
        selectedTopics.value.splice(idx, 1)
    } else {
        selectedTopics.value.push(topic)
    }
}

function handleGenerate() {
    if (!modelReady.value) return
    generateQuiz({
        numQuestions: numQuestions.value,
        difficulty: selectedDifficulty.value,
        topics: selectedTopics.value,
    })
}

async function downloadModel() {
    try {
        await model.init()
    } catch {
        // handled by model state
    }
}

// ─── Loading messages ───
const loadingMessages = [
    'Reading through your notes...',
    'Crafting challenging questions...',
    'Double-checking answers...',
    'Almost ready...',
]
const loadingMsgIdx = ref(0)
const currentLoadingMessage = computed(() => loadingMessages[loadingMsgIdx.value])

let loadingInterval: ReturnType<typeof setInterval> | null = null

watch(quizState, (state) => {
    if (state === 'loading') {
        loadingMsgIdx.value = 0
        loadingInterval = setInterval(() => {
            loadingMsgIdx.value = (loadingMsgIdx.value + 1) % loadingMessages.length
        }, 2200)
    } else if (state === 'review' && score.value.percentage >= 80) {
        confetti.trigger(2200)
    } else if (loadingInterval) {
        clearInterval(loadingInterval)
        loadingInterval = null
    }
})

onUnmounted(() => {
    if (loadingInterval) clearInterval(loadingInterval)
})

// ─── Active quiz helpers ───
const currentQuestion = computed(() => questions.value[currentQuestionIndex.value])
const answeredCount = computed(() => userAnswers.value.filter(a => a !== null).length)

function stripPrefix(option: string) {
    return option.replace(/^[A-D][).\s]*/i, '')
}

function handleSelectAnswer(idx: number) { submitAnswer(idx) }

function goToQuestion(qi: number) {
    const diff = qi - currentQuestionIndex.value
    if (diff > 0) for (let i = 0; i < diff; i++) nextQuestion()
    else if (diff < 0) for (let i = 0; i < Math.abs(diff); i++) prevQuestion()
}

function dotClasses(qi: number) {
    if (qi === currentQuestionIndex.value) return 'border-primary bg-primary scale-125'
    if (userAnswers.value[qi] !== null) return 'border-primary/50 bg-primary/30'
    return 'border-default bg-transparent'
}

function answerOptionClass(idx: number) {
    const answered = userAnswers.value[currentQuestionIndex.value] !== null
    const correct = currentQuestion.value?.correctIndex
    const selected = userAnswers.value[currentQuestionIndex.value]
    if (!answered) return 'border-default hover:border-primary/60 hover:bg-primary/5 cursor-pointer'
    if (idx === correct) return 'border-green-500/60 bg-green-500/[0.07]'
    if (idx === selected) return 'border-red-500/60 bg-red-500/[0.07]'
    return 'border-default opacity-50'
}

function answerLetterClass(idx: number) {
    const answered = userAnswers.value[currentQuestionIndex.value] !== null
    const correct = currentQuestion.value?.correctIndex
    const selected = userAnswers.value[currentQuestionIndex.value]
    if (!answered) return 'bg-default border border-default group-hover:border-primary/50 group-hover:text-primary text-muted'
    if (idx === correct) return 'bg-green-500 text-white'
    if (idx === selected) return 'bg-red-500 text-white'
    return 'bg-default text-muted'
}

interface TopicBreakdown { topic: string; correct: number; total: number; color: string; barClass: string }

const topicBreakdown = computed<TopicBreakdown[]>(() => {
    const map = new Map<string, { correct: number; total: number }>()
    questions.value.forEach((q, i) => {
        if (!map.has(q.topic)) map.set(q.topic, { correct: 0, total: 0 })
        const entry = map.get(q.topic)!
        entry.total++
        if (userAnswers.value[i] === q.correctIndex) entry.correct++
    })
    return Array.from(map.entries()).map(([topic, data]) => {
        const pct = data.total > 0 ? (data.correct / data.total) * 100 : 0
        return {
            topic, ...data,
            color: pct >= 80 ? 'text-green-500' : pct >= 60 ? 'text-amber-500' : 'text-red-500',
            barClass: pct >= 80 ? 'bg-green-500' : pct >= 60 ? 'bg-amber-500' : 'bg-red-500',
        }
    })
})

function reviewOptionClass(qi: number, oi: number) {
    const correct = questions.value[qi]?.correctIndex
    const userAns = userAnswers.value[qi]
    if (oi === correct) return 'bg-green-500/10 font-medium text-green-700 dark:text-green-400'
    if (oi === userAns && oi !== correct) return 'bg-red-500/10 text-red-700 dark:text-red-400'
    return 'text-muted'
}

function handleNewQuiz() {
    resetQuiz()
    // quizState resets to 'setup' via composable
}
</script>

<style scoped>
.fade-slide-enter-active {
    transition: all 0.3s ease-out;
}

.fade-slide-leave-active {
    transition: all 0.2s ease-in;
}

.fade-slide-enter-from {
    opacity: 0;
    transform: translateY(10px);
}

.fade-slide-leave-to {
    opacity: 0;
    transform: translateY(-8px);
}

.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.25s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}
</style>
