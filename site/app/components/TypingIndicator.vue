<template>
    <div class="flex justify-start gap-2">
        <!-- Avatar -->
        <div class="shrink-0 mt-1">
            <div class="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center">
                <UIcon name="i-lucide-sparkles" class="w-4 h-4 text-primary-500" />
            </div>
        </div>

        <!-- Bubble with dots -->
        <div class="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-1.5">
            <span class="typing-dot w-2 h-2 rounded-full bg-gray-400 inline-block"
                style="animation-delay: 0ms" />
            <span class="typing-dot w-2 h-2 rounded-full bg-gray-400 inline-block"
                style="animation-delay: 150ms" />
            <span class="typing-dot w-2 h-2 rounded-full bg-gray-400 inline-block"
                style="animation-delay: 300ms" />
        </div>
    </div>
</template>

<style scoped>
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
