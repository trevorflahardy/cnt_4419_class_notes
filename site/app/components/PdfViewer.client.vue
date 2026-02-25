<template>
    <div class="flex flex-col h-full">
        <!-- Toolbar -->
        <div
            class="sticky top-0 z-10 flex items-center justify-between gap-2 px-3 py-2 border-b border-gray-200 bg-white/80 backdrop-blur-md">
            <!-- Page Navigation -->
            <div class="flex items-center gap-1">
                <UButton icon="i-lucide-chevron-left" variant="ghost" size="xs" :disabled="currentPage <= 1"
                    @click="prevPage" aria-label="Previous page" />
                <span class="text-xs tabular-nums whitespace-nowrap text-gray-600">
                    Page {{ currentPage }} of {{ totalPages }}
                </span>
                <UButton icon="i-lucide-chevron-right" variant="ghost" size="xs" :disabled="currentPage >= totalPages"
                    @click="nextPage" aria-label="Next page" />
            </div>

            <!-- Zoom Controls -->
            <div class="flex items-center gap-1">
                <UButton icon="i-lucide-minus" variant="ghost" size="xs" :disabled="scale <= 0.5" @click="zoomOut"
                    aria-label="Zoom out" />
                <span class="text-xs tabular-nums w-12 text-center text-gray-600">
                    {{ Math.round(scale * 100) }}%
                </span>
                <UButton icon="i-lucide-plus" variant="ghost" size="xs" :disabled="scale >= 3" @click="zoomIn"
                    aria-label="Zoom in" />
                <UButton icon="i-lucide-maximize-2" variant="ghost" size="xs" @click="fitWidth" aria-label="Fit width"
                    class="hidden sm:inline-flex" />
            </div>

            <!-- Download -->
            <div class="flex items-center gap-1">
                <UInput v-model="searchQuery" size="xs" class="w-40 sm:w-56" placeholder="Search PDF text"
                    @keydown.enter.prevent="nextMatch" />
                <span class="hidden sm:inline text-xs text-gray-500 tabular-nums">
                    {{ totalMatches > 0 ? `${activeMatchIndex + 1}/${totalMatches}` : '0/0' }}
                </span>
                <UButton icon="i-lucide-chevron-up" variant="ghost" size="xs" :disabled="totalMatches === 0"
                    @click="prevMatch" aria-label="Previous match" />
                <UButton icon="i-lucide-chevron-down" variant="ghost" size="xs" :disabled="totalMatches === 0"
                    @click="nextMatch" aria-label="Next match" />
                <UButton icon="i-lucide-download" variant="ghost" size="xs" @click="downloadPdf"
                    aria-label="Download PDF" />
            </div>
        </div>

        <!-- Loading State -->
        <div v-if="isLoading" class="flex-1 flex flex-col items-center justify-center gap-3 p-8">
            <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin text-primary-500" />
            <span class="text-sm text-gray-500 text-center">{{ loadingText }}</span>
            <UProgress class="w-56" :model-value="loadingProgress" />
            <span class="text-xs text-gray-400 tabular-nums">
                {{ Math.round(loadingProgress) }}%
            </span>
        </div>

        <!-- Error State -->
        <div v-else-if="loadError" class="flex-1 flex flex-col items-center justify-center gap-3 p-8 text-center">
            <UIcon name="i-lucide-file-warning" class="w-8 h-8 text-amber-500" />
            <p class="text-sm text-gray-600 max-w-md">
                {{ loadError }}
            </p>
            <div class="flex items-center gap-2">
                <UButton size="sm" color="primary" variant="soft" @click="loadPdf">Retry</UButton>
                <UButton size="sm" color="neutral" variant="ghost" @click="downloadPdf">Open Source</UButton>
            </div>
        </div>

        <!-- PDF Viewer -->
        <div ref="viewerContainer" class="flex-1 overflow-y-auto custom-scrollbar bg-gray-50"
            @scroll="handleScroll">
            <div class="mx-auto py-4"
                :style="{ width: `${scale * 100}%`, maxWidth: `${scale * 100}%`, minWidth: '300px' }">
                <VuePdfEmbed :source="activeSource" :annotation-layer="true" :text-layer="true" @loaded="onLoaded"
                    @loading-failed="onLoadFailed" class="pdf-embed" />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import VuePdfEmbed from 'vue-pdf-embed'
