/**
 * agent-notes-clarifier.mjs — Local Claude agent for identifying gaps between
 * typed class notes and verbal lecture content.
 *
 * Usage:
 *   ANTHROPIC_API_KEY=<key> node scripts/agent-notes-clarifier.mjs
 *
 * For each "thin" section in cnt_4419_typed_notes.typ (< 200 words), the agent
 * compares the typed notes to matched transcript segments and reports:
 *   - missing_concept: something discussed verbally but not in notes
 *   - clarification: verbal elaboration that would improve a thin note
 *   - contradiction: discrepancy between typed and verbal content
 *
 * Output:
 *   agent-output/notes-clarifications-YYYY-MM-DD.json  — structured findings
 *   agent-output/notes-clarifications-YYYY-MM-DD.md    — human-readable summary
 */

import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import Anthropic from "@anthropic-ai/sdk";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const NOTES_PATH = join(ROOT, "cnt_4419_typed_notes.typ");
const TRANSCRIPTS_ROOT = join(ROOT, "transcripts");
const OUTPUT_DIR = join(ROOT, "agent-output");

const MODEL = "claude-sonnet-4-6";
const MIN_WORDS_FOR_THIN = 200;
const MAX_SECTIONS_PER_RUN = 20; // guard against token costs

/** Parse Typst file into sections by = and == headings. */
function parseSections(typContent) {
  const sections = [];
  const lines = typContent.split("\n");
  let currentHeading = null;
  let currentLevel = 0;
  let buffer = [];

  for (const line of lines) {
    const h1 = line.match(/^=\s+(.+)$/);
    const h2 = line.match(/^==\s+(.+)$/);

    if (h1 || h2) {
      if (currentHeading && buffer.length > 0) {
        sections.push({
          heading: currentHeading,
          level: currentLevel,
          text: buffer.join("\n").trim(),
        });
      }
      currentHeading = (h1 || h2)[1].trim();
      currentLevel = h1 ? 1 : 2;
      buffer = [];
    } else {
      buffer.push(line);
    }
  }

  if (currentHeading && buffer.length > 0) {
    sections.push({
      heading: currentHeading,
      level: currentLevel,
      text: buffer.join("\n").trim(),
    });
  }

  return sections;
}

function countWords(text) {
  return text.split(/\s+/).filter((w) => w.length > 0).length;
}

