/**
 * extract-announcements.mjs — Extract professor announcements from transcripts.
 *
 * Reads all transcripts/YYYY-MM-DD.json files (skipping .raw/), applies keyword
 * pattern matching to find mentions of exams, quizzes, and assignments, then
 * writes site/public/announcements.json sorted newest-first.
 *
 * Output shape (site/public/announcements.json):
 * {
 *   "generated_at": "2026-01-15T18:30:00Z",
 *   "announcements": [
 *     {
 *       "date": "2026-01-15",
 *       "type": "exam",
 *       "quote": "The midterm will cover chapters 1-5",
 *       "context": "...surrounding sentences...",
 *       "keywords": ["midterm", "chapters"]
 *     }
 *   ]
 * }
 */

import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const TRANSCRIPTS_ROOT = join(ROOT, "transcripts");
const OUTPUT_DIR = join(ROOT, "site", "public");
const OUTPUT_PATH = join(OUTPUT_DIR, "announcements.json");

const CONTEXT_WINDOW = 150; // chars before and after the match

/** Keyword patterns grouped by announcement type. */
const PATTERNS = {
  exam: [
    /\bmidterm\b/i,
    /\bfinal\s+exam\b/i,
    /\bfinal\b/i,
    /\bexam\b/i,
    /\btest\b/i,
    /\bpractical\b/i,
  ],
  quiz: [
    /\bpop\s+quiz\b/i,
    /\bquiz\b/i,
  ],
  assignment: [
    /\bassignment\b/i,
    /\bhomework\b/i,
    /\bdue\s+date\b/i,
    /\bdue\b/i,
    /\bproject\b/i,
    /\blab\b/i,
    /\bsubmit\b/i,
    /\bsubmission\b/i,
    /\bdeadline\b/i,
  ],
};

/** Map each pattern to its type for lookup. */
const PATTERN_TYPE_MAP = [];
for (const [type, patterns] of Object.entries(PATTERNS)) {
  for (const pattern of patterns) {
    PATTERN_TYPE_MAP.push({ type, pattern });
  }
}

/**
 * Extract the sentence (or sentence fragment) containing a match index
 * within the full text.
 */
function extractQuote(text, matchIndex, matchLength) {
  // Walk backwards to find the start of the sentence
  let start = matchIndex;
  while (start > 0 && !/[.!?\n]/.test(text[start - 1])) start--;

  // Walk forwards to find the end of the sentence
  let end = matchIndex + matchLength;
  while (end < text.length && !/[.!?\n]/.test(text[end])) end++;

  return text.slice(start, end + 1).trim().replace(/\s+/g, " ");
}

/**
 * Extract surrounding context (up to CONTEXT_WINDOW chars on each side).
 */
function extractContext(text, matchIndex, matchLength) {
  const contextStart = Math.max(0, matchIndex - CONTEXT_WINDOW);
  const contextEnd = Math.min(text.length, matchIndex + matchLength + CONTEXT_WINDOW);
  let context = text.slice(contextStart, contextEnd).trim().replace(/\s+/g, " ");
  if (contextStart > 0) context = "..." + context;
  if (contextEnd < text.length) context = context + "...";
  return context;
}

/**
 * Normalize a quote for deduplication: lowercase + strip punctuation.
 */
function normalizeForDedup(text) {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ").trim();
}

function processTranscript(date, transcriptText) {
  const announcements = [];
  const seenNormalized = new Set();

  for (const { type, pattern } of PATTERN_TYPE_MAP) {
    let match;
    const regex = new RegExp(pattern.source, pattern.flags.includes("g") ? pattern.flags : pattern.flags + "g");

    while ((match = regex.exec(transcriptText)) !== null) {
      const quote = extractQuote(transcriptText, match.index, match[0].length);
      const normalized = normalizeForDedup(quote);

      if (seenNormalized.has(normalized)) continue;
      seenNormalized.add(normalized);

      const context = extractContext(transcriptText, match.index, match[0].length);

      // Collect all keywords that match within this quote
      const matchedKeywords = [];
      for (const { pattern: kp } of PATTERN_TYPE_MAP) {
        const kMatch = new RegExp(kp.source, "i").exec(quote);
        if (kMatch) matchedKeywords.push(kMatch[0].toLowerCase());
      }

      announcements.push({
        date,
        type,
        quote,
        context,
        keywords: [...new Set(matchedKeywords)],
      });
    }
  }

  return announcements;
}

function main() {
  if (!existsSync(TRANSCRIPTS_ROOT)) {
    console.log("No transcripts/ directory found. Writing empty announcements.json.");
    mkdirSync(OUTPUT_DIR, { recursive: true });
    writeFileSync(
      OUTPUT_PATH,
      JSON.stringify({ generated_at: new Date().toISOString(), announcements: [] }, null, 2)
    );
    return;
  }

  // Find all YYYY-MM-DD.json files (not in .raw/)
  const transcriptFiles = readdirSync(TRANSCRIPTS_ROOT)
    .filter((f) => /^\d{4}-\d{2}-\d{2}\.json$/.test(f))
    .sort()
    .reverse(); // newest-first

  console.log(`Found ${transcriptFiles.length} transcript file(s).`);

  const allAnnouncements = [];
  const globalSeenNormalized = new Set();

  for (const file of transcriptFiles) {
    const date = file.replace(".json", "");
    const filePath = join(TRANSCRIPTS_ROOT, file);

    let data;
    try {
      data = JSON.parse(readFileSync(filePath, "utf8"));
    } catch (err) {
      console.warn(`  Warning: could not parse ${file}: ${err.message}`);
      continue;
    }

    const text = data.transcript || "";
    if (!text.trim()) {
      console.log(`  ${date}: empty transcript, skipping.`);
      continue;
    }

    const found = processTranscript(date, text);

    // Cross-file deduplication
    for (const ann of found) {
      const norm = normalizeForDedup(ann.quote);
      if (!globalSeenNormalized.has(norm)) {
        globalSeenNormalized.add(norm);
        allAnnouncements.push(ann);
      }
    }

    console.log(`  ${date}: ${found.length} announcement(s) found.`);
  }

  // Sort newest-first by date
  allAnnouncements.sort((a, b) => b.date.localeCompare(a.date));

  const output = {
    generated_at: new Date().toISOString(),
    announcements: allAnnouncements,
  };

  mkdirSync(OUTPUT_DIR, { recursive: true });
  writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2));
  console.log(`\n✅ Wrote ${allAnnouncements.length} announcement(s) to ${OUTPUT_PATH}`);
}

main();
