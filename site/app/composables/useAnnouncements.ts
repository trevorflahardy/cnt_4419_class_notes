export type AnnouncementType = 'exam' | 'quiz' | 'assignment' | 'other'

export interface Announcement {
    date: string
    type: AnnouncementType
    quote: string
    context: string
    keywords: string[]
}

interface AnnouncementsData {
    generated_at: string
    announcements: Announcement[]
}

export function useAnnouncements() {
    const announcements = useState<Announcement[]>('announcements-data', () => [])
    const isLoading = useState<boolean>('announcements-loading', () => false)
    const error = useState<string>('announcements-error', () => '')
    const loadPromise = useState<Promise<void> | null>('announcements-load-promise', () => null)

    async function loadAnnouncements() {
        if (announcements.value.length > 0) return
        if (loadPromise.value) return loadPromise.value

        loadPromise.value = _load()
        return loadPromise.value
    }

    async function _load() {
        isLoading.value = true
        error.value = ''

        try {
            const baseURL = useRuntimeConfig().app.baseURL || '/'
            const url = `${baseURL.replace(/\/$/, '')}/announcements.json`
            const data = await $fetch<AnnouncementsData>(url)

            const raw = Array.isArray(data?.announcements) ? data.announcements : []
            announcements.value = raw.filter(
                (a): a is Announcement =>
                    typeof a?.date === 'string' &&
                    typeof a?.quote === 'string' &&
                    typeof a?.type === 'string'
            )
        } catch (err) {
            const status = (err as any)?.status ?? (err as any)?.response?.status
            if (status === 404) {
                // Not yet generated — treat as empty, not an error
                announcements.value = []
            } else {
                error.value = err instanceof Error ? err.message : 'Failed to load announcements.'
                console.error('[useAnnouncements] Failed to load:', err)
                announcements.value = []
            }
        } finally {
            isLoading.value = false
            loadPromise.value = null
        }
    }

    return { announcements, isLoading, error, loadAnnouncements }
}