/** Load all transcripts newest-first. */
function loadTranscripts() {
  if (!existsSync(TRANSCRIPTS_ROOT)) return [];

  return readdirSync(TRANSCRIPTS_ROOT)
    .filter((f) => /^\d{4}-\d{2}-\d{2}\.json$/.test(f))
    .sort()
    .reverse()
    .map((f) => {
      try {
        return JSON.parse(readFileSync(join(TRANSCRIPTS_ROOT, f), "utf8"));
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

/** Find transcript segments that contain any keyword from the section heading/text. */
function findRelevantSegments(section, transcripts, maxChars = 3000) {
  const keywords = section.heading
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3);

  const relevant = [];
  let totalChars = 0;

  for (const transcript of transcripts) {
    for (const seg of transcript.segments || []) {
      const lower = (seg.text || "").toLowerCase();
      if (keywords.some((kw) => lower.includes(kw))) {
        const entry = `[${transcript.date}] ${seg.text}`;
        if (totalChars + entry.length > maxChars) break;
        relevant.push(entry);
        totalChars += entry.length;
      }
    }
    if (totalChars >= maxChars) break;
  }

  return relevant;
}

async function analyzeSection(client, section, transcriptSnippets) {
  const transcriptContext =
    transcriptSnippets.length > 0
      ? transcriptSnippets.join("\n")
      : "(No matching transcript segments found for this section.)";

  const prompt = `You are a teaching assistant reviewing class notes for CNT 4419 Secure Coding.

I will give you:
1. A section from the typed class notes (may be brief or incomplete)
2. Relevant excerpts from audio transcripts of lectures covering the same topic

Your job: identify discrepancies, gaps, or clarifications.

Return a JSON array (and ONLY the JSON array, no other text) where each element has:
{
  "type": "missing_concept" | "clarification" | "contradiction",
  "finding": "Brief description of the issue",
  "suggested_addition": "Specific text that could be added to the notes",
  "transcript_quote": "The exact transcript excerpt that supports this finding"
}

If there are no significant findings, return an empty array: []

--- TYPED NOTES SECTION: "${section.heading}" ---
${section.text.slice(0, 2000)}

--- RELEVANT TRANSCRIPT EXCERPTS ---
${transcriptContext}

JSON findings:`;

  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  });

  const content = message.content[0];
  if (content.type !== "text") return [];

  try {
    const jsonMatch = content.text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return [];
    return JSON.parse(jsonMatch[0]);
  } catch {
    console.warn(`  Warning: could not parse JSON from Claude response for "${section.heading}"`);
    return [];
  }
}

function generateMarkdownSummary(findings, date) {
  const lines = [
    `# Notes Clarification Report — ${date}`,
    ``,
    `Generated by \`agent-notes-clarifier.mjs\` using ${MODEL}.`,
    ``,
  ];

  if (findings.length === 0) {
    lines.push("No significant gaps or clarifications found.");
    return lines.join("\n");
  }

  // Group by section
  const bySectionMap = new Map();
  for (const f of findings) {
    const list = bySectionMap.get(f.section) ?? [];
    list.push(f);
    bySectionMap.set(f.section, list);
  }

  for (const [section, items] of bySectionMap.entries()) {
    lines.push(`## ${section}`, ``);
    for (const item of items) {
      const typeLabel =
        item.type === "missing_concept"
          ? "Missing Concept"
          : item.type === "clarification"
          ? "Clarification"
          : "Contradiction";
      lines.push(
        `### ${typeLabel}`,
        ``,
        `**Finding:** ${item.finding}`,
        ``,
        `**Suggested Addition:** ${item.suggested_addition}`,
        ``,
        item.transcript_quote
          ? `**Transcript Quote:**\n> ${item.transcript_quote}`
          : "",
        ``,
      );
    }
  }

  return lines.filter((l) => l !== undefined).join("\n");
}

async function main() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("Error: ANTHROPIC_API_KEY environment variable is required.");
    process.exit(1);
  }

  if (!existsSync(NOTES_PATH)) {
    console.error(`Error: Notes file not found at ${NOTES_PATH}`);
    process.exit(1);
  }

  console.log("Loading notes and transcripts...");
  const typContent = readFileSync(NOTES_PATH, "utf8");
  const sections = parseSections(typContent);
  const transcripts = loadTranscripts();

  console.log(`  Parsed ${sections.length} section(s) from notes`);
  console.log(`  Loaded ${transcripts.length} transcript(s)`);

  if (transcripts.length === 0) {
    console.log("No transcripts found. Run the transcription pipeline first.");
    process.exit(0);
  }

  // Find thin sections
  const thinSections = sections
    .filter((s) => countWords(s.text) < MIN_WORDS_FOR_THIN)
    .slice(0, MAX_SECTIONS_PER_RUN);

  console.log(`  Found ${thinSections.length} thin section(s) (< ${MIN_WORDS_FOR_THIN} words) to analyze`);

  if (thinSections.length === 0) {
    console.log("All sections are sufficiently detailed. Nothing to do.");
    process.exit(0);
  }

  const client = new Anthropic({ apiKey });
  const allFindings = [];

  for (const section of thinSections) {
    console.log(`\nAnalyzing: "${section.heading}" (${countWords(section.text)} words)`);
    const snippets = findRelevantSegments(section, transcripts);
    console.log(`  Found ${snippets.length} relevant transcript snippet(s)`);

    const findings = await analyzeSection(client, section, snippets);
    console.log(`  ${findings.length} finding(s)`);

    for (const f of findings) {
      allFindings.push({ section: section.heading, ...f });
    }
  }

  // Write outputs
  mkdirSync(OUTPUT_DIR, { recursive: true });
  const dateStr = new Date().toISOString().slice(0, 10);
  const jsonPath = join(OUTPUT_DIR, `notes-clarifications-${dateStr}.json`);
  const mdPath = join(OUTPUT_DIR, `notes-clarifications-${dateStr}.md`);

  writeFileSync(jsonPath, JSON.stringify(allFindings, null, 2));
  writeFileSync(mdPath, generateMarkdownSummary(allFindings, dateStr));

  console.log(`\n✅ Done. ${allFindings.length} total finding(s).`);
  console.log(`   JSON: ${jsonPath}`);
  console.log(`   Markdown: ${mdPath}`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
