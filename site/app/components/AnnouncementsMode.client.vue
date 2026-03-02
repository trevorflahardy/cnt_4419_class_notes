<script setup lang="ts">
import { useAnnouncements, type AnnouncementType, type Announcement } from '~/composables/useAnnouncements'

const { announcements, isLoading, error, loadAnnouncements } = useAnnouncements()
const { isReady, chat } = useAiModel()

onMounted(() => {
    loadAnnouncements()
})

// ── Type filter ────────────────────────────────────────────────────────────

type FilterType = 'all' | AnnouncementType
const activeFilter = ref<FilterType>('all')

const filters: { key: FilterType; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'exam', label: 'Exam' },
    { key: 'quiz', label: 'Quiz' },
    { key: 'assignment', label: 'Assignment' },
    { key: 'other', label: 'Other' },
]

// ── AI relevance filtering ─────────────────────────────────────────────────

/**
 * Stable key for each announcement based on its position in the master list.
 * Using global index (not per-group) so the key doesn't shift when the type
 * filter changes.
 */
function annKey(ann: Announcement): string {
    const idx = announcements.value.indexOf(ann)
    return idx >= 0 ? `ann-${idx}` : `ann-${ann.date}-${ann.quote.slice(0, 40)}`
}

/**
 * Map of annKey → relevance:
 *   undefined = not yet classified
 *   null      = classification in progress
 *   true      = relevant (keep)
 *   false     = likely noise (flag)
 */
const relevanceMap = ref<Record<string, boolean | null>>({})
const isFiltering = ref(false)
const filterProgress = ref({ current: 0, total: 0 })
const hideNoise = ref(false)

function relevanceOf(ann: Announcement): boolean | null | undefined {
    return relevanceMap.value[annKey(ann)]
}

async function runAiFilter() {
    if (!isReady.value || isFiltering.value) return
    isFiltering.value = true
    const toProcess = announcements.value.filter(
        (ann) => relevanceOf(ann) === undefined
    )
    filterProgress.value = { current: 0, total: toProcess.length }

    for (const ann of toProcess) {
        const key = annKey(ann)
        relevanceMap.value = { ...relevanceMap.value, [key]: null } // mark pending

        try {
            const gen = chat([
                {
                    role: 'system',
                    content: 'You classify lecture quotes. Reply with exactly YES or NO — nothing else.',
                },
                {
                    role: 'user',
                    content:
                        `Is this quote from a class lecture actually announcing a specific upcoming ` +
                        `${ann.type} that students need to prepare for or act on?\n\n` +
                        `Quote: "${ann.quote.slice(0, 300)}"`,
                },
            ])

            let full = ''
            for await (const tok of gen) full += tok
            const relevant = full.trim().toUpperCase().startsWith('YES')
            relevanceMap.value = { ...relevanceMap.value, [key]: relevant }
        } catch {
            // On error, default to showing the announcement
            relevanceMap.value = { ...relevanceMap.value, [key]: true }
        }

        filterProgress.value.current++
    }

    isFiltering.value = false
}

// Whether any classification has been run at all
const hasFiltered = computed(() => Object.keys(relevanceMap.value).length > 0)

// ── Derived lists ──────────────────────────────────────────────────────────

const byType = computed(() =>
    activeFilter.value === 'all'
        ? announcements.value
        : announcements.value.filter((a) => a.type === activeFilter.value)
)

const filtered = computed(() => {
    if (!hideNoise.value) return byType.value
    // Only hide items that have been definitively classified as noise (false)
    return byType.value.filter((ann) => relevanceOf(ann) !== false)
})

const filtered_noiseCount = computed(() =>
    byType.value.filter((ann) => relevanceOf(ann) === false).length
)

/** Group announcements by date, newest-first. */
const grouped = computed(() => {
    const map = new Map<string, Announcement[]>()
    for (const ann of filtered.value) {
        const list = map.get(ann.date) ?? []
        list.push(ann)
        map.set(ann.date, list)
    }
    return [...map.entries()].sort(([a], [b]) => b.localeCompare(a))
})