import 'vue-pdf-embed/dist/styles/annotationLayer.css'
import 'vue-pdf-embed/dist/styles/textLayer.css'

const props = defineProps<{
    source?: string
}>()

const runtimeConfig = useRuntimeConfig()

const resolvedSource = computed(() => {
    if (props.source) return props.source
    const base = runtimeConfig.app.baseURL || '/'
    return `${base.replace(/\/$/, '')}/notes.pdf`
})

const currentPage = ref(1)
const totalPages = ref(0)
const scale = ref(1.0)
const isLoading = ref(true)
const loadingProgress = ref(0)
const loadingText = ref('Preparing PDF...')
const loadError = ref('')
const activeSource = ref('')
const viewerContainer = ref<HTMLElement | null>(null)
const searchQuery = ref('')
const activeMatchIndex = ref(0)
const totalMatches = ref(0)
const highlightedElements = ref<HTMLElement[]>([])

let searchDebounce: ReturnType<typeof setTimeout> | null = null
let sharedObjectUrl: string | null = null
let sharedSourceKey: string | null = null

let objectUrl: string | null = null

async function loadPdf() {
    if (sharedObjectUrl && sharedSourceKey === resolvedSource.value) {
        activeSource.value = sharedObjectUrl
        isLoading.value = false
        loadingProgress.value = 100
        loadingText.value = 'PDF ready'
        return
    }

    isLoading.value = true
    loadingProgress.value = 0
    loadingText.value = 'Fetching PDF...'
    loadError.value = ''

    try {
        const response = await fetch(resolvedSource.value, { cache: 'force-cache' })
        if (!response.ok) {
            throw new Error(`PDF not found at ${resolvedSource.value}`)
        }

        const totalBytes = Number(response.headers.get('content-length') || 0)

        if (!response.body) {
            const blob = await response.blob()
            if (objectUrl) URL.revokeObjectURL(objectUrl)
            objectUrl = URL.createObjectURL(blob)
            activeSource.value = objectUrl
            loadingProgress.value = 95
            loadingText.value = 'Rendering pages...'
            return
        }

        const reader = response.body.getReader()
        const chunks: Uint8Array[] = []
        let received = 0

        while (true) {
            const { done, value } = await reader.read()
            if (done) break
            if (value) {
                chunks.push(value)
                received += value.length
                if (totalBytes > 0) {
                    loadingProgress.value = Math.min(95, (received / totalBytes) * 95)
                    loadingText.value = `Downloading PDF... ${Math.round((received / totalBytes) * 100)}%`
                } else {
                    loadingProgress.value = Math.min(95, loadingProgress.value + 2)
                    loadingText.value = 'Downloading PDF...'
                }
            }
        }

        const blob = new Blob(chunks as BlobPart[], { type: 'application/pdf' })
        if (objectUrl) URL.revokeObjectURL(objectUrl)
        objectUrl = URL.createObjectURL(blob)
        sharedObjectUrl = objectUrl
        sharedSourceKey = resolvedSource.value
        activeSource.value = objectUrl
        loadingProgress.value = 98
        loadingText.value = 'Rendering pages...'
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error while loading PDF'
        loadError.value = `${message}. Ensure notes.pdf exists in site/public (or run \`bun run sync:pdf\`).`
        isLoading.value = false
    }
}

function onLoaded(pdf: any) {
    totalPages.value = pdf.numPages
    loadingProgress.value = 100
    loadingText.value = 'PDF ready'
    isLoading.value = false
    if (searchQuery.value.trim()) {
        queueSearch()
    }
}

function onLoadFailed(error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to render PDF'
    loadError.value = message
    isLoading.value = false
}

