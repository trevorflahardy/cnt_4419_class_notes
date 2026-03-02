<script setup lang="ts">
import type { TranscriptSegment } from '~/composables/useTranscripts'

const { index, isIndexLoading, loadIndex, loadTranscript, getTranscript, isTranscriptLoading } =
    useTranscripts()
const model = useAiModel()

// ── Layout state ─────────────────────────────────────────────────────────────
const selectedDate = ref<string | null>(null)
const selectedRecording = ref<string>('')

// ── Audio player state ────────────────────────────────────────────────────────
const audioEl = ref<HTMLAudioElement | null>(null)
const audioError = ref(false)
const localFileUrl = ref<string | null>(null)
const currentTime = ref(0)
const activeSegmentIndex = ref(-1)

// ── Segment scroll state ──────────────────────────────────────────────────────
const segmentListEl = ref<HTMLElement | null>(null)
const isUserScrolling = ref(false)
let userScrollTimer: ReturnType<typeof setTimeout> | null = null
let lastTimeupdateMs = 0

// ── Chat state ────────────────────────────────────────────────────────────────
interface ChatMessage {
    role: 'user' | 'assistant'
    content: string
    pending?: boolean
}
const chatMessages = ref<ChatMessage[]>([])
const chatInput = ref('')
const isChatLoading = ref(false)
const chatScrollEl = ref<HTMLElement | null>(null)

// ── Model computed ────────────────────────────────────────────────────────────
const modelReady = computed(() => model.isReady.value)
const modelLoading = computed(() => model.isLoading.value)
const modelProgress = computed(() => model.progress.value)
const modelProgressText = computed(() => model.progressText.value)
const webGpuAvailable = computed(() => model.isAvailable.value)

async function downloadModel() {
    try {
        await model.init()
    } catch { /* model state handles errors */ }
}

// ── Active transcript ────────────────────────────────────────────────────────
const activeTranscript = computed(() =>
    selectedDate.value ? getTranscript(selectedDate.value) : null
)
const isLoadingTranscript = computed(() =>
    selectedDate.value ? isTranscriptLoading(selectedDate.value) : false
)

// ── Recording selector ────────────────────────────────────────────────────────
const recordingOptions = computed(() => {
    const recordings = activeTranscript.value?.recordings ?? []
    return recordings.map((r) => ({ label: r, value: r }))
})

const hasMultipleRecordings = computed(
    () => (activeTranscript.value?.recordings?.length ?? 0) > 1
)

// ── Filtered segments ─────────────────────────────────────────────────────────
const filteredSegments = computed<TranscriptSegment[]>(() => {
    const t = activeTranscript.value
    if (!t) return []
    const segs = t.segments ?? []
    if (!hasMultipleRecordings.value || !selectedRecording.value) return segs
    return segs.filter((s) => s.source_recording === selectedRecording.value)
})

// ── Audio source URL ──────────────────────────────────────────────────────────
const baseURL = useRuntimeConfig().app.baseURL || '/'

const audioSrc = computed(() => {
    if (localFileUrl.value) return localFileUrl.value
    if (!selectedDate.value || !selectedRecording.value) return ''
    const base = baseURL.replace(/\/$/, '')
    return `${base}/recordings/${selectedDate.value}/${selectedRecording.value}`
})

// ── Date selection ────────────────────────────────────────────────────────────
async function selectDate(date: string) {
    if (selectedDate.value === date) return
    selectedDate.value = date
    activeSegmentIndex.value = -1
    currentTime.value = 0
    audioError.value = false
    localFileUrl.value = null

    await loadTranscript(date)

    const t = getTranscript(date)
    const recordings = t?.recordings ?? []
    selectedRecording.value = recordings[0] ?? ''
}

watch(selectedDate, () => {
    // reset audio when date changes
    if (audioEl.value) {
        audioEl.value.pause()
        audioEl.value.currentTime = 0
    }
    activeSegmentIndex.value = -1
    currentTime.value = 0
    audioError.value = false
    localFileUrl.value = null
})

watch(selectedRecording, () => {
    // reset audio when recording switches
    if (audioEl.value) {
        audioEl.value.pause()
        audioEl.value.currentTime = 0
    }
    activeSegmentIndex.value = -1
    currentTime.value = 0
    audioError.value = false
    localFileUrl.value = null
})

// ── Audio element events ──────────────────────────────────────────────────────
function onAudioError() {
    audioError.value = true
}

function onAudioLoaded() {
    audioError.value = false
}

