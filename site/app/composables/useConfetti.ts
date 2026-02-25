/**
 * Composable for triggering a confetti celebration overlay.
 * Used when the user achieves a high score on quizzes or flashcards.
 */
export function useConfetti() {
    const isActive = useState<boolean>('confetti-active', () => false)
    const seed = useState<number>('confetti-seed', () => 0)

    function trigger(duration = 1800) {
        const nonce = Date.now()
        seed.value = nonce
        isActive.value = true
        setTimeout(() => {
            if (seed.value === nonce) {
                isActive.value = false
            }
        }, duration)
    }

    return { isActive, seed, trigger }
}