function handleScroll() {
    const container = viewerContainer.value
    if (!container || totalPages.value === 0) return

    const pages = container.querySelectorAll('.vue-pdf-embed > div')
    if (!pages.length) return

    const containerRect = container.getBoundingClientRect()
    const containerMid = containerRect.top + containerRect.height / 2

    let closest = 1
    let closestDist = Infinity

    pages.forEach((page, i) => {
        const rect = page.getBoundingClientRect()
        const pageMid = rect.top + rect.height / 2
        const dist = Math.abs(pageMid - containerMid)
        if (dist < closestDist) {
            closestDist = dist
            closest = i + 1
        }
    })

    currentPage.value = closest
}

function scrollToPage(page: number) {
    const container = viewerContainer.value
    if (!container) return

    const pages = container.querySelectorAll('.vue-pdf-embed > div')
    const target = pages[page - 1]
    if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
}

function prevPage() {
    if (currentPage.value > 1) {
        currentPage.value--
        scrollToPage(currentPage.value)
    }
}

function nextPage() {
    if (currentPage.value < totalPages.value) {
        currentPage.value++
        scrollToPage(currentPage.value)
    }
}

function zoomIn() {
    scale.value = Math.min(3, +(scale.value + 0.25).toFixed(2))
}

function zoomOut() {
    scale.value = Math.max(0.5, +(scale.value - 0.25).toFixed(2))
}

function fitWidth() {
    scale.value = 1.0
}

function downloadPdf() {
    window.open(resolvedSource.value, '_blank')
}

function clearHighlights() {
    for (const element of highlightedElements.value) {
        element.classList.remove('pdf-search-hit', 'pdf-search-active')
    }
    highlightedElements.value = []
    totalMatches.value = 0
    activeMatchIndex.value = 0
}

function applySearch() {
    clearHighlights()
    const query = searchQuery.value.trim().toLowerCase()
    if (!query) return

    const container = viewerContainer.value
    if (!container) return

    const spans = Array.from(container.querySelectorAll('.textLayer span')) as HTMLElement[]
    const matches = spans.filter(span => span.textContent?.toLowerCase().includes(query))

    for (const element of matches) {
        element.classList.add('pdf-search-hit')
    }

    highlightedElements.value = matches
    totalMatches.value = matches.length
    activeMatchIndex.value = 0
    focusMatch(0)
}

function focusMatch(index: number) {
    if (!highlightedElements.value.length) return

    for (const element of highlightedElements.value) {
        element.classList.remove('pdf-search-active')
    }

    const clamped = (index + highlightedElements.value.length) % highlightedElements.value.length
    activeMatchIndex.value = clamped

    const element = highlightedElements.value[clamped]
    if (!element) return

    element.classList.add('pdf-search-active')
    element.scrollIntoView({ behavior: 'smooth', block: 'center' })
}

function nextMatch() {
    if (!highlightedElements.value.length) return
    focusMatch(activeMatchIndex.value + 1)
}

function prevMatch() {
    if (!highlightedElements.value.length) return
    focusMatch(activeMatchIndex.value - 1)
}

function queueSearch() {
    if (searchDebounce) clearTimeout(searchDebounce)
    searchDebounce = setTimeout(() => {
        applySearch()
    }, 160)
}

onMounted(() => {
    loadPdf()
})

watch(resolvedSource, () => {
    loadPdf()
})

watch(searchQuery, () => {
    queueSearch()
})

onBeforeUnmount(() => {
    if (searchDebounce) clearTimeout(searchDebounce)
    clearHighlights()
    if (objectUrl && objectUrl !== sharedObjectUrl) URL.revokeObjectURL(objectUrl)
})
</script>

<style scoped>
.pdf-embed :deep(canvas) {
    width: 100% !important;
    height: auto !important;
}

.pdf-embed :deep(.pdf-search-hit) {
    background: rgba(250, 204, 21, 0.38);
    border-radius: 3px;
}

.pdf-embed :deep(.pdf-search-active) {
    background: rgba(139, 92, 246, 0.45);
}
</style>