function onLocalFilePick(event: Event) {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0]
    if (!file) return
    if (localFileUrl.value) URL.revokeObjectURL(localFileUrl.value)
    localFileUrl.value = URL.createObjectURL(file)
    audioError.value = false
    input.value = ''
}

// ── Timeupdate sync ───────────────────────────────────────────────────────────
function onTimeupdate() {
    const now = performance.now()
    if (now - lastTimeupdateMs < 100) return
    lastTimeupdateMs = now

    requestAnimationFrame(() => {
        const el = audioEl.value
        if (!el) return
        currentTime.value = el.currentTime
        findActiveSegment(el.currentTime)
    })
}

function findActiveSegment(time: number) {
    const segs = filteredSegments.value
    let found = -1
    for (let i = 0; i < segs.length; i++) {
        const s = segs[i]!
        if (time >= s.start && time < s.end) {
            found = i
            break
        }
    }
    if (found !== activeSegmentIndex.value) {
        activeSegmentIndex.value = found
        if (found >= 0 && !isUserScrolling.value) {
            scrollSegmentIntoView(found)
        }
    }
}

function scrollSegmentIntoView(index: number) {
    nextTick(() => {
        const container = segmentListEl.value
        if (!container) return
        const child = container.children[index] as HTMLElement | undefined
        if (child) {
            child.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
        }
    })
}

function onSegmentListScroll() {
    isUserScrolling.value = true
    if (userScrollTimer) clearTimeout(userScrollTimer)
    userScrollTimer = setTimeout(() => {
        isUserScrolling.value = false
    }, 3000)
}

function seekToSegment(seg: TranscriptSegment) {
    const el = audioEl.value
    if (!el) return
    el.currentTime = seg.start
    el.play().catch(() => { /* autoplay blocked — user must interact */ })
}

// ── Attach audio events when element mounts ───────────────────────────────────
watch(audioEl, (el, oldEl) => {
    if (oldEl) {
        oldEl.removeEventListener('timeupdate', onTimeupdate)
        oldEl.removeEventListener('error', onAudioError)
        oldEl.removeEventListener('loadeddata', onAudioLoaded)
    }
    if (el) {
        el.addEventListener('timeupdate', onTimeupdate)
        el.addEventListener('error', onAudioError)
        el.addEventListener('loadeddata', onAudioLoaded)
    }
})

// ── Chat ──────────────────────────────────────────────────────────────────────
const TRANSCRIPT_BUDGET = 8000

async function sendChatMessage() {
    const text = chatInput.value.trim()
    if (!text || isChatLoading.value) return
    if (!model.isReady.value) return

    chatInput.value = ''
    chatMessages.value.push({ role: 'user', content: text })
    isChatLoading.value = true

    const transcriptText = activeTranscript.value?.transcript ?? ''
    const budgeted =
        transcriptText.length > TRANSCRIPT_BUDGET
            ? transcriptText.slice(0, TRANSCRIPT_BUDGET) + '…'
            : transcriptText

    const systemPrompt = `You are helping a student understand a class lecture transcript. The transcript text is:\n\n${budgeted}`

    const messagesForModel = [
        { role: 'system', content: systemPrompt },
        ...chatMessages.value
            .filter((m) => !m.pending)
            .map((m) => ({ role: m.role, content: m.content })),
    ]

    const assistantMsg: ChatMessage = { role: 'assistant', content: '', pending: true }
    chatMessages.value.push(assistantMsg)
    const assistantIdx = chatMessages.value.length - 1

    try {
        const stream = model.chat(messagesForModel)
        for await (const token of stream) {
            const current = chatMessages.value[assistantIdx]
            if (!current) continue
            chatMessages.value[assistantIdx] = {
                ...current,
                pending: false,
                content: current.content + token,
            }
        }
        const completed = chatMessages.value[assistantIdx]
        if (completed) {
            chatMessages.value[assistantIdx] = { ...completed, pending: false }
        }
    } catch (err) {
        console.error('[TranscriptsMode] Chat error:', err)
        chatMessages.value[assistantIdx] = {
            role: 'assistant',
            content: 'Sorry, I encountered an error. Please try again.',
            pending: false,
        }
    } finally {
        isChatLoading.value = false
    }
}

function handleChatKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault()
        sendChatMessage()
    }
}

// Auto-scroll chat on new messages
watch(
    () => chatMessages.value.map((m) => `${m.role}:${m.content.length}:${m.pending ? 1 : 0}`).join('|'),
    () => {
        nextTick(() => {
            const el = chatScrollEl.value
            if (el) el.scrollTop = el.scrollHeight
        })
    },
)

