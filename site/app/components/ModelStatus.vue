<template>
    <div class="flex items-center gap-2">
        <!-- Tier badge -->
        <UBadge :color="tier === 2 ? 'secondary' : 'info'" :variant="tier === 2 ? 'solid' : 'subtle'" size="xs">
            <template #leading>
                <UIcon :name="tier === 2 ? 'i-lucide-sparkles' : 'i-lucide-search'" class="w-3 h-3" />
            </template>
            {{ tier === 2 ? 'Full AI' : 'Smart Search' }}
        </UBadge>

        <!-- Loading progress -->
        <div v-if="isLoading" class="flex items-center gap-2 min-w-0">
            <UProgress :value="progress" size="xs" color="secondary" class="w-24" />
            <span class="text-xs tabular-nums text-gray-500 whitespace-nowrap">
                {{ Math.round(progress) }}%
            </span>
            <span v-if="progressText" class="text-xs text-gray-400 truncate hidden sm:inline">
                {{ progressText }}
            </span>
        </div>

        <!-- Upgrade prompt -->
        <div v-else-if="tier === 1 && webGpuAvailable" class="flex items-center gap-1">
            <UButton size="xs" variant="ghost" color="secondary" @click="$emit('upgrade')">
                <UIcon name="i-lucide-zap" class="w-3 h-3" />
                <span class="hidden sm:inline">Upgrade to Full AI</span>
            </UButton>
            <UButton size="xs" variant="ghost" color="neutral" :title="tooltipText" aria-label="Info about Full AI">
                <UIcon name="i-lucide-info" class="w-3.5 h-3.5 text-gray-400" />
            </UButton>
        </div>
    </div>
</template>

<script setup lang="ts">
defineProps<{
    tier: 1 | 2
    isLoading: boolean
    progress: number
    progressText: string
    webGpuAvailable: boolean
}>()

defineEmits<{
    upgrade: []
}>()

const tooltipText = 'Download a small AI model (~50 MB) for richer answers powered by on-device inference. Requires WebGPU.'
</script>
