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

export function useRag() {
    const embeddings = useState<EmbeddingsData | null>('rag-embeddings', () => null)
    const loadPromise = useState<Promise<void> | null>('rag-load-promise', () => null)
    const loadError = useState<string>('rag-load-error', () => '')

    const isLoaded = computed(() => (embeddings.value?.chunks?.length ?? 0) > 0)

    const topics = computed(() => {
        const chunks = embeddings.value?.chunks ?? []
        const headings = chunks.map(c => c.heading)
        return [...new Set(headings)].filter(Boolean)
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
                      .map(chunk => ({
                          text: chunk.text,
                          page: chunk.page,
                          heading: chunk.heading,
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
