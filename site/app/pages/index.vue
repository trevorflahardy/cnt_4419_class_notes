<script setup lang="ts">
type View = 'notes' | 'quiz' | 'flashcards' | 'chat' | 'announcements' | 'transcripts' | 'resources'

const activeView = ref<View>('notes')
const chatPanelWidth = ref(420)
const isResizing = ref(false)
const mobileMenuOpen = ref(false)
const sidebarVisible = ref(true)

const views: { key: View; label: string; icon: string }[] = [
    { key: 'notes', label: 'Notes', icon: 'i-heroicons-document-text' },
    { key: 'quiz', label: 'Quiz', icon: 'i-heroicons-academic-cap' },
    { key: 'flashcards', label: 'Flashcards', icon: 'i-heroicons-rectangle-stack' },
    { key: 'chat', label: 'Chat', icon: 'i-heroicons-chat-bubble-left-right' },
    { key: 'announcements', label: 'Professor Says', icon: 'i-heroicons-megaphone' },
    { key: 'transcripts', label: 'Transcripts', icon: 'i-heroicons-microphone' },
    { key: 'resources', label: 'Resources', icon: 'i-heroicons-folder-open' },
]

// Primary tabs shown in bottom bar (icons only on mobile)
const primaryViews = views.slice(0, 4)
// Overflow tabs shown in hamburger drawer
const overflowViews = views.slice(4)

