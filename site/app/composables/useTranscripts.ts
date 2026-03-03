/**
 * Composable for fetching the transcript index and individual transcript
 * files on demand. Follows the same lazy-loading useState pattern as
 * useAnnouncements.ts.
 */

export interface TranscriptSegment {
    start: number
    end: number
    text: string
    source_recording: string
}

export interface TranscriptEntry {
    date: string
    recordings: string[]
    transcript: string
    segments: TranscriptSegment[]
    merged_at: string
}

export interface TranscriptIndexEntry {
    date: string
    recordings: string[]
    segment_count: number
}

export function useTranscripts() {
    const index = useState<TranscriptIndexEntry[]>('transcripts-index', () => [])
    const isIndexLoading = useState<boolean>('transcripts-index-loading', () => false)
    const indexError = useState<string>('transcripts-index-error', () => '')
    const indexLoadPromise = useState<Promise<void> | null>('transcripts-index-load-promise', () => null)

    // Cache: date string → full TranscriptEntry
    const loadedTranscripts = useState<Record<string, TranscriptEntry>>('transcripts-loaded', () => ({}))
    const transcriptLoadingDates = useState<Record<string, boolean>>('transcripts-loading-dates', () => ({}))

    async function loadIndex() {
        if (indexLoadPromise.value) return indexLoadPromise.value

        indexLoadPromise.value = _loadIndex()
        return indexLoadPromise.value
    }

    async function _loadIndex() {
        isIndexLoading.value = true
        indexError.value = ''
        loadedTranscripts.value = {}

        try {
            const baseURL = useRuntimeConfig().app.baseURL || '/'
            const url = `${baseURL.replace(/\/$/, '')}/transcripts/index.json`
            const data = await $fetch<{ generated_at?: string; dates?: unknown[] }>(url, { cache: 'no-store' })

            const raw = Array.isArray(data?.dates) ? data.dates : []
            index.value = raw.filter(
                (entry): entry is TranscriptIndexEntry =>
                    typeof (entry as any)?.date === 'string' &&
                    Array.isArray((entry as any)?.recordings) &&
                    typeof (entry as any)?.segment_count === 'number'
            )
        } catch (err) {
            const status = (err as any)?.status ?? (err as any)?.response?.status
            if (status === 404) {
                // Not yet generated — treat as empty, not an error
                index.value = []
            } else {
                indexError.value =
                    err instanceof Error ? err.message : 'Failed to load transcript index.'
                console.error('[useTranscripts] Failed to load index:', err)
                index.value = []
            }
        } finally {
            isIndexLoading.value = false
            indexLoadPromise.value = null
        }
    }

    async function loadTranscript(date: string): Promise<void> {
        if (loadedTranscripts.value[date]) return
        if (transcriptLoadingDates.value[date]) return

        transcriptLoadingDates.value = { ...transcriptLoadingDates.value, [date]: true }

        try {
            const baseURL = useRuntimeConfig().app.baseURL || '/'
            const url = `${baseURL.replace(/\/$/, '')}/transcripts/${date}.json`
            const data = await $fetch<TranscriptEntry>(url, { cache: 'no-store' })

            if (
                data &&
                typeof data.date === 'string' &&
                Array.isArray(data.recordings) &&
                Array.isArray(data.segments)
            ) {
                loadedTranscripts.value = { ...loadedTranscripts.value, [date]: data }
            }
        } catch (err) {
            const status = (err as any)?.status ?? (err as any)?.response?.status
            if (status !== 404) {
                console.error(`[useTranscripts] Failed to load transcript ${date}:`, err)
            }
        } finally {
            const updated = { ...transcriptLoadingDates.value }
            delete updated[date]
            transcriptLoadingDates.value = updated
        }
    }

    function getTranscript(date: string): TranscriptEntry | null {
        return loadedTranscripts.value[date] ?? null
    }

    function isTranscriptLoading(date: string): boolean {
        return !!transcriptLoadingDates.value[date]
    }

    return {
        index,
        isIndexLoading,
        indexError,
        loadedTranscripts,
        loadIndex,
        loadTranscript,
        getTranscript,
        isTranscriptLoading,
    }
}
