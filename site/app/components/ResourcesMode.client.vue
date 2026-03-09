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

const { data: manifest } = await useFetch<Entry[]>('/resources-manifest.json', { cache: 'no-cache' })
const tree = computed(() => manifest.value ?? [])

// Track which folders are expanded (expanded by default at top level)
const expanded = ref<Set<string>>(new Set())

function toggleFolder(path: string) {
    if (expanded.value.has(path)) {
        expanded.value.delete(path)
    } else {
        expanded.value.add(path)
    }
}

function fileIcon(ext: string): string {
    const map: Record<string, string> = {
        pdf: 'i-heroicons-document-text',
        doc: 'i-heroicons-document',
        docx: 'i-heroicons-document',
        ppt: 'i-heroicons-presentation-chart-bar',
        pptx: 'i-heroicons-presentation-chart-bar',
        xls: 'i-heroicons-table-cells',
        xlsx: 'i-heroicons-table-cells',
        txt: 'i-heroicons-document',
        md: 'i-heroicons-document',
        png: 'i-heroicons-photo',
        jpg: 'i-heroicons-photo',
        jpeg: 'i-heroicons-photo',
        gif: 'i-heroicons-photo',
        svg: 'i-heroicons-photo',
        zip: 'i-heroicons-archive-box',
        gz: 'i-heroicons-archive-box',
        mp4: 'i-heroicons-film',
        mp3: 'i-heroicons-musical-note',
    }
    return map[ext] ?? 'i-heroicons-paper-clip'
}

function fileColor(ext: string): string {
    if (ext === 'pdf') return 'text-red-500'
    if (['doc', 'docx'].includes(ext)) return 'text-blue-500'
    if (['ppt', 'pptx'].includes(ext)) return 'text-orange-500'
    if (['xls', 'xlsx'].includes(ext)) return 'text-green-600'
    if (['png', 'jpg', 'jpeg', 'gif', 'svg'].includes(ext)) return 'text-purple-500'
    if (['zip', 'gz'].includes(ext)) return 'text-yellow-600'
    return 'text-muted'
}

// On mount, expand all top-level folders
onMounted(() => {
    if (!manifest.value) return
    for (const entry of manifest.value) {
        if (entry.type === 'folder') expanded.value.add(entry.path)
    }
})
</script>

<template>
    <div class="h-full overflow-y-auto">
        <div class="mx-auto max-w-3xl px-4 py-6">
            <!-- Header -->
            <div class="mb-6">
                <h1 class="text-2xl font-bold text-highlighted">Resources</h1>
                <p class="mt-1 text-sm text-muted">
                    Study materials, past exams, and other files shared for CNT 4419.
                    Place files in <code
                        class="rounded bg-elevated px-1 py-0.5 text-xs font-mono">public/resources/</code> to have them
                    appear here (you can PR this btw!).
                </p>
            </div>

            <!-- Empty state -->
            <div v-if="tree.length === 0"
                class="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-default py-16 text-center">
                <UIcon name="i-heroicons-folder-open" class="text-4xl text-muted" />
                <div>
                    <p class="font-medium text-highlighted">No resources yet</p>
                    <p class="mt-1 text-sm text-muted">
                        Add PDFs or folders to <code class="font-mono text-xs">public/resources/</code> and rebuild.
                    </p>
                </div>
            </div>

            <!-- File tree -->
            <div v-else class="rounded-xl border border-default bg-default overflow-hidden">
                <ResourcesTree :entries="tree" :expanded="expanded" :depth="0" @toggle="toggleFolder"
                    :file-icon="fileIcon" :file-color="fileColor" />
            </div>
        </div>
    </div>
</template>
