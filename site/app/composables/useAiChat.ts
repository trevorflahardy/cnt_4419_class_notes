import { useAiModel } from './useAiModel';

interface ChatMessage {
    role: 'user' | 'assistant' | 'system'
    content: string
    sources?: Array<{ text: string; page: number; heading?: string }>
}

let initializePromise: Promise<void> | null = null

export function useAiChat() {
    const rag = useRag()
    const model = useAiModel()

    const messages = useState<ChatMessage[]>('ai-chat-messages', () => [
        {
            role: 'system',
            content:
                'Welcome! I can answer questions about your Secure Coding class notes. Try asking about mechanisms, access control, or any other topic.',
        },
    ])

    const isLoading = useState<boolean>('ai-chat-is-loading', () => false)

    const isModelLoading = computed(() => model.isLoading.value)
    const modelProgress = computed(() => (model.isReady.value ? 100 : model.progress.value))
    const modelProgressText = computed(() => {
        if (model.isReady.value) return 'AI model ready'
        return model.progressText.value || 'Download the AI model to start chatting.'
    })
    const modelReady = computed(() => model.isReady.value)
    const webGpuAvailable = computed(() => model.isAvailable.value)

    async function initialize() {
        if (initializePromise) return initializePromise
        try {
            initializePromise = rag.load().then(() => undefined)
            await initializePromise
        } catch (err) {
            console.error('[useAiChat] Initialization error:', err)
            initializePromise = null
        }
    }

    async function downloadModel() {
        try {
            await model.init()
        } catch (err) {
            console.error('[useAiChat] Failed to load AI model:', err)
        }
    }

    async function sendMessage(text: string) {
        if (!model.isReady.value) {
            messages.value.push({
                role: 'assistant',
                content:
                    'The AI model is not ready yet. Click "Download AI" first, then try again.',
            })
            return
        }

        messages.value.push({ role: 'user', content: text })
        isLoading.value = true

        try {
            await rag.load()

            const results = rag.searchByText(text, 5)
            const sources = results.map(r => ({
                text: r.text,
                page: r.page,
                heading: r.heading,
            }))

            const systemPrompt =
                'You are a helpful study assistant for a Secure Coding course. Answer based on the provided notes context when available. If context is missing, say that notes embeddings are not loaded and provide a best-effort answer.'

            const contextText = results.length
                ? results
                      .map((r, i) => `[${i + 1}] (Page ${r.page}, ${r.heading}): ${r.text}`)
                      .join('\n\n')
                : rag.loadError.value
                ? `No note context available. ${rag.loadError.value}`
                : 'No note context available from embeddings.json.'

            const chatMessages = [
                { role: 'system', content: systemPrompt },
                {
                    role: 'user',
                    content: `Context from class notes:\n${contextText}\n\nQuestion: ${text}`,
                },
            ]

            const assistantMessage: ChatMessage = {
                role: 'assistant',
                content: '',
            }
            messages.value.push(assistantMessage)
            const assistantIndex = messages.value.length - 1

            const stream = model.chat(chatMessages)
            for await (const token of stream) {
                const current = messages.value[assistantIndex]
                if (!current) continue
                messages.value[assistantIndex] = {
                    ...current,
                    content: current.content + token,
                }
            }

            const completed = messages.value[assistantIndex]
            if (completed) {
                messages.value[assistantIndex] = {
                    ...completed,
                    sources,
                }
            }
        } catch (err) {
            console.error('[useAiChat] Error sending message:', err)
            messages.value.push({
                role: 'assistant',
                content:
                    'Sorry, I encountered an error processing your question. Please try again.',
            })
        } finally {
            isLoading.value = false
        }
    }

    // Auto-initialize on client side
    if (import.meta.client) {
        initialize()
    }

    return {
        messages,
        isLoading,
        modelReady,
        isModelLoading,
        modelProgress,
        modelProgressText,
        webGpuAvailable,
        initialize,
        downloadModel,
        sendMessage,
    }
}
