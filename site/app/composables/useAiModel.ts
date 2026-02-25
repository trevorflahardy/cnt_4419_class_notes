type MLCEngine = any

/** WebLLM model used for on-device inference. */
const MODEL_ID = 'Llama-3.2-3B-Instruct-q4f16_1-MLC'

/**
 * Module-level engine reference — intentionally kept outside Vue reactive
 * state to prevent Proxy wrapping that causes BindingError in WASM bindings.
 */
let _engine: MLCEngine | null = null
let initPromise: Promise<void> | null = null

/** Extract the text content from a WebLLM streaming or non-streaming chunk. */
function extractChunkText(chunk: any): string {
    const choice = chunk?.choices?.[0]
    const deltaContent = choice?.delta?.content
    const messageContent = choice?.message?.content

    if (typeof deltaContent === 'string') return deltaContent

    if (Array.isArray(deltaContent)) {
        return deltaContent
            .map(part => {
                if (typeof part === 'string') return part
                if (typeof part?.text === 'string') return part.text
                if (typeof part?.content === 'string') return part.content
                return ''
            })
            .join('')
    }

    if (typeof messageContent === 'string') return messageContent

    if (Array.isArray(messageContent)) {
        return messageContent
            .map(part => {
                if (typeof part === 'string') return part
                if (typeof part?.text === 'string') return part.text
                if (typeof part?.content === 'string') return part.content
                return ''
            })
            .join('')
    }

    return ''
}

/**
 * Composable for managing the on-device LLM via WebLLM.
 *
 * Handles WebGPU availability detection, model download with progress
 * tracking, and streaming chat completions.
 */
export function useAiModel() {
    const isAvailable = useState<boolean>('tier2-is-available', () => false)
    const isLoading = useState<boolean>('tier2-is-loading', () => false)
    const isReady = useState<boolean>('tier2-is-ready', () => false)
    const progress = useState<number>('tier2-progress', () => 0)
    const progressText = useState<string>('tier2-progress-text', () => '')

    function checkAvailability() {
        if (import.meta.client) {
            isAvailable.value = !!(navigator as any).gpu
        }
    }

    async function init() {
        if (_engine) return
        if (initPromise) return initPromise
        initPromise = _init().finally(() => {
            if (!_engine) initPromise = null
        })
        return initPromise
    }

    async function _init() {
        if (!isAvailable.value) {
            throw new Error('WebGPU is not available in this browser.')
        }

        try {
            isLoading.value = true
            progressText.value = 'Loading AI model...'

            const { CreateMLCEngine } = await import('@mlc-ai/web-llm')

            // Store engine at module level — NOT in Vue reactive state — to
            // prevent Proxy wrapping that causes BindingError in WASM bindings.
            _engine = await CreateMLCEngine(MODEL_ID, {
                initProgressCallback: (report: any) => {
                    progress.value = Math.round((report.progress || 0) * 100)
                    progressText.value = report.text || `Loading AI model... ${progress.value}%`
                },
            })

            isReady.value = true
            progress.value = 100
            progressText.value = 'AI model ready'
        } catch (err) {
            console.error('[useModel] Failed to initialize:', err)
            progressText.value = 'Failed to load AI model'
            isReady.value = false
            _engine = null
            throw err
        } finally {
            isLoading.value = false
        }
    }

    async function reset() {
        try {
            if (_engine?.unload) await _engine.unload()
        } catch (err) {
            console.warn('[useModel] Failed to unload engine cleanly:', err)
        } finally {
            _engine = null
            isReady.value = false
            isLoading.value = false
            progress.value = 0
            progressText.value = ''
            initPromise = null
        }
    }

    async function* chat(
        messages: Array<{ role: string; content: string }>
    ): AsyncGenerator<string> {
        if (!_engine) {
            throw new Error('AI model not initialized. Call init() first.')
        }

        const response = await _engine.chat.completions.create({
            messages,
            stream: true,
        })

        let emitted = false
        for await (const chunk of response) {
            const text = extractChunkText(chunk)
            if (text) {
                emitted = true
                yield text
            }
        }

        if (!emitted) {
            const fallback = await _engine.chat.completions.create({
                messages,
                stream: false,
            })

            const fullText = extractChunkText(fallback)
            if (fullText) {
                yield fullText
            } else {
                throw new Error('AI returned an empty response.')
            }
        }
    }

    if (import.meta.client) {
        checkAvailability()
    }

    return { isAvailable, isLoading, isReady, progress, progressText, init, reset, chat }
}
