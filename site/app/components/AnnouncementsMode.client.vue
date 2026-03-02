<script setup lang="ts">
import { useAnnouncements, type AnnouncementType, type Announcement } from '~/composables/useAnnouncements'

const { announcements, isLoading, error, loadAnnouncements } = useAnnouncements()

onMounted(() => {
    loadAnnouncements()
})

type FilterType = 'all' | AnnouncementType
const activeFilter = ref<FilterType>('all')

const filters: { key: FilterType; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'exam', label: 'Exam' },
    { key: 'quiz', label: 'Quiz' },
    { key: 'assignment', label: 'Assignment' },
    { key: 'other', label: 'Other' },
]

const filtered = computed(() =>
    activeFilter.value === 'all'
        ? announcements.value
        : announcements.value.filter((a) => a.type === activeFilter.value)
)

/** Group announcements by date, newest-first. */
const grouped = computed(() => {
    const map = new Map<string, Announcement[]>()
    for (const ann of filtered.value) {
        const list = map.get(ann.date) ?? []
        list.push(ann)
        map.set(ann.date, list)
    }
    // Sort dates newest-first
    return [...map.entries()].sort(([a], [b]) => b.localeCompare(a))
})

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

/** Track which announcements have their context expanded. */
const expandedContexts = ref(new Set<string>())

function toggleContext(key: string) {
    if (expandedContexts.value.has(key)) {
        expandedContexts.value.delete(key)
    } else {
        expandedContexts.value.add(key)
    }
    // trigger reactivity
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
            <div class="mb-5 flex flex-wrap gap-1.5">
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

            <!-- No results for this filter -->
            <div v-if="filtered.length === 0"
                class="flex h-32 items-center justify-center text-sm text-muted">
                No {{ activeFilter }} announcements found.
            </div>

            <!-- Date-grouped announcements -->
            <div v-else class="space-y-8">
                <section v-for="[date, items] in grouped" :key="date">
                    <!-- Date header -->
                    <div class="flex items-center gap-2 mb-3">
                        <UBadge color="neutral" variant="subtle" size="sm">{{ formatDate(date) }}</UBadge>
                        <span class="text-xs text-muted tabular-nums">{{ items.length }} item(s)</span>
                    </div>

                    <div class="space-y-3">
                        <div v-for="(ann, idx) in items" :key="contextKey(date, idx)"
                            class="rounded-lg border border-default bg-elevated/50 p-4">
                            <!-- Type badge -->
                            <div class="mb-2 flex items-center gap-2">
                                <UBadge :color="typeBadgeColor(ann.type as AnnouncementType)" variant="subtle"
                                    size="xs">
                                    {{ typeLabel(ann.type as AnnouncementType) }}
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
