<template>
    <div class="flex flex-col items-center gap-4">
        <!-- Circular progress ring -->
        <div class="relative inline-flex items-center justify-center" :class="{ 'animate-celebrate': celebrate }">
            <svg class="transform -rotate-90" :width="size" :height="size" :viewBox="`0 0 ${size} ${size}`">
                <!-- Background circle -->
                <circle :cx="center" :cy="center" :r="radius" fill="none" :stroke="trackColor"
                    :stroke-width="strokeWidth" class="transition-colors duration-500" />
                <!-- Progress circle -->
                <circle :cx="center" :cy="center" :r="radius" fill="none" :stroke="progressColor"
                    :stroke-width="strokeWidth" stroke-linecap="round" :stroke-dasharray="circumference"
                    :stroke-dashoffset="dashOffset" class="transition-all duration-1000 ease-out" />
            </svg>

            <!-- Center content -->
            <div class="absolute inset-0 flex flex-col items-center justify-center">
                <span class="text-4xl font-bold tabular-nums" :style="{ color: progressColor }">
                    {{ displayPercentage }}%
                </span>
                <span class="text-xs font-medium text-(--ui-text-muted) mt-0.5">
                    {{ letterGrade }}
                </span>
            </div>
        </div>

        <!-- Score text -->
        <div class="text-center space-y-1">
            <p class="text-lg font-semibold text-(--ui-text-highlighted)">
                {{ displayCorrect }} out of {{ total }} correct
            </p>
            <UBadge :color="badgeColor" variant="subtle" size="lg">
                Grade: {{ letterGrade }}
            </UBadge>
        </div>
    </div>
</template>

<script setup lang="ts">
const props = defineProps<{
    score: number
    total: number
    percentage: number
}>()

const size = 180
const strokeWidth = 12
const center = size / 2
const radius = center - strokeWidth
const circumference = 2 * Math.PI * radius

// Animated counter
const displayPercentage = ref(0)
const displayCorrect = ref(0)

const celebrate = computed(() => props.percentage >= 80)

const progressColor = computed(() => {
    const p = props.percentage
    if (p >= 80) return '#22c55e'
    if (p >= 60) return '#eab308'
    return '#ef4444'
})

const trackColor = computed(() => {
    // subtle track behind the ring
    return 'var(--ui-border)'
})

const badgeColor = computed(() => {
    const p = props.percentage
    if (p >= 80) return 'success' as const
    if (p >= 60) return 'warning' as const
    return 'error' as const
})

const letterGrade = computed(() => {
    const p = props.percentage
    if (p >= 90) return 'A'
    if (p >= 80) return 'B'
    if (p >= 70) return 'C'
    if (p >= 60) return 'D'
    return 'F'
})

const dashOffset = computed(() => {
    const progress = displayPercentage.value / 100
    return circumference * (1 - progress)
})

// Count-up animation on mount
onMounted(() => {
    const duration = 1200
    const startTime = performance.now()
    const targetPct = props.percentage
    const targetCorrect = props.score

    function animate(now: number) {
        const elapsed = now - startTime
        const t = Math.min(elapsed / duration, 1)
        // ease-out cubic
        const eased = 1 - Math.pow(1 - t, 3)

        displayPercentage.value = Math.round(eased * targetPct)
        displayCorrect.value = Math.round(eased * targetCorrect)

        if (t < 1) {
            requestAnimationFrame(animate)
        } else {
            displayPercentage.value = targetPct
            displayCorrect.value = targetCorrect
        }
    }

    requestAnimationFrame(animate)
})
</script>

<style scoped>
@keyframes celebrate-bounce {

    0%,
    100% {
        transform: scale(1);
    }

    20% {
        transform: scale(1.05);
    }

    40% {
        transform: scale(0.97);
    }

    60% {
        transform: scale(1.03);
    }

    80% {
        transform: scale(0.99);
    }
}

.animate-celebrate {
    animation: celebrate-bounce 0.8s ease-out 1.2s both;
}
</style>
