/**
 * sync-resources.mjs
 * Scans public/resources/ and writes public/resources-manifest.json
 * so the client can browse files without server-side logic.
 */

import { readdirSync, statSync, writeFileSync, existsSync } from 'fs'
import { join, relative, extname } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const resourcesDir = join(__dirname, '..', 'public', 'resources')
const manifestPath = join(__dirname, '..', 'public', 'resources-manifest.json')

function scanDir(dir, baseDir) {
    if (!existsSync(dir)) return []

    const entries = readdirSync(dir, { withFileTypes: true })
    const result = []

    for (const entry of entries) {
        if (entry.name.startsWith('.')) continue // skip hidden files like .gitkeep

        const fullPath = join(dir, entry.name)
        const relPath = relative(baseDir, fullPath).replace(/\\/g, '/')

        if (entry.isDirectory()) {
            result.push({
                type: 'folder',
                name: entry.name,
                path: relPath,
                children: scanDir(fullPath, baseDir),
            })
        } else {
            const ext = extname(entry.name).toLowerCase().slice(1)
            result.push({
                type: 'file',
                name: entry.name,
                path: relPath,
                ext,
            })
        }
    }

    // Folders first, then files, both alphabetically
    result.sort((a, b) => {
        if (a.type !== b.type) return a.type === 'folder' ? -1 : 1
        return a.name.localeCompare(b.name)
    })

    return result
}

const manifest = scanDir(resourcesDir, resourcesDir)
writeFileSync(manifestPath, JSON.stringify(manifest, null, 2))
console.log(`[sync-resources] Wrote resources-manifest.json (${manifest.length} top-level entries)`)
