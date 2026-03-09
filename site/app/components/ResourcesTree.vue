<script setup lang="ts">
interface FileEntry {
    type: 'file'
    name: string
    path: string
    ext: string
}

interface FolderEntry {
    type: 'folder'
    name: string
    path: string
    children: Entry[]
}

type Entry = FileEntry | FolderEntry

const props = defineProps<{
    entries: Entry[]
    expanded: Set<string>
    depth: number
    fileIcon: (ext: string) => string
    fileColor: (ext: string) => string
}>()

const emit = defineEmits<{
    toggle: [path: string]
}>()

const indent = computed(() => props.depth * 20)

// Base URL for static resources
const base = useRuntimeConfig().app.baseURL.replace(/\/$/, '')

function resourceUrl(path: string) {
    return `${base}/resources/${path}`
}
</script>

<template>
    <div>
        <template v-for="entry in entries" :key="entry.path">
            <!-- Folder row -->
            <div v-if="entry.type === 'folder'">
                <button
                    class="flex w-full items-center gap-2 border-b border-default px-4 py-2.5 text-sm font-medium text-highlighted transition-colors hover:bg-elevated"
                    :style="{ paddingLeft: `${16 + indent}px` }"
                    @click="emit('toggle', entry.path)">
                    <UIcon
                        :name="expanded.has(entry.path) ? 'i-heroicons-folder-open' : 'i-heroicons-folder'"
                        class="shrink-0 text-base text-primary" />
                    <span class="flex-1 text-left">{{ entry.name }}</span>
                    <UIcon
                        :name="expanded.has(entry.path) ? 'i-heroicons-chevron-down' : 'i-heroicons-chevron-right'"
                        class="shrink-0 text-xs text-muted" />
                </button>
                <!-- Nested children -->
                <Transition name="folder">
                    <div v-if="expanded.has(entry.path)" class="bg-elevated/30">
                        <ResourcesTree
                            :entries="(entry as FolderEntry).children"
                            :expanded="expanded"
                            :depth="depth + 1"
                            :file-icon="fileIcon"
                            :file-color="fileColor"
                            @toggle="emit('toggle', $event)" />
                        <!-- Empty folder -->
                        <div v-if="(entry as FolderEntry).children.length === 0"
                            class="border-b border-default py-2 text-center text-xs text-muted"
                            :style="{ paddingLeft: `${16 + indent + 20}px` }">
                            Empty folder
                        </div>
                    </div>
                </Transition>
            </div>

            <!-- File row -->
            <a v-else
                :href="resourceUrl(entry.path)"
                target="_blank"
                rel="noopener noreferrer"
                class="flex items-center gap-2 border-b border-default px-4 py-2.5 text-sm text-highlighted transition-colors hover:bg-elevated last:border-b-0"
                :style="{ paddingLeft: `${16 + indent}px` }">
                <UIcon :name="fileIcon((entry as FileEntry).ext)"
                    class="shrink-0 text-base"
                    :class="fileColor((entry as FileEntry).ext)" />
                <span class="flex-1 truncate">{{ entry.name }}</span>
                <UBadge v-if="(entry as FileEntry).ext"
                    :label="(entry as FileEntry).ext.toUpperCase()"
                    color="neutral" variant="subtle" size="xs" />
                <UIcon name="i-heroicons-arrow-top-right-on-square" class="shrink-0 text-xs text-muted" />
            </a>
        </template>
    </div>
</template>

<style scoped>
.folder-enter-active,
.folder-leave-active {
    transition: opacity 0.15s ease, transform 0.15s ease;
    overflow: hidden;
}
.folder-enter-from,
.folder-leave-to {
    opacity: 0;
    transform: translateY(-4px);
}
</style>
