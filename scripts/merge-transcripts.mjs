/**
 * merge-transcripts.mjs — Merge raw per-recording transcripts into one canonical
 * transcript file per date.
 *
 * For each date that has a directory under transcripts/.raw/YYYY-MM-DD/ but lacks
 * a final transcripts/YYYY-MM-DD.json:
 *   - Single recording → promote directly (no API call)
 *   - Multiple recordings → call Claude to deduplicate/merge into one canonical text,
 *     then reconstruct segments by substring matching
 *
 * Output shape (transcripts/YYYY-MM-DD.json):
 * {
 *   "date": "2026-01-15",
 *   "recordings": ["recording_1.m4a", "recording_2.m4a"],
 *   "transcript": "Full merged text...",
 *   "segments": [
 *     { "start": 0.0, "end": 5.2, "text": "...", "source_recording": "recording_1.m4a" }
 *   ],
 *   "merged_at": "2026-01-15T18:30:00Z"
 * }
 */

import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import Anthropic from "@anthropic-ai/sdk";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const RAW_ROOT = join(ROOT, "transcripts", ".raw");
const TRANSCRIPTS_ROOT = join(ROOT, "transcripts");

const MODEL = "claude-haiku-4-5-20251001";

/** Find dates that have raw JSON files but no merged output yet. */
function findPendingDates() {
  if (!existsSync(RAW_ROOT)) return [];

  return readdirSync(RAW_ROOT, { withFileTypes: true })
    .filter((d) => d.isDirectory() && /^\d{4}-\d{2}-\d{2}$/.test(d.name))
    .map((d) => d.name)
    .filter((date) => {
      const merged = join(TRANSCRIPTS_ROOT, `${date}.json`);
      return !existsSync(merged);
    })
    .sort();
}

/** Load all raw recording JSONs for a date. */
function loadRawRecordings(date) {
  const rawDir = join(RAW_ROOT, date);
  return readdirSync(rawDir)
    .filter((f) => f.endsWith(".json"))
    .sort()
    .map((f) => JSON.parse(readFileSync(join(rawDir, f), "utf8")));
}

/**
 * Annotate each segment with its source_recording field, then flatten all
 * segments from all recordings into one array ordered by start time.
 */
function flattenSegments(recordings) {
  return recordings
    .flatMap((r) =>
      r.segments.map((s) => ({ ...s, source_recording: r.source_recording }))
    )
    .sort((a, b) => a.start - b.start);
}

/**
 * Merge multiple transcript texts via Claude.
 * Returns the merged canonical transcript string.
 */
async function mergeWithClaude(client, date, recordings) {
  const numbered = recordings
    .map(
      (r, i) =>
        `--- Recording ${i + 1}: ${r.source_recording} ---\n${r.full_text}`
    )
    .join("\n\n");

  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: `You are merging ${recordings.length} audio transcripts from the same class session on ${date} into one clean, canonical transcript.

The transcripts may overlap, repeat content, or have gaps. Your job is to:
1. Remove duplicate sentences or near-duplicate content (keep the clearest version)
2. Merge overlapping sections smoothly
3. Preserve all unique educational content (definitions, examples, announcements, dates, deadlines)
4. Maintain chronological order
5. Return ONLY the merged transcript text with no preamble, explanation, or metadata

Transcripts to merge:

${numbered}

Merged transcript:`,
      },
    ],
  });

  const content = message.content[0];
  if (content.type !== "text") {
    throw new Error("Unexpected response type from Claude");
  }
  return content.text.trim();
}

/**
 * After merging, try to map the merged text back to original segments so we
 * preserve timing data. Segments whose text appears verbatim (or near-verbatim)
 * in the merged output are kept; orphaned segments are dropped.
 */
function reconcileSegments(mergedText, allSegments) {
  const lowerMerged = mergedText.toLowerCase();
  return allSegments.filter((seg) => {
    const needle = seg.text.trim().toLowerCase();
    if (needle.length < 10) return false; // skip very short fragments
    return lowerMerged.includes(needle);
  });
}

async function main() {
  const pending = findPendingDates();
  if (pending.length === 0) {
    console.log("No pending dates to merge. All up to date.");
    return;
  }

  console.log(`Found ${pending.length} date(s) to process: ${pending.join(", ")}`);

  // Only initialize Anthropic client if we actually need it (multi-recording dates)
  let client = null;

  mkdirSync(TRANSCRIPTS_ROOT, { recursive: true });

  for (const date of pending) {
    console.log(`\nMerging ${date}...`);
    const recordings = loadRawRecordings(date);

    if (recordings.length === 0) {
      console.log(`  No valid recordings found for ${date}, skipping.`);
      continue;
    }

    let transcript;
    let segments;

    if (recordings.length === 1) {
      // Single recording — promote directly
      console.log(`  Single recording — promoting directly.`);
      const r = recordings[0];
      transcript = r.full_text;
      segments = r.segments.map((s) => ({
        ...s,
        source_recording: r.source_recording,
      }));
    } else {
      // Multiple recordings — merge via Claude
      console.log(`  ${recordings.length} recordings — merging via Claude...`);
      if (!client) {
        const apiKey = process.env.ANTHROPIC_API_KEY;
        if (!apiKey) {
          throw new Error("ANTHROPIC_API_KEY environment variable is required for multi-recording merges.");
        }
        client = new Anthropic({ apiKey });
      }

      transcript = await mergeWithClaude(client, date, recordings);
      const allSegments = flattenSegments(recordings);
      segments = reconcileSegments(transcript, allSegments);
      console.log(`  Merged transcript: ${transcript.length} chars, ${segments.length} segments retained.`);
    }

    const output = {
      date,
      recordings: recordings.map((r) => r.source_recording),
      transcript,
      segments,
      merged_at: new Date().toISOString(),
    };

    const outPath = join(TRANSCRIPTS_ROOT, `${date}.json`);
    writeFileSync(outPath, JSON.stringify(output, null, 2));
    console.log(`  Wrote ${outPath}`);
  }

  console.log("\n✅ Merge complete.");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
