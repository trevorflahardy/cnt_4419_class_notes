<template>
    <div class="h-full">
        <div
            class="bg-white dark:bg-gray-900 rounded-xl flex flex-col h-full overflow-hidden border border-gray-200 dark:border-gray-700">
            <!-- Header -->
            <div
                class="flex items-center justify-between gap-2 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                <div class="flex items-center gap-2">
                    <UIcon name="i-lucide-sparkles" class="w-5 h-5 text-primary-500" />
                    <span class="font-semibold text-sm">AI Assistant</span>
                </div>
                <div class="flex items-center gap-2">
                    <UBadge :color="modelReady ? 'primary' : 'neutral'" variant="subtle" size="xs">
                        {{ modelReady ? 'AI Ready' : 'Model Required' }}
                    </UBadge>
                    <UButton size="xs" variant="soft" color="primary" @click="downloadModel" :loading="isModelLoading"
                        :disabled="!webGpuAvailable || modelReady">
                        {{ modelReady ? 'Downloaded' : 'Download AI' }}
                    </UButton>
                </div>
            </div>

            <!-- Model loading progress -->
            <div v-if="isModelLoading" class="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                <div class="flex items-center justify-between text-xs text-gray-500 mb-1">
                    <span>{{ modelProgressText || 'Loading model…' }}</span>
                    <span class="tabular-nums">{{ Math.round(modelProgress) }}%</span>
                </div>
                <UProgress :value="modelProgress" size="xs" color="primary" />
            </div>

            <div v-if="!webGpuAvailable" class="border-b border-gray-200 dark:border-gray-700 px-4 py-2">
                <p class="text-xs text-rose-500">
                    WebGPU is not available in this browser. On-device AI requires a WebGPU-compatible browser.
                </p>
            </div>

            <!-- Messages -->
            <div ref="messagesContainer" class="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
                <!-- Welcome message -->
                <div v-if="messages.length <= 1"
                    class="flex flex-col items-center justify-center h-full text-center gap-3 py-8">
                    <UIcon name="i-lucide-message-circle" class="w-10 h-10 text-gray-300 dark:text-gray-600" />
                    <p class="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
                        Ask me anything about the course notes! Try:
                    </p>
                    <div class="flex flex-wrap justify-center gap-2">
                        <UBadge v-for="suggestion in suggestions" :key="suggestion" variant="subtle" color="neutral"
                            class="cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                            @click="sendSuggestion(suggestion)">
                            {{ suggestion }}
                        </UBadge>
                    </div>
                </div>

                <!-- Chat messages -->
                <ChatMessage v-for="(msg, i) in messages" :key="i" :message="msg" />

                <!-- Typing indicator -->
                <TypingIndicator v-if="isLoading" />
            </div>

            <!-- Input -->
            <div class="border-t border-gray-200 dark:border-gray-700 p-3">
                <!-- Model not ready — show why the input is blocked -->
                <div v-if="!modelReady" class="mb-2 flex items-start gap-2 rounded-lg border px-3 py-2" :class="!webGpuAvailable
                    ? 'border-red-200 bg-red-50 dark:border-red-800/40 dark:bg-red-950/30'
                    : 'border-amber-200 bg-amber-50 dark:border-amber-800/40 dark:bg-amber-950/30'">
                    <UIcon :name="!webGpuAvailable ? 'i-heroicons-exclamation-triangle' : 'i-heroicons-cpu-chip'"
                        class="mt-0.5 h-4 w-4 shrink-0" :class="!webGpuAvailable ? 'text-red-500' : 'text-amber-500'" />
                    <div class="flex-1">
                        <p class="text-xs font-semibold"
                            :class="!webGpuAvailable ? 'text-red-700 dark:text-red-400' : 'text-amber-700 dark:text-amber-400'">
                            {{ !webGpuAvailable ? 'WebGPU not available — AI cannot run' : 'AI model not downloaded' }}
                        </p>
                        <p class="text-xs"
                            :class="!webGpuAvailable ? 'text-red-600/70 dark:text-red-400/60' : 'text-amber-600/70 dark:text-amber-400/60'">
                            {{ !webGpuAvailable
                                ? 'Use Chrome 113+ or Edge 113+ with WebGPU.'
                                : 'Click "Download AI" above to enable chat.' }}
                        </p>
                    </div>
                </div>
                <div class="flex items-end gap-2">
                    <UTextarea v-model="userInput"
                        :placeholder="!modelReady ? (!webGpuAvailable ? 'WebGPU unavailable — chat disabled' : 'Download the AI model to start chatting') : 'Ask about the notes...'"
                        autoresize :rows="1" :maxrows="4" class="flex-1"
                        :class="!modelReady ? 'opacity-60 cursor-not-allowed' : ''" :disabled="!modelReady"
                        @keydown.enter.exact.prevent="handleSend" />
                    <UButton icon="i-lucide-send" color="primary"
                        :disabled="!userInput.trim() || isLoading || !modelReady" @click="handleSend"
                        aria-label="Send message" />
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
const { messages, sendMessage, isLoading, modelReady, webGpuAvailable, downloadModel, isModelLoading, modelProgress, modelProgressText } = useAiChat()

const userInput = ref('')
const messagesContainer = ref<HTMLElement | null>(null)

const suggestions = [
    'What kind of mechanisms are discussed?',
    'Explain the Secure Software Design Principles',
    'Summarize Authorization',
]

function handleSend() {
    const text = userInput.value.trim()
    if (!text || isLoading.value) return
    sendMessage(text)
    userInput.value = ''
}

function sendSuggestion(text: string) {
    sendMessage(text)
}

// Auto-scroll on new messages
watch(
    () => messages.value.length,
    () => {
        nextTick(() => {
            const el = messagesContainer.value
            if (el) el.scrollTop = el.scrollHeight
        })
    },
)
</script>
