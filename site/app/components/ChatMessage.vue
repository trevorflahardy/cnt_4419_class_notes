<template>
    <div class="flex gap-2 message-enter" :class="isUser ? 'justify-end' : 'justify-start'">
        <!-- Assistant avatar -->
        <div v-if="!isUser" class="shrink-0 mt-1">
            <div class="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center">
                <UIcon name="i-lucide-sparkles" class="w-4 h-4 text-primary-500" />
            </div>
        </div>

        <div class="max-w-[80%] space-y-1">
            <!-- Message bubble -->
            <div class="px-3.5 py-2.5 text-sm leading-relaxed" :class="bubbleClasses">
                <div v-if="showPending" class="flex items-center gap-1.5 py-1">
                    <span class="typing-dot w-2 h-2 rounded-full bg-gray-400 inline-block"
                        style="animation-delay: 0ms" />
                    <span class="typing-dot w-2 h-2 rounded-full bg-gray-400 inline-block"
                        style="animation-delay: 150ms" />
                    <span class="typing-dot w-2 h-2 rounded-full bg-gray-400 inline-block"
                        style="animation-delay: 300ms" />
                </div>
                <div v-else v-html="renderedContent" class="prose-chat" />
            </div>

            <!-- Sources -->
            <div v-if="message.sources?.length" class="mt-1.5">
                <button
                    class="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1 transition-colors"
                    @click="showSources = !showSources">
                    <UIcon :name="showSources ? 'i-lucide-chevron-down' : 'i-lucide-chevron-right'" class="w-3 h-3" />
                    {{ message.sources.length }} source{{ message.sources.length > 1 ? 's' : '' }}
                </button>
                <div v-if="showSources" class="flex flex-wrap gap-1 mt-1">
                    <UBadge v-for="(src, i) in message.sources" :key="i" variant="subtle" color="info" size="xs"
                        class="cursor-pointer" @click="$emit('navigate-to-page', src.page)">
                        p.{{ src.page }}{{ src.heading ? ` — ${src.heading}` : '' }}
                    </UBadge>
                </div>
            </div>
        </div>

        <!-- User avatar -->
        <div v-if="isUser" class="shrink-0 mt-1">
            <div class="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center">
                <UIcon name="i-lucide-user" class="w-4 h-4 text-gray-500" />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
interface Source {
    text: string
    page: number
    heading?: string
}

interface Message {
    role: 'user' | 'assistant' | 'system'
    content: string
    pending?: boolean
    sources?: Source[]
}

const props = defineProps<{
    message: Message
}>()

defineEmits<{
    'navigate-to-page': [page: number]
}>()

const showSources = ref(false)

const isUser = computed(() => props.message.role === 'user')

const bubbleClasses = computed(() => {
    if (isUser.value) {
        return 'bg-primary-500/10 text-gray-900 rounded-2xl rounded-br-md'
    }
    return 'bg-gray-100 text-gray-900 rounded-2xl rounded-bl-md'
})

const showPending = computed(() => {
    return props.message.role === 'assistant' && !!props.message.pending && !props.message.content.trim()
})

const renderedContent = computed(() => {
    let text = props.message.content

    // Escape HTML
    text = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

    // Code blocks (``` ... ```)
    text = text.replace(/```(\w*)\n?([\s\S]*?)```/g, (_match, _lang, code) => {
        return `<pre class="bg-gray-900 text-gray-100 rounded-lg p-3 my-2 text-xs overflow-x-auto"><code>${code.trim()}</code></pre>`
    })

    // Inline code
    text = text.replace(/`([^`]+)`/g, '<code class="bg-gray-200 px-1 py-0.5 rounded text-xs">$1</code>')

    // Bold
    text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')

    // Italic
    text = text.replace(/\*(.+?)\*/g, '<em>$1</em>')

    // Unordered lists
    text = text.replace(/^[-*] (.+)$/gm, '<li class="ml-4 list-disc">$1</li>')

    // Ordered lists
    text = text.replace(/^\d+\. (.+)$/gm, '<li class="ml-4 list-decimal">$1</li>')

    // Line breaks
    text = text.replace(/\n/g, '<br>')

    return text
})
</script>

<style scoped>
.message-enter {
    animation: message-slide-in 0.3s ease-out;
}

@keyframes message-slide-in {
    from {
        opacity: 0;
        transform: translateY(8px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.prose-chat :deep(pre) {
    margin: 0.5rem 0;
}

.prose-chat :deep(li + li) {
    margin-top: 0.125rem;
}

.typing-dot {
    animation: typing-bounce 1.4s ease-in-out infinite;
}

@keyframes typing-bounce {

    0%,
    60%,
    100% {
        transform: translateY(0);
        opacity: 0.4;
    }

    30% {
        transform: translateY(-4px);
        opacity: 1;
    }
}
</style>