function setView(view: View) {
    activeView.value = view
    mobileMenuOpen.value = false
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
                <!-- Hamburger: mobile only -->
                <UButton class="md:hidden" :icon="mobileMenuOpen ? 'i-heroicons-x-mark' : 'i-heroicons-bars-3'"
                    variant="ghost" color="neutral" size="sm" aria-label="Open menu"
                    @click="mobileMenuOpen = !mobileMenuOpen" />
            </div>
        </header>

        <!-- ===== Main Content ===== -->
        <main class="relative flex-1 overflow-hidden">
            <!-- Desktop split layout (notes + chat side-by-side) -->
            <div v-show="activeView === 'notes'" class="relative flex h-full">
                <!-- Chat sidebar - left side, desktop only -->
                <div v-show="sidebarVisible" class="hidden h-full shrink-0 relative lg:block" :style="{ width: `${chatPanelWidth}px` }">
                    <!-- Close sidebar button -->
                    <UButton
                        icon="i-heroicons-x-mark"
                        variant="ghost"
                        color="neutral"
                        size="xs"
                        class="absolute top-2 right-2 z-20"
                        aria-label="Close chat panel"
                        @click="sidebarVisible = false"
                    />
                    <ClientOnly>
                        <ChatSidebar />
                    </ClientOnly>
                </div>

                <!-- Drag handle (hidden when sidebar closed) -->
                <div v-show="sidebarVisible" class="hidden lg:block h-full w-1.5 cursor-col-resize border-x border-default bg-elevated/70 hover:bg-elevated transition-colors"
                    :class="isResizing ? 'bg-primary-500/20 border-primary-500' : ''" @mousedown="startResize"
                    aria-label="Resize chat panel" />

                <!-- Re-open chat tab (desktop, shown when sidebar is hidden) -->
                <button
                    v-if="!sidebarVisible"
                    class="absolute left-0 top-1/2 -translate-y-1/2 z-10 hidden lg:flex items-center justify-center w-6 h-14 bg-elevated/90 hover:bg-elevated border border-l-0 border-default rounded-r-lg shadow-sm transition-colors"
                    aria-label="Open chat panel"
                    @click="sidebarVisible = true"
                >
                    <UIcon name="i-heroicons-chat-bubble-left-right" class="h-3.5 w-3.5 text-muted" />
                </button>

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

            <!-- Professor Says -->
            <Transition name="fade" mode="out-in">
                <div v-if="activeView === 'announcements'" class="h-full overflow-y-auto">
                    <ClientOnly>
                        <AnnouncementsMode />
                        <template #fallback>
                            <div class="flex h-full items-center justify-center">
                                <UIcon name="i-heroicons-arrow-path" class="animate-spin text-2xl text-muted" />
                            </div>
                        </template>
                    </ClientOnly>
                </div>
            </Transition>

            <!-- Transcripts -->
            <Transition name="fade" mode="out-in">
                <div v-if="activeView === 'transcripts'" class="h-full overflow-hidden">
                    <ClientOnly>
                        <TranscriptsMode />
                        <template #fallback>
                            <div class="flex h-full items-center justify-center">
                                <UIcon name="i-heroicons-arrow-path" class="animate-spin text-2xl text-muted" />
                            </div>
                        </template>
                    </ClientOnly>
                </div>
            </Transition>

            <!-- Resources -->
            <Transition name="fade" mode="out-in">
                <div v-if="activeView === 'resources'" class="h-full overflow-hidden">
                    <ClientOnly>
                        <ResourcesMode />
                        <template #fallback>
                            <div class="flex h-full items-center justify-center">
                                <UIcon name="i-heroicons-arrow-path" class="animate-spin text-2xl text-muted" />
                            </div>
                        </template>
                    </ClientOnly>
                </div>
            </Transition>
        </main>

        <!-- ===== Mobile Slide-over Menu ===== -->
        <Transition name="drawer">
            <div v-if="mobileMenuOpen"
                class="fixed inset-0 z-50 md:hidden"
                @click.self="mobileMenuOpen = false">
                <!-- Backdrop -->
                <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="mobileMenuOpen = false" />
                <!-- Drawer panel -->
                <nav class="absolute bottom-0 left-0 right-0 rounded-t-2xl border-t border-default bg-default shadow-2xl pb-[env(safe-area-inset-bottom)]">
                    <div class="mx-auto mt-2 h-1 w-10 rounded-full bg-muted/30" />
                    <div class="px-4 py-4 space-y-1">
                        <button v-for="v in views" :key="v.key"
                            class="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors"
                            :class="activeView === v.key
                                ? 'bg-primary/10 text-primary'
                                : 'text-muted hover:bg-elevated hover:text-highlighted'"
                            @click="setView(v.key)">
                            <UIcon :name="v.icon" class="h-5 w-5 shrink-0" />
                            <span>{{ v.label }}</span>
                            <UIcon v-if="activeView === v.key" name="i-heroicons-check" class="ml-auto h-4 w-4 text-primary" />
                        </button>
                    </div>
                </nav>
            </div>
        </Transition>

        <!-- ===== Mobile Bottom Navigation (primary 4 tabs) ===== -->
        <nav
            class="flex items-center border-t border-default bg-default md:hidden pb-[env(safe-area-inset-bottom)]">
            <button v-for="v in primaryViews" :key="v.key"
                class="flex flex-1 flex-col items-center gap-0.5 px-1 py-2 text-[11px] transition-colors" :class="activeView === v.key
                    ? 'text-primary font-semibold'
                    : 'text-muted'"
                @click="setView(v.key)">
                <UIcon :name="v.icon" class="text-[22px]" />
                <span>{{ v.label }}</span>
            </button>
            <!-- More button -->
            <button
                class="flex flex-1 flex-col items-center gap-0.5 px-1 py-2 text-[11px] transition-colors"
                :class="overflowViews.some(v => v.key === activeView)
                    ? 'text-primary font-semibold'
                    : 'text-muted'"
                @click="mobileMenuOpen = true">
                <UIcon name="i-heroicons-ellipsis-horizontal" class="text-[22px]" />
                <span>More</span>
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

/* Drawer slide-up */
.drawer-enter-active { transition: opacity 0.2s ease; }
.drawer-leave-active { transition: opacity 0.2s ease; }
.drawer-enter-from { opacity: 0; }
.drawer-leave-to { opacity: 0; }

.drawer-enter-active .absolute.bottom-0,
.drawer-enter-active nav.absolute {
    transition: transform 0.25s cubic-bezier(0.32, 0.72, 0, 1);
}
.drawer-leave-active .absolute.bottom-0,
.drawer-leave-active nav.absolute {
    transition: transform 0.2s ease-in;
}
.drawer-enter-from nav.absolute { transform: translateY(100%); }
.drawer-leave-to nav.absolute { transform: translateY(100%); }
</style>
