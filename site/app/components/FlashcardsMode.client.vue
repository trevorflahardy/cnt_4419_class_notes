<template>
    <div class="mx-auto max-w-4xl px-4 py-6 sm:py-10 space-y-6">
        <UCard>
            <template #header>
                <div class="flex items-center justify-between gap-3">
                    <div>
                        <h2 class="text-xl font-semibold text-highlighted">AI Flashcards</h2>
                        <p class="text-sm text-muted">Generate, import, export, and smart-learn your deck.</p>
                    </div>
                    <UBadge color="primary" variant="subtle">Smart Learn</UBadge>
                </div>
            </template>

            <!-- WebGPU unavailable banner -->
            <div v-if="!webGpuAvailable"
                class="mb-3 flex items-start gap-3 rounded-xl border border-red-300 bg-red-50 px-4 py-3">
                <UIcon name="i-heroicons-exclamation-triangle" class="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
                <div>
                    <p class="text-sm font-semibold text-red-700">WebGPU not available</p>
                    <p class="mt-0.5 text-xs text-red-600/80">
                        Your browser doesn't support WebGPU. Try Chrome 113+ or Edge 113+. AI flashcard generation
                        requires it.
                    </p>
                </div>
            </div>

            <!-- Model not downloaded banner -->
            <div v-else-if="!modelReady"
                class="mb-3 flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3">
                <UIcon name="i-heroicons-cpu-chip" class="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
                <div class="flex-1 min-w-0">
                    <p class="text-sm font-semibold text-amber-700">AI model not downloaded</p>
                    <p class="mt-0.5 text-xs text-amber-600/80">
                        Download the on-device AI model to generate flashcards.
                    </p>
                    <div v-if="modelLoading" class="mt-2 space-y-1">
                        <UProgress :model-value="modelProgress" size="xs" color="warning" />
                        <p class="text-xs text-amber-600/70">{{ modelProgressText }}</p>
                    </div>
                    <UButton v-if="!modelLoading" size="xs" color="warning" variant="soft" class="mt-2"
                        icon="i-lucide-download" @click="downloadModel">
                        Download AI Model
                    </UButton>
                </div>
            </div>

            <div class="grid gap-3 md:grid-cols-[1fr_140px_auto]">
                <UInput v-model="focus" placeholder="Optional focus (e.g., SQL injection, authz)" />
                <UInput v-model.number="count" type="number" min="1" max="100" />
                <div class="flex gap-2">
                    <UButton color="primary" :loading="isGenerating" :disabled="!modelReady || isGenerating"
                        icon="i-lucide-sparkles" @click="generateDeck">
                        Generate
                    </UButton>
                    <UButton color="neutral" variant="soft" :loading="isGenerating"
                        :disabled="!modelReady || isGenerating || !hasDeck" icon="i-lucide-plus" @click="addMore">
                        Add
                    </UButton>
                </div>
            </div>

            <div class="mt-4 flex flex-wrap items-center gap-2">
                <UButton color="primary" variant="soft" :loading="modelLoading"
                    :disabled="modelReady || !webGpuAvailable" icon="i-lucide-download" @click="downloadModel">
                    {{ modelReady ? 'AI Downloaded' : 'Download AI Model' }}
                </UButton>
                <UButton color="neutral" variant="ghost" icon="i-lucide-file-down" :disabled="!hasDeck"
                    @click="exportDeck">
                    Export Deck
                </UButton>
                <label class="inline-flex">
                    <input class="hidden" type="file" accept="application/json" @change="onImport" />
                    <UButton color="neutral" variant="ghost" icon="i-lucide-file-up" as="span">
                        Import Deck
                    </UButton>
                </label>
                <UButton color="neutral" variant="outline" icon="i-lucide-rotate-ccw" :disabled="totalDue === 0"
                    @click="restartDueSession">
                    Restart Due Session
                </UButton>
                <UButton color="error" variant="soft" icon="i-lucide-trash-2" :disabled="!hasDeck"
                    @click="confirmClearDeck">
                    Clear Deck
                </UButton>
            </div>

            <div v-if="isGenerating" class="mt-3 rounded-lg border border-default bg-default/60 px-3 py-2">
                <div class="mb-1 flex items-center justify-between text-xs text-muted">
                    <span>{{ generationStatus || 'Generating flashcards...' }}</span>
                    <span class="tabular-nums">{{ generationProgress }}%</span>
                </div>
                <UProgress :model-value="generationProgress" size="xs" color="primary" />
            </div>

            <p v-if="generationError" class="mt-3 text-sm text-rose-500">{{ generationError }}</p>

            <!-- How it works info -->
            <details class="mt-3 text-xs text-muted">
                <summary class="cursor-pointer hover:text-highlighted transition-colors font-medium">How spaced
                    repetition works
                </summary>
                <div class="mt-2 space-y-1 pl-2 border-l-2 border-default">
                    <p><strong>Again</strong> — card resets to 1-day interval (you forgot it).</p>
                    <p><strong>Good</strong> — interval grows gradually (normal recall).</p>
                    <p><strong>Easy</strong> — interval jumps further (you knew it instantly).</p>
                    <p>Cards are scheduled for review based on your ratings. Forgotten cards appear sooner; well-known
                        cards are
                        shown less often.</p>
                </div>
            </details>
        </UCard>

        <UCard v-if="hasDeck">
            <template #header>
                <div class="flex items-center justify-between text-sm">
                    <span class="text-highlighted font-medium">Due Cards: {{ totalDue }}</span>
                    <span class="text-muted">{{ completion }}% complete</span>
                </div>
                <UProgress :model-value="completion" class="mt-2" size="xs" color="primary" />
            </template>

            <!-- Card position indicator -->
            <div v-if="totalDue > 0" class="flex items-center justify-between text-xs text-muted mb-1">
                <span>Card {{ Math.min(currentIndex + 1, totalDue) }} of {{ totalDue }}</span>
                <span>Tap the card to reveal the answer</span>
            </div>

            <div v-if="currentCard" class="space-y-4">
                <button
                    class="group w-full rounded-xl border border-default bg-default/60 px-5 py-8 text-left transition hover:border-primary relative overflow-hidden"
                    @click="toggleAnswer">
                    <!-- Side indicator -->
                    <div class="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl transition-colors"
                        :class="showAnswer ? 'bg-green-500' : 'bg-primary'" />
                    <p class="mb-2 text-xs uppercase tracking-wide text-muted pl-2">
                        {{ showAnswer ? '🔓 Answer' : '❓ Question' }}
                    </p>
                    <p class="text-lg font-medium text-highlighted pl-2">
                        {{ showAnswer ? currentCard.back : currentCard.front }}
                    </p>
                    <p class="mt-3 text-xs text-muted pl-2">Topic: {{ currentCard.topic }}</p>
                    <p v-if="!showAnswer"
                        class="mt-2 text-[11px] text-muted/60 pl-2 group-hover:text-muted transition-colors">
                        Click to reveal answer
                    </p>
                </button>

                <div class="flex flex-wrap gap-2">
                    <p class="w-full text-xs text-muted mb-0.5">Rate your recall:</p>
                    <UButton color="error" variant="soft" :disabled="!showAnswer" @click="rateCurrent('again')">
                        🔁 Again
                    </UButton>
                    <UButton color="primary" variant="soft" :disabled="!showAnswer" @click="rateCurrent('good')">
                        👍 Good
                    </UButton>
                    <UButton color="info" variant="soft" :disabled="!showAnswer" @click="rateCurrent('easy')">
                        ⚡ Easy
                    </UButton>
                    <UButton color="neutral" variant="ghost" @click="toggleAnswer">
                        {{ showAnswer ? 'Hide Answer' : 'Show Answer' }}
                    </UButton>
                    <UButton color="error" variant="ghost" size="xs" icon="i-lucide-trash-2"
                        @click="deleteCard(currentCard!.id)" title="Delete this card">
                        Delete
                    </UButton>
                </div>
            </div>

            <div v-else class="rounded-xl border border-default bg-default/60 p-6 text-center space-y-2">
                <UIcon name="i-heroicons-check-circle" class="h-8 w-8 text-green-500 mx-auto" />
                <p class="text-sm font-medium text-highlighted">Session complete!</p>
                <p class="text-xs text-muted">No more cards are due right now. Cards you rated "Again" will reappear
                    sooner.
                    Restart the session or generate more cards to keep studying.</p>
            </div>
        </UCard>
    </div>
</template>

<script setup lang="ts">
const {
    model,
    hasDeck,
    isGenerating,
    generationError,
    generationProgress,
    generationStatus,
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
} = useFlashcards()

const count = ref(20)
const focus = ref('')
const modelReady = computed(() => model.isReady.value)
const modelLoading = computed(() => model.isLoading.value)
const modelProgress = computed(() => model.progress.value)
const modelProgressText = computed(() => model.progressText.value)
const webGpuAvailable = computed(() => model.isAvailable.value)

async function downloadModel() {
    await model.init()
}

async function generateDeck() {
    await generate({ count: Math.max(1, Math.min(100, Number(count.value) || 20)), focus: focus.value })
}

async function addMore() {
    await generate({ count: Math.max(1, Math.min(100, Number(count.value) || 20)), focus: focus.value }, true)
}

async function onImport(event: Event) {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0]
    if (!file) return
    await importDeck(file)
    input.value = ''
}

function confirmClearDeck() {
    if (confirm('Delete all flashcards? This cannot be undone.')) {
        clearDeck()
    }
}
</script>