// ── Formatting helpers ────────────────────────────────────────────────────────
function formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60)
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function formatDate(iso: string): string {
    try {
        return new Date(iso + 'T12:00:00').toLocaleDateString(undefined, {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        })
    } catch {
        return iso
    }
}

// ── Lifecycle ─────────────────────────────────────────────────────────────────
onMounted(() => {
    loadIndex()
})

onUnmounted(() => {
    if (localFileUrl.value) URL.revokeObjectURL(localFileUrl.value)
    if (userScrollTimer) clearTimeout(userScrollTimer)
    if (audioEl.value) {
        audioEl.value.removeEventListener('timeupdate', onTimeupdate)
        audioEl.value.removeEventListener('error', onAudioError)
        audioEl.value.removeEventListener('loadeddata', onAudioLoaded)
    }
})
</script>

<template>
    <div class="flex h-full">
        <!-- ===== Sidebar: transcript list ===== -->
        <aside
            class="hidden w-60 shrink-0 flex-col border-r border-default bg-elevated/50 overflow-y-auto md:flex">
            <div class="px-4 py-3 border-b border-default">
                <h2 class="text-sm font-semibold text-highlighted">Transcripts</h2>
                <p class="text-xs text-muted mt-0.5">Class recordings</p>
            </div>

            <!-- Loading -->
            <div v-if="isIndexLoading" class="flex flex-1 items-center justify-center py-8">
                <UIcon name="i-heroicons-arrow-path" class="animate-spin text-xl text-muted" />
            </div>

            <!-- Empty state -->
            <div v-else-if="index.length === 0"
                class="flex flex-1 flex-col items-center justify-center gap-3 p-4 text-center">
                <UIcon name="i-heroicons-microphone" class="text-3xl text-muted" />
                <p class="text-xs text-muted">
                    No transcripts yet. Run the local pipeline after adding recordings.
                </p>
            </div>

            <!-- Date list -->
            <div v-else class="flex flex-col gap-0.5 p-2">
                <button
                    v-for="entry in index"
                    :key="entry.date"
                    class="flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors"
                    :class="selectedDate === entry.date
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'text-default hover:bg-elevated'"
                    @click="selectDate(entry.date)">
                    <span class="truncate">{{ entry.date }}</span>
                    <UBadge
                        v-if="entry.recordings.length > 1"
                        color="neutral"
                        variant="subtle"
                        size="xs">
                        {{ entry.recordings.length }}
                    </UBadge>
                </button>
            </div>
        </aside>

        <!-- ===== Mobile: date selector ===== -->
        <div class="flex md:hidden shrink-0 items-center gap-2 border-b border-default px-4 py-2 absolute top-0 left-0 right-0 z-10 bg-default">
            <span class="text-xs text-muted shrink-0">Date:</span>
            <select
                v-if="index.length > 0"
                class="min-w-0 flex-1 rounded border border-default bg-default px-2 py-1 text-xs text-highlighted"
                :value="selectedDate ?? ''"
                @change="(e) => selectDate((e.target as HTMLSelectElement).value)">
                <option value="" disabled>Select a date…</option>
                <option v-for="entry in index" :key="entry.date" :value="entry.date">
                    {{ entry.date }}
                </option>
            </select>
            <span v-else class="text-xs text-muted">No transcripts yet.</span>
        </div>

        <!-- ===== Main panel ===== -->
        <div class="flex min-w-0 flex-1 flex-col overflow-hidden md:pt-0 pt-10">
            <!-- Empty / no date selected -->
            <div
                v-if="!selectedDate"
                class="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
                <UIcon name="i-heroicons-microphone" class="text-4xl text-muted" />
                <p class="text-sm text-muted max-w-xs">
                    Select a transcript date from the sidebar to start listening.
                </p>
            </div>

            <!-- Loading transcript -->
            <div
                v-else-if="isLoadingTranscript"
                class="flex flex-1 items-center justify-center">
                <UIcon name="i-heroicons-arrow-path" class="animate-spin text-2xl text-muted" />
            </div>

            <!-- Transcript not loaded (error / 404) -->
            <div
                v-else-if="selectedDate && !activeTranscript"
                class="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
                <UIcon name="i-heroicons-exclamation-circle" class="text-3xl text-amber-500" />
                <p class="text-sm text-muted max-w-xs">
                    Could not load transcript for {{ selectedDate }}. Run the local pipeline to generate public transcript files.
                </p>
            </div>

            <!-- Transcript loaded -->
            <template v-else-if="activeTranscript">
                <div class="flex min-h-0 flex-1 flex-col gap-0 overflow-hidden">

                    <!-- ── Recording selector (multi-recording only) ── -->
                    <div
                        v-if="hasMultipleRecordings"
                        class="shrink-0 border-b border-default px-4 py-2 flex items-center gap-3">
                        <span class="text-xs text-muted shrink-0">Recording:</span>
                        <select
                            v-model="selectedRecording"
                            class="min-w-0 flex-1 rounded border border-default bg-default px-2 py-1 text-xs text-highlighted">
                            <option v-for="opt in recordingOptions" :key="opt.value" :value="opt.value">
                                {{ opt.label }}
                            </option>
                        </select>
                    </div>

                    <!-- ── Audio player ── -->
                    <div class="shrink-0 border-b border-default px-4 py-3 space-y-2">
                        <div class="flex items-center gap-2">
                            <UIcon name="i-heroicons-musical-note" class="h-4 w-4 shrink-0 text-muted" />
                            <span class="text-xs font-medium text-muted truncate">
                                {{ selectedRecording || activeTranscript.recordings[0] || 'recording' }}
                            </span>
                        </div>

                        <!-- Native audio element -->
                        <audio
                            v-if="audioSrc && !audioError"
                            ref="audioEl"
                            :src="audioSrc"
                            controls
                            class="w-full h-9"
                            preload="metadata"
                            @error="onAudioError"
                            @loadeddata="onAudioLoaded" />

                        <!-- Audio error / file not found fallback -->
                        <div v-if="audioError || !audioSrc" class="rounded-lg border border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/30 px-3 py-2.5 space-y-2">
                            <div class="flex items-start gap-2">
                                <UIcon name="i-heroicons-exclamation-triangle" class="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                                <p class="text-xs text-amber-700 dark:text-amber-400">
                                    Audio not found in public/recordings. Select the file from your recordings/ folder to enable playback.
                                </p>
                            </div>
                            <label class="inline-flex cursor-pointer">
                                <input
                                    type="file"
                                    accept="audio/*"
                                    class="hidden"
                                    @change="onLocalFilePick" />
                                <span class="inline-flex items-center gap-1.5 rounded-md border border-amber-400 bg-amber-100 dark:bg-amber-900/40 px-2.5 py-1 text-xs font-medium text-amber-700 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-900/60 transition-colors">
                                    <UIcon name="i-heroicons-folder-open" class="h-3.5 w-3.5" />
                                    Select audio file…
                                </span>
                            </label>
                            <!-- Still render audio hidden so ref is available after local file pick -->
                            <audio
                                v-if="localFileUrl"
                                ref="audioEl"
                                :src="localFileUrl"
                                controls
                                class="w-full h-9 mt-1"
                                preload="metadata"
                                @error="onAudioError"
                                @loadeddata="onAudioLoaded" />
                        </div>
                    </div>

                    <!-- ── Segment list ── -->
                    <div
                        ref="segmentListEl"
                        class="flex-1 overflow-y-auto"
                        @scroll="onSegmentListScroll">
                        <div
                            v-if="filteredSegments.length === 0"
                            class="flex h-32 items-center justify-center text-sm text-muted">
                            No segments for this recording.
                        </div>

                        <button
                            v-for="(seg, idx) in filteredSegments"
                            :key="idx"
                            class="w-full flex items-start gap-3 px-4 py-2.5 text-left transition-colors border-l-2 hover:bg-elevated/60"
                            :class="activeSegmentIndex === idx
                                ? 'bg-primary-50 dark:bg-primary-950/40 border-primary-400'
                                : 'border-transparent'"
                            @click="seekToSegment(seg)">
                            <span class="shrink-0 tabular-nums text-xs font-mono text-muted mt-0.5">
                                {{ formatTime(seg.start) }}
                            </span>
                            <span class="text-sm text-default leading-snug">{{ seg.text }}</span>
                        </button>
                    </div>

                    <!-- ── Compact chat panel ── -->
                    <div class="shrink-0 border-t border-default flex flex-col" style="height: 240px; min-height: 180px; max-height: 320px;">
                        <div class="flex items-center justify-between gap-2 border-b border-default px-3 py-2">
                            <div class="flex items-center gap-1.5">
                                <UIcon name="i-lucide-sparkles" class="h-3.5 w-3.5 text-primary" />
                                <span class="text-xs font-semibold text-highlighted">Ask about this transcript</span>
                            </div>
                            <div class="flex items-center gap-1.5">
                                <UBadge :color="modelReady ? 'primary' : 'neutral'" variant="subtle" size="xs">
                                    {{ modelReady ? 'AI Ready' : 'Model Required' }}
                                </UBadge>
                                <UButton
                                    v-if="!modelReady"
                                    size="xs"
                                    variant="soft"
                                    color="primary"
                                    :loading="modelLoading"
                                    :disabled="!webGpuAvailable || modelReady"
                                    @click="downloadModel">
                                    Download AI
                                </UButton>
                            </div>
                        </div>

                        <!-- Model loading progress -->
                        <div v-if="modelLoading" class="px-3 py-1.5 border-b border-default">
                            <div class="flex items-center justify-between text-xs text-muted mb-1">
                                <span>{{ modelProgressText }}</span>
                                <span class="tabular-nums">{{ Math.round(modelProgress) }}%</span>
                            </div>
                            <UProgress :value="modelProgress" size="xs" color="primary" />
                        </div>

                        <!-- WebGPU unavailable -->
                        <div v-if="!webGpuAvailable" class="px-3 py-1.5 border-b border-default">
                            <p class="text-xs text-red-500">
                                WebGPU not available — AI chat requires Chrome 113+ or Edge 113+.
                            </p>
                        </div>

                        <!-- Message history -->
                        <div ref="chatScrollEl" class="flex-1 overflow-y-auto px-3 py-2 space-y-2">
                            <div
                                v-if="chatMessages.length === 0"
                                class="flex h-full items-center justify-center text-xs text-muted text-center">
                                Ask a question about this recording.
                            </div>
                            <div
                                v-for="(msg, i) in chatMessages"
                                :key="i"
                                class="flex gap-2"
                                :class="msg.role === 'user' ? 'justify-end' : 'justify-start'">
                                <div
                                    class="max-w-[85%] rounded-lg px-3 py-1.5 text-xs leading-relaxed"
                                    :class="msg.role === 'user'
                                        ? 'bg-primary text-white'
                                        : 'bg-elevated border border-default text-default'">
                                    <span v-if="msg.pending" class="inline-flex gap-0.5 items-center">
                                        <span class="h-1 w-1 rounded-full bg-current animate-bounce" style="animation-delay: 0ms" />
                                        <span class="h-1 w-1 rounded-full bg-current animate-bounce" style="animation-delay: 150ms" />
                                        <span class="h-1 w-1 rounded-full bg-current animate-bounce" style="animation-delay: 300ms" />
                                    </span>
                                    <span v-else>{{ msg.content }}</span>
                                </div>
                            </div>
                        </div>

                        <!-- Input -->
                        <div class="border-t border-default px-3 py-2">
                            <div v-if="!modelReady" class="mb-1.5 flex items-start gap-1.5 rounded border px-2 py-1.5"
                                :class="!webGpuAvailable
                                    ? 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30'
                                    : 'border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30'">
                                <UIcon
                                    :name="!webGpuAvailable ? 'i-heroicons-exclamation-triangle' : 'i-heroicons-cpu-chip'"
                                    class="mt-0.5 h-3.5 w-3.5 shrink-0"
                                    :class="!webGpuAvailable ? 'text-red-500' : 'text-amber-500'" />
                                <p class="text-xs"
                                    :class="!webGpuAvailable ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'">
                                    {{ !webGpuAvailable
                                        ? 'WebGPU not available — chat disabled.'
                                        : 'Click "Download AI" to enable chat.' }}
                                </p>
                            </div>
                            <div class="flex items-end gap-2">
                                <textarea
                                    v-model="chatInput"
                                    rows="1"
                                    :placeholder="!modelReady
                                        ? (!webGpuAvailable ? 'WebGPU unavailable' : 'Download the AI model first')
                                        : isChatLoading ? 'AI is typing…' : 'Ask about this transcript…'"
                                    :disabled="!modelReady || isChatLoading"
                                    class="flex-1 resize-none rounded-md border border-default bg-default px-2.5 py-1.5 text-xs text-highlighted placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-primary-400 disabled:opacity-60 disabled:cursor-not-allowed"
                                    style="max-height: 64px; overflow-y: auto;"
                                    @keydown="handleChatKeydown" />
                                <UButton
                                    :icon="isChatLoading ? 'i-lucide-loader-2' : 'i-lucide-send'"
                                    color="primary"
                                    size="xs"
                                    :class="isChatLoading ? 'animate-pulse' : ''"
                                    :disabled="!chatInput.trim() || !modelReady || isChatLoading"
                                    @click="sendChatMessage" />
                            </div>
                        </div>
                    </div>
                </div>
            </template>
        </div>
    </div>
</template>