// ── Helpers ────────────────────────────────────────────────────────────────

function typeBadgeColor(type: AnnouncementType): 'error' | 'warning' | 'info' | 'neutral' {
    switch (type) {
        case 'exam': return 'error'
        case 'quiz': return 'warning'
        case 'assignment': return 'info'
        default: return 'neutral'
    }
}

function typeLabel(type: AnnouncementType): string {
    switch (type) {
        case 'exam': return 'Exam'
        case 'quiz': return 'Quiz'
        case 'assignment': return 'Assignment'
        default: return 'Other'
    }
}

function formatDate(iso: string): string {
    try {
        return new Date(iso + 'T12:00:00').toLocaleDateString(undefined, {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
        })
    } catch {
        return iso
    }
}

const expandedContexts = ref(new Set<string>())

function toggleContext(key: string) {
    if (expandedContexts.value.has(key)) {
        expandedContexts.value.delete(key)
    } else {
        expandedContexts.value.add(key)
    }
    expandedContexts.value = new Set(expandedContexts.value)
}

function contextKey(date: string, index: number): string {
    return `${date}-${index}`
}
</script>

<template>
    <div class="mx-auto max-w-3xl px-4 py-6">
        <div class="mb-6">
            <h2 class="text-xl font-semibold text-highlighted">Professor Says</h2>
            <p class="mt-1 text-sm text-muted">
                Keyword-matched announcements extracted from class recordings.
            </p>
        </div>

        <!-- Loading -->
        <div v-if="isLoading" class="flex h-48 items-center justify-center">
            <UIcon name="i-heroicons-arrow-path" class="animate-spin text-2xl text-muted" />
        </div>

        <!-- Error -->
        <div v-else-if="error" class="flex h-48 flex-col items-center justify-center gap-2 text-center">
            <UIcon name="i-heroicons-exclamation-triangle" class="text-2xl text-amber-500" />
            <p class="text-sm text-muted">{{ error }}</p>
            <UButton size="sm" variant="soft" color="primary" @click="loadAnnouncements">Retry</UButton>
        </div>

        <!-- Empty state -->
        <div v-else-if="announcements.length === 0"
            class="flex h-64 flex-col items-center justify-center gap-3 text-center">
            <UIcon name="i-heroicons-megaphone" class="text-4xl text-muted" />
            <p class="text-sm text-muted max-w-xs">
                No announcements yet. Upload class recordings to generate this data.
            </p>
        </div>

        <template v-else>
            <!-- Filter bar -->
            <div class="mb-4 flex flex-wrap gap-1.5">
                <UButton v-for="f in filters" :key="f.key" size="xs"
                    :variant="activeFilter === f.key ? 'soft' : 'ghost'"
                    :color="activeFilter === f.key ? 'primary' : 'neutral'" @click="activeFilter = f.key">
                    {{ f.label }}
                    <span v-if="f.key === 'all'" class="ml-1 tabular-nums">({{ announcements.length }})</span>
                    <span v-else class="ml-1 tabular-nums">
                        ({{ announcements.filter(a => a.type === f.key).length }})
                    </span>
                </UButton>
            </div>

            <!-- AI filter bar (only shown when model is ready) -->
            <div v-if="isReady"
                class="mb-5 flex flex-wrap items-center gap-2 rounded-lg border border-default bg-elevated/40 px-3 py-2">
                <UIcon name="i-heroicons-cpu-chip" class="text-primary-500 text-sm shrink-0" />
                <span class="text-xs text-muted">AI filter</span>

                <!-- Not yet run -->
                <template v-if="!hasFiltered && !isFiltering">
                    <UButton size="xs" variant="soft" color="primary" @click="runAiFilter">
                        Check relevance
                    </UButton>
                    <span class="text-xs text-muted">
                        Uses on-device model to flag keyword-only false positives.
                    </span>
                </template>

                <!-- Filtering in progress -->
                <template v-else-if="isFiltering">
                    <UIcon name="i-heroicons-arrow-path" class="animate-spin text-xs text-primary-500" />
                    <span class="text-xs text-muted tabular-nums">
                        Classifying {{ filterProgress.current }}/{{ filterProgress.total }}...
                    </span>
                </template>

                <!-- Done -->
                <template v-else>
                    <span class="text-xs text-muted tabular-nums">
                        {{ filtered_noiseCount }} likely noise
                        <template v-if="filtered_noiseCount > 0"> · </template>
                    </span>
                    <UButton v-if="filtered_noiseCount > 0" size="xs"
                        :variant="hideNoise ? 'soft' : 'ghost'"
                        :color="hideNoise ? 'primary' : 'neutral'"
                        @click="hideNoise = !hideNoise">
                        {{ hideNoise ? 'Showing relevant only' : 'Hide noise' }}
                    </UButton>
                    <UButton size="xs" variant="ghost" color="neutral" @click="runAiFilter">
                        Re-run
                    </UButton>
                </template>
            </div>

            <!-- No results for this filter -->
            <div v-if="filtered.length === 0"
                class="flex h-32 items-center justify-center text-sm text-muted">
                No {{ activeFilter === 'all' ? '' : activeFilter + ' ' }}announcements
                {{ hideNoise ? 'passed the AI filter' : 'found' }}.
                <UButton v-if="hideNoise" size="xs" variant="ghost" color="neutral"
                    class="ml-2" @click="hideNoise = false">
                    Show all
                </UButton>
            </div>

            <!-- Date-grouped announcements -->
            <div v-else class="space-y-8">
                <section v-for="[date, items] in grouped" :key="date">
                    <div class="flex items-center gap-2 mb-3">
                        <UBadge color="neutral" variant="subtle" size="sm">{{ formatDate(date) }}</UBadge>
                        <span class="text-xs text-muted tabular-nums">{{ items.length }} item(s)</span>
                    </div>

                    <div class="space-y-3">
                        <div v-for="(ann, idx) in items" :key="contextKey(date, idx)"
                            class="rounded-lg border p-4 transition-opacity"
                            :class="[
                                relevanceOf(ann) === false
                                    ? 'border-default bg-elevated/30 opacity-50'
                                    : 'border-default bg-elevated/50',
                            ]">
                            <!-- Type badge + AI relevance indicator -->
                            <div class="mb-2 flex items-center gap-2 flex-wrap">
                                <UBadge :color="typeBadgeColor(ann.type as AnnouncementType)" variant="subtle"
                                    size="xs">
                                    {{ typeLabel(ann.type as AnnouncementType) }}
                                </UBadge>

                                <!-- AI pending spinner -->
                                <UIcon v-if="relevanceOf(ann) === null"
                                    name="i-heroicons-arrow-path"
                                    class="animate-spin text-xs text-muted" />

                                <!-- Noise label -->
                                <UBadge v-else-if="relevanceOf(ann) === false"
                                    color="neutral" variant="outline" size="xs">
                                    Likely not important
                                </UBadge>
                            </div>

                            <!-- Quote -->
                            <blockquote
                                class="border-l-2 border-primary-400 pl-3 text-sm italic text-highlighted">
                                "{{ ann.quote }}"
                            </blockquote>

                            <!-- Context toggle -->
                            <div class="mt-2">
                                <button
                                    class="text-xs text-muted hover:text-default transition-colors"
                                    @click="toggleContext(contextKey(date, idx))">
                                    {{ expandedContexts.has(contextKey(date, idx)) ? 'Hide context' : 'Show context' }}
                                </button>
                                <p v-if="expandedContexts.has(contextKey(date, idx))"
                                    class="mt-1.5 text-xs text-muted leading-relaxed">
                                    {{ ann.context }}
                                </p>
                            </div>

                            <!-- Keyword badges -->
                            <div v-if="ann.keywords?.length" class="mt-2 flex flex-wrap gap-1">
                                <UBadge v-for="kw in ann.keywords" :key="kw" color="neutral" variant="outline"
                                    size="xs">
                                    {{ kw }}
                                </UBadge>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </template>
    </div>
</template>
