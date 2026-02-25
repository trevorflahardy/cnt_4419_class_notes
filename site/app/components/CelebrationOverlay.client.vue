<template>
    <div v-if="isActive" :key="seed" class="pointer-events-none fixed inset-0 z-120 overflow-hidden">
        <div v-for="piece in pieces" :key="piece.id" class="confetti-piece" :style="piece.style" />
    </div>
</template>

<script setup lang="ts">
const { isActive, seed } = useConfetti()

const pieces = computed(() => {
    const colors = ['#7C3AED', '#6366F1', '#38BDF8', '#F59E0B', '#F43F5E']
    return Array.from({ length: 64 }).map((_, index) => {
        const left = Math.random() * 100
        const delay = Math.random() * 0.8
        const duration = 1.8 + Math.random() * 1.8
        const size = 5 + Math.random() * 8
        const color = colors[index % colors.length]

        return {
            id: `${seed.value}-${index}`,
            style: {
                left: `${left}%`,
                top: '-12px',
                width: `${size}px`,
                height: `${size}px`,
                backgroundColor: color,
                borderRadius: Math.random() > 0.5 ? '9999px' : '2px',
                animation: `confetti-fall ${duration}s ease-in ${delay}s both`,
            },
        }
    })
})
</script>

<style scoped>
.confetti-piece {
    position: absolute;
}

@keyframes confetti-fall {
    0% {
        opacity: 1;
        transform: translateY(0) rotate(0deg);
    }

    100% {
        opacity: 0;
        transform: translateY(100vh) rotate(720deg);
    }
}
</style>
