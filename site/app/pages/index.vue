<script setup lang="ts">
type View = 'notes' | 'quiz' | 'flashcards' | 'chat'

const activeView = ref<View>('notes')
const chatPanelWidth = ref(420)
const isResizing = ref(false)

const views: { key: View; label: string; icon: string }[] = [
    { key: 'notes', label: 'Notes', icon: 'i-heroicons-document-text' },
    { key: 'quiz', label: 'Quiz', icon: 'i-heroicons-academic-cap' },
    { key: 'flashcards', label: 'Flashcards', icon: 'i-heroicons-rectangle-stack' },
    { key: 'chat', label: 'Chat', icon: 'i-heroicons-chat-bubble-left-right' },
]

function setView(view: View) {
    activeView.value = view
}

function startResize(event: MouseEvent) {
    if (!import.meta.client) return
    event.preventDefault()
    isResizing.value = true
}

function onMouseMove(event: MouseEvent) {
    if (!isResizing.value || !import.meta.client) return
    const min = 300
    const max = Math.min(760, window.innerWidth - 380)
    chatPanelWidth.value = Math.max(min, Math.min(max, event.clientX))
}

function stopResize() {
    isResizing.value = false
}

if (import.meta.client) {
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', stopResize)
}

onBeforeUnmount(() => {
    if (!import.meta.client) return
    window.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('mouseup', stopResize)
})

const currentViewIcon = computed(() => {
    const next = views.find((v) => v.key !== activeView.value)
    return next?.icon ?? 'i-heroicons-squares-2x2'
})
</script>

<template>
    <div class="flex h-screen flex-col overflow-hidden bg-default">
        <ClientOnly>
            <CelebrationOverlay />
        </ClientOnly>

        <!-- ===== Top Header Bar ===== -->
        <header class="flex items-center justify-between border-b border-default bg-default/90 px-4 py-2 backdrop-blur">
            <!-- Left: branding -->
            <div class="flex items-center gap-2">
                <UBadge color="primary" variant="subtle" size="sm">CNT 4419</UBadge>
                <span class="text-lg font-semibold tracking-tight text-highlighted">
                    Study Hub
                </span>
            </div>

            <!-- Center: desktop nav tabs -->
            <nav class="hidden gap-1 md:flex">
                <UButton v-for="v in views" :key="v.key" :icon="v.icon" :label="v.label"
                    :variant="activeView === v.key ? 'soft' : 'ghost'"
                    :color="activeView === v.key ? 'primary' : 'neutral'" size="sm" @click="setView(v.key)" />
            </nav>

            <!-- Right: utilities -->
            <div class="flex items-center gap-1">
                <UButton icon="i-simple-icons-github" variant="ghost" color="neutral" size="sm"
                    to="https://github.com/trevorflahardy/cnt_4419_class_notes" target="_blank"
                    aria-label="GitHub repository" />
            </div>
        </header>

        <!-- ===== Main Content ===== -->
        <main class="relative flex-1 overflow-hidden">
            <!-- Desktop split layout (notes + chat side-by-side) -->
            <div v-show="activeView === 'notes'" class="flex h-full">
                <!-- Chat sidebar - left side, desktop only -->
                <div class="hidden h-full shrink-0 lg:block" :style="{ width: `${chatPanelWidth}px` }">
                    <ClientOnly>
                        <ChatSidebar />
                    </ClientOnly>
                </div>

                <!-- Drag handle -->
                <div class="hidden lg:block h-full w-1.5 cursor-col-resize border-x border-default bg-elevated/70 hover:bg-elevated transition-colors"
                    :class="isResizing ? 'bg-primary-500/20 border-primary-500' : ''" @mousedown="startResize"
                    aria-label="Resize chat panel" />

                <!-- PDF Viewer -->
                <div class="h-full w-full min-w-0 flex-1">
                    <ClientOnly>
                        <PdfViewer />
                        <template #fallback>
                            <div class="flex h-full items-center justify-center">
                                <UIcon name="i-heroicons-arrow-path" class="animate-spin text-2xl text-muted" />
                            </div>
                        </template>
                    </ClientOnly>
                </div>
            </div>

            <!-- Quiz Mode -->
            <Transition name="fade" mode="out-in">
                <div v-if="activeView === 'quiz'" class="h-full overflow-y-auto">
                    <ClientOnly>
                        <QuizMode />
                        <template #fallback>
                            <div class="flex h-full items-center justify-center">
                                <UIcon name="i-heroicons-arrow-path" class="animate-spin text-2xl text-muted" />
                            </div>
                        </template>
                    </ClientOnly>
                </div>
            </Transition>

            <Transition name="fade" mode="out-in">
                <div v-if="activeView === 'flashcards'" class="h-full overflow-y-auto">
                    <ClientOnly>
                        <FlashcardsMode />
                    </ClientOnly>
                </div>
            </Transition>

            <!-- Chat (mobile full-screen) -->
            <Transition name="fade" mode="out-in">
                <div v-if="activeView === 'chat'" class="h-full">
                    <ClientOnly>
                        <ChatSidebar />
                    </ClientOnly>
                </div>
            </Transition>
        </main>

        <!-- ===== Mobile Bottom Navigation ===== -->
        <nav class="flex items-center justify-around border-t border-default bg-default px-2 py-1.5 md:hidden">
            <button v-for="v in views" :key="v.key"
                class="flex flex-1 flex-col items-center gap-0.5 rounded-lg py-1 text-xs transition-colors" :class="activeView === v.key
                    ? 'text-primary font-semibold'
                    : 'text-muted'
                    " @click="setView(v.key)">
                <UIcon :name="v.icon" class="text-xl" />
                <span>{{ v.label }}</span>
            </button>
        </nav>
    </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.15s ease, transform 0.15s ease;
}

.fade-enter-from {
    opacity: 0;
    transform: translateY(4px);
}

.fade-leave-to {
    opacity: 0;
    transform: translateY(-4px);
}
</style>
