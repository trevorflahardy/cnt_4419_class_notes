/**
 * local-pipeline.mjs — Dev-time orchestrator for the transcription pipeline.
 *
 * Run automatically via `bun run dev` (or `bun run build`) in site/.
 * Only runs expensive steps when something has actually changed.
 *
 *   1. Transcribe: python3 transcribe.py  (skipped if no new recordings, or Python/Whisper unavailable)
 *   2. Merge:      node merge-transcripts.mjs  (skipped if no pending dates)
 *   3. Announce:   node extract-announcements.mjs  (always fast, always runs)
 *   4. Embed:      node extract-and-embed.mjs  (only if new transcripts were merged this run)
 *
 * All steps are non-blocking — a failure in one step is logged as a warning and
 * the rest of the pipeline continues so `nuxt dev` still starts.
 */

import { execSync, spawnSync } from "child_process";
import { existsSync, readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const RECORDINGS_ROOT = join(ROOT, "recordings");
const RAW_ROOT = join(ROOT, "transcripts", ".raw");
const TRANSCRIPTS_ROOT = join(ROOT, "transcripts");

const SUPPORTED_EXTENSIONS = new Set([".m4a", ".mp3", ".wav", ".ogg"]);

function log(msg) {
  console.log(`[pipeline] ${msg}`);
}
function warn(msg) {
  console.warn(`[pipeline] ⚠  ${msg}`);
}

/** Find date dirs under recordings/ that have audio files with no raw transcript yet. */
function findNewRecordings() {
  if (!existsSync(RECORDINGS_ROOT)) return [];

  return readdirSync(RECORDINGS_ROOT, { withFileTypes: true })
    .filter(
      (d) =>
        d.isDirectory() &&
        /^\d{4}-\d{2}-\d{2}$/.test(d.name)
    )
    .filter((d) => {
      const dateDir = join(RECORDINGS_ROOT, d.name);
      const rawDir = join(RAW_ROOT, d.name);

      const audioFiles = readdirSync(dateDir).filter((f) =>
        SUPPORTED_EXTENSIONS.has(f.slice(f.lastIndexOf(".")))
      );
      if (audioFiles.length === 0) return false;

      // Needs transcription if any audio file lacks a corresponding raw JSON
      return audioFiles.some((f) => {
        const stem = f.slice(0, f.lastIndexOf("."));
        return !existsSync(join(rawDir, `${stem}.json`));
      });
    })
    .map((d) => d.name);
}

/** Find dates that have raw JSONs but no merged transcript yet. */
function findUnmergedDates() {
  if (!existsSync(RAW_ROOT)) return [];

  return readdirSync(RAW_ROOT, { withFileTypes: true })
    .filter((d) => d.isDirectory() && /^\d{4}-\d{2}-\d{2}$/.test(d.name))
    .filter((d) => {
      const hasRaw = readdirSync(join(RAW_ROOT, d.name)).some((f) =>
        f.endsWith(".json")
      );
      const hasMerged = existsSync(join(TRANSCRIPTS_ROOT, `${d.name}.json`));
      return hasRaw && !hasMerged;
    })
    .map((d) => d.name);
}

/** Run a command, return true on success. */
function run(label, cmd, args, options = {}) {
  log(`Running: ${label}...`);
  const result = spawnSync(cmd, args, {
    cwd: __dirname,
    stdio: "inherit",
    env: { ...process.env },
    ...options,
  });
  if (result.error || result.status !== 0) {
    warn(`${label} failed (exit ${result.status ?? "error"}) — continuing anyway.`);
    if (result.error) warn(result.error.message);
    return false;
  }
  return true;
}

/** Check if python + whisper are available. */
function checkPython() {
  const result = spawnSync("python", ["-c", "import whisper"], {
    stdio: "pipe",
  });
  return result.status === 0;
}

async function main() {
  log("Checking for new recordings...");

  // ── Step 1: Transcribe ──────────────────────────────────────────────────
  const newRecordings = findNewRecordings();
  if (newRecordings.length > 0) {
    log(`Found untranscribed recordings for: ${newRecordings.join(", ")}`);

    if (checkPython()) {
      run("Whisper transcription", "python", ["transcribe.py"], {
        cwd: __dirname,
      });
    } else {
      warn(
        "Python/Whisper not installed — skipping transcription.\n" +
        "         To enable: pip install -r scripts/requirements-transcribe.txt"
      );
    }
  } else {
    log("No new recordings to transcribe.");
  }

  // ── Step 2: Merge ───────────────────────────────────────────────────────
  const unmerged = findUnmergedDates();
  let newTranscriptsAdded = false;

  if (unmerged.length > 0) {
    log(`Found unmerged raw transcripts for: ${unmerged.join(", ")}`);

    // Warn if multi-recording dates need the API key
    const multiDates = unmerged.filter((date) => {
      const rawDir = join(RAW_ROOT, date);
      const jsonCount = readdirSync(rawDir).filter((f) => f.endsWith(".json")).length;
      return jsonCount > 1;
    });

    if (multiDates.length > 0 && !process.env.ANTHROPIC_API_KEY) {
      warn(
        `Dates ${multiDates.join(", ")} have multiple recordings and need ANTHROPIC_API_KEY to merge.\n` +
        "         Run: ANTHROPIC_API_KEY=<key> bun run dev"
      );
    }

    newTranscriptsAdded = run("Merge transcripts", "node", ["merge-transcripts.mjs"]);
  } else {
    log("No unmerged transcripts.");
  }

  // ── Step 3: Announcements (always fast) ────────────────────────────────
  run("Extract announcements", "node", ["extract-announcements.mjs"]);

  // ── Step 4: Re-embed (only if new transcripts were just merged) ─────────
  if (newTranscriptsAdded) {
    log("New transcripts detected — regenerating embeddings (this may take a moment)...");
    run("Generate embeddings", "node", ["extract-and-embed.mjs"]);
  } else {
    log("No new transcripts — skipping embedding step.");
  }

  log("Pipeline done.");
}

main().catch((err) => {
  warn(`Unexpected error: ${err.message}`);
  // Never exit non-zero — nuxt dev should still start
});
