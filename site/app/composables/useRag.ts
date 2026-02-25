/** Shape of a chunk as it arrives from embeddings.json (no derived fields). */
interface RawChunk {
    text: string
    page: number
    heading: string
    embedding: number[]
}

/** Internal chunk with pre-computed search acceleration fields. */
interface Chunk extends RawChunk {
    /** Pre-computed L2 norm of the embedding vector (set once at load time). */
    norm: number
    /** Lower-cased heading+text for fast text matching (set once at load time). */
    haystack: string
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

/**
 * Pre-compute the L2 (Euclidean) norm of a vector so cosine similarity
 * only needs a dot product at query time.
 */
function vectorNorm(v: number[]): number {
    let sum = 0
    for (let i = 0; i < v.length; i++) sum += v[i]! * v[i]!
    return Math.sqrt(sum)
}

/**
 * Fast cosine similarity using a pre-computed norm for the document vector.
 * Only the query norm is computed once per search call (see `search()`).
 */
function fastCosine(query: number[], queryNorm: number, doc: number[], docNorm: number): number {
    if (queryNorm === 0 || docNorm === 0) return 0
    let dot = 0
    for (let i = 0; i < query.length; i++) dot += query[i]! * doc[i]!
    return dot / (queryNorm * docNorm)
}

function tokenize(input: string): string[] {
    return input
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter(token => token.length > 2)
}

/** Maximum number of candidates to rank with cosine similarity. */
const MAX_COSINE_CANDIDATES = 200

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
            const data = await $fetch<{ chunks?: unknown[] }>(url)

            const chunks: Chunk[] = Array.isArray(data?.chunks)
                ? (data.chunks as unknown[])
                      .filter((chunk): chunk is RawChunk => {
                          const c = chunk as Partial<RawChunk> | undefined
                          return (
                              typeof c?.text === 'string' &&
                              typeof c?.page === 'number' &&
                              typeof c?.heading === 'string' &&
                              Array.isArray(c?.embedding)
                          )
                      })
                      .filter(chunk => !isIntroOrTocChunk(chunk))
                      .map(chunk => {
                          const heading = isValidTopic(cleanHeading(chunk.heading))
                              ? cleanHeading(chunk.heading)
                              : inferHeadingFromText(chunk.text)
                          return {
                              text: chunk.text,
                              page: chunk.page,
                              heading,
                              embedding: chunk.embedding,
                              // Pre-compute for O(1) cosine similarity at query time
                              norm: vectorNorm(chunk.embedding),
                              haystack: `${heading} ${chunk.text}`.toLowerCase(),
                          }
                      })
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

    function search(queryEmbedding: number[], topK = 5, queryText?: string): SearchResult[] {
        const chunks = embeddings.value?.chunks ?? []
        if (!Array.isArray(queryEmbedding) || queryEmbedding.length === 0 || chunks.length === 0) {
            return []
        }

        const qNorm = vectorNorm(queryEmbedding)

        // For large chunk sets, narrow candidates with a cheap text pre-filter
        // before running cosine similarity. This avoids O(N) dot products.
        let candidates = chunks
        if (queryText && chunks.length > MAX_COSINE_CANDIDATES) {
            const queryTokens = tokenize(queryText)
            if (queryTokens.length > 0) {
                const withHits = chunks
                    .map(chunk => {
                        let hits = 0
                        for (const t of queryTokens) {
                            if (chunk.haystack.includes(t)) hits++
                        }
                        return { chunk, hits }
                    })
                    .filter(c => c.hits > 0)
                    .sort((a, b) => b.hits - a.hits)
                    .slice(0, MAX_COSINE_CANDIDATES)
                    .map(c => c.chunk)
                if (withHits.length > 0) candidates = withHits
            }
        }

        const scored = candidates.map(chunk => ({
            text: chunk.text,
            page: chunk.page,
            heading: chunk.heading,
            score: fastCosine(queryEmbedding, qNorm, chunk.embedding, chunk.norm),
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
                let tokenMatches = 0

                for (const token of queryTokens) {
                    if (chunk.haystack.includes(token)) tokenMatches++
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
