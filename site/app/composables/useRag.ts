import { cosineSimilarity } from '~/utils/cosine'

interface Chunk {
    text: string
    page: number
    heading: string
    embedding: number[]
}

interface EmbeddingsData {
    chunks: Chunk[]
}

interface SearchResult {
    text: string
    page: number
    heading: string
    score: number
}

function tokenize(input: string): string[] {
    return input
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter(token => token.length > 2)
}

/**
 * Detects intro / title page and table-of-contents chunks that add noise
 * (e.g. "Trevor Flahardy", pages of dots from the TOC). Page 1 is always
 * the title page. For page 2+ we use a heuristic: if >40% of the text is
 * dots/whitespace it's almost certainly a TOC page.
 */
/**
 * Strips trailing page-fraction patterns like " 2 / 12" from headings
 * and trims emoji prefixes.
 */
function cleanHeading(heading: string): string {
    return heading
        .replace(/\s+\d+\s*\/\s*\d+\s*$/, '') // strip "  2 / 12"
        .replace(/^[\p{Emoji}\p{Emoji_Presentation}\s]+/u, '') // strip leading emoji
        .trim()
}

/**
 * Returns false for headings that are just page numbers, fractions,
 * very short fragments, or author names from the title page.
 */
function isValidTopic(heading: string): boolean {
    // Reject bare numbers or fractions: "11", "1 / 12"
    if (/^\s*\d+\s*(\/\s*\d+)?\s*$/.test(heading)) return false
    // Must have at least 4 alphabetic characters
    const alpha = heading.replace(/[^a-zA-Z]/g, '')
    if (alpha.length < 4) return false
    // Reject known non-topic strings
    const lower = heading.toLowerCase()
    if (lower === 'general' || lower.includes('trevor flahardy')) return false
    return true
}

/**
 * When the original heading is unusable (e.g. author name), try to derive a
 * reasonable topic from the chunk text itself. Looks for common Typst-style
 * section markers like "Part 1: Mechanisms" or falls back to first meaningful
 * phrase.
 */
function inferHeadingFromText(text: string): string {
    // Match patterns like "Part 1: Mechanisms" or "1.3. Containment Mechanisms"
    const sectionMatch = text.match(/(?:Part\s+\d+[:.]\s*)([A-Z][A-Za-z\s]+)/)
        || text.match(/\d+\.\d+\.?\s+([A-Z][A-Za-z\s]{4,40})/)
    if (sectionMatch?.[1]) return sectionMatch[1].trim()

    // Extract leading capitalized phrase
    const leadMatch = text.match(/^(?:.*?\s{2,})?([A-Z][A-Za-z\s]{4,50}?)(?:\s{2,}|[.!?])/)
    if (leadMatch?.[1]) return leadMatch[1].trim()

    return 'Course Notes'
}

function isIntroOrTocChunk(chunk: { text: string; page: number }): boolean {
    // Page 1 is always the title / author page
    if (chunk.page === 1) return true

    // TOC pages are full of repeated dots used as leaders
    const dotCount = (chunk.text.match(/\.{2,}/g) || []).reduce((sum, m) => sum + m.length, 0)
    if (dotCount > chunk.text.length * 0.35) return true

    // Very short chunks on early pages with no real content
    const stripped = chunk.text.replace(/[.\s]/g, '')
    if (chunk.page <= 3 && stripped.length < 60) return true

    return false
}

export function useRag() {
    const embeddings = useState<EmbeddingsData | null>('rag-embeddings', () => null)
    const loadPromise = useState<Promise<void> | null>('rag-load-promise', () => null)
    const loadError = useState<string>('rag-load-error', () => '')

    const isLoaded = computed(() => (embeddings.value?.chunks?.length ?? 0) > 0)

    const topics = computed(() => {
        const chunks = embeddings.value?.chunks ?? []
        const headings = chunks.map(c => cleanHeading(c.heading))
        return [...new Set(headings)].filter(h => h.length > 0 && isValidTopic(h))
    })

    async function load() {
        if ((embeddings.value?.chunks?.length ?? 0) > 0) return
        if (loadPromise.value) return loadPromise.value

        loadPromise.value = _load()
        return loadPromise.value
    }

    async function _load() {
        try {
            loadError.value = ''
            const baseURL = useRuntimeConfig().app.baseURL || '/'
            const url = `${baseURL.replace(/\/$/, '')}/embeddings.json`
            const data = await $fetch<Partial<EmbeddingsData>>(url)

            const chunks = Array.isArray(data?.chunks)
                ? data.chunks
                      .filter((chunk): chunk is Chunk => {
                          return (
                              typeof chunk?.text === 'string' &&
                              typeof chunk?.page === 'number' &&
                              typeof chunk?.heading === 'string' &&
                              Array.isArray(chunk?.embedding)
                          )
                      })
                      .filter(chunk => !isIntroOrTocChunk(chunk))
                      .map(chunk => ({
                          text: chunk.text,
                          page: chunk.page,
                          heading: isValidTopic(cleanHeading(chunk.heading))
                              ? cleanHeading(chunk.heading)
                              : inferHeadingFromText(chunk.text),
                          embedding: chunk.embedding,
                      }))
                : []

            embeddings.value = { chunks }
        } catch (err) {
            const status = (err as any)?.status ?? (err as any)?.response?.status
            if (status === 404) {
                loadError.value =
                    'embeddings.json was not found in site/public. Run: `cd scripts && bun install && bun run extract`.'
            } else {
                loadError.value =
                    err instanceof Error ? err.message : 'Failed to load embeddings.json.'
            }
            console.error('[useRag] Failed to load embeddings:', err)
            embeddings.value = { chunks: [] }
        } finally {
            loadPromise.value = null
        }
    }

    function search(queryEmbedding: number[], topK = 5): SearchResult[] {
        const chunks = embeddings.value?.chunks ?? []
        if (!Array.isArray(queryEmbedding) || queryEmbedding.length === 0 || chunks.length === 0) {
            return []
        }

        const scored = chunks.map(chunk => ({
            text: chunk.text,
            page: chunk.page,
            heading: chunk.heading,
            score: cosineSimilarity(queryEmbedding, chunk.embedding),
        }))

        scored.sort((a, b) => b.score - a.score)
        return scored.slice(0, topK)
    }

    function searchByText(query: string, topK = 5): SearchResult[] {
        const chunks = embeddings.value?.chunks ?? []
        if (!query.trim() || chunks.length === 0) return []

        const queryTokens = new Set(tokenize(query))
        if (queryTokens.size === 0) return []

        const scored = chunks
            .map(chunk => {
                const haystack = `${chunk.heading} ${chunk.text}`.toLowerCase()
                let tokenMatches = 0

                for (const token of queryTokens) {
                    if (haystack.includes(token)) tokenMatches++
                }

                const score = tokenMatches / queryTokens.size
                return {
                    text: chunk.text,
                    page: chunk.page,
                    heading: chunk.heading,
                    score,
                }
            })
            .filter(result => result.score > 0)

        scored.sort((a, b) => b.score - a.score)
        return scored.slice(0, topK)
    }

    return { embeddings, isLoaded, topics, loadError, load, search, searchByText }
}
