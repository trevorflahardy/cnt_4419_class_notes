import { readFileSync, writeFileSync, copyFileSync, mkdirSync, existsSync, readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const PDF_PATH = join(ROOT, "cnt_4419_typed_notes.pdf");
const OUTPUT_DIR = join(ROOT, "site", "public");
const EMBEDDINGS_PATH = join(OUTPUT_DIR, "embeddings.json");
const PDF_OUTPUT = join(OUTPUT_DIR, "notes.pdf");

// Ensure output dir exists
mkdirSync(OUTPUT_DIR, { recursive: true });

// Copy PDF
console.log("📄 Copying PDF to site/public/notes.pdf...");
copyFileSync(PDF_PATH, PDF_OUTPUT);

// Extract text from PDF
console.log("📖 Extracting text from PDF...");
// Use pdfjs-dist with legacy build for Node.js
const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");

const data = new Uint8Array(readFileSync(PDF_PATH));
const doc = await pdfjsLib.getDocument({ data }).promise;
const numPages = doc.numPages;

let pages = [];
for (let i = 1; i <= numPages; i++) {
  const page = await doc.getPage(i);
  const textContent = await page.getTextContent();
  const text = textContent.items
    .filter((item) => "str" in item)
    .map((item) => item.str)
    .join(" ");
  pages.push({ pageNum: i, text });
  console.log(`  Page ${i}/${numPages}: ${text.length} chars`);
}

// Chunk the text
console.log("✂️  Chunking text...");
const CHUNK_SIZE = 300; // target tokens (roughly 4 chars per token)
const CHUNK_OVERLAP = 50;
const CHAR_CHUNK = CHUNK_SIZE * 4;
const CHAR_OVERLAP = CHUNK_OVERLAP * 4;

/**
 * Returns true when a candidate line looks like a real section heading
 * rather than a page number, page fraction, or small fragment.
 */
function isLikelyHeading(line) {
  const stripped = line.replace(/[^a-zA-Z]/g, "");
  // Must contain at least 4 alphabetic characters
  if (stripped.length < 4) return false;
  // Reject bare page fractions like "5 / 12"
  if (/^\s*\d+\s*\/\s*\d+\s*$/.test(line)) return false;
  // Reject if it's ONLY a number
  if (/^\s*\d+\s*$/.test(line)) return false;
  // Reject lines that are mostly dots (TOC leaders)
  const dots = (line.match(/\.{2,}/g) || []).reduce((s, m) => s + m.length, 0);
  if (dots > line.length * 0.3) return false;
  // Reject sentence fragments — headings rarely start with lowercase or common
  // conjunctive words if they aren't definitions / named concepts
  const trimmedClean = line.replace(
    /^[\p{Emoji}\p{Emoji_Presentation}\s]+/u,
    "",
  );
  if (
    /^(for |the |a |an |if |but |so |or |and |it |this |that |is |are |was |were )/i.test(
      trimmedClean,
    ) &&
    !/definition|principle|theorem|concept|rule|law|property/i.test(
      trimmedClean,
    )
  ) {
    return false;
  }
  return true;
}

function chunkText(pages) {
  const chunks = [];
  let currentHeading = "General";

  for (const { pageNum, text } of pages) {
    // Try to detect headings (lines that look like section headers)
    const lines = text.split(/(?<=[.!?])\s+/);
    let buffer = "";

    for (const line of lines) {
      // Simple heading detection: short lines that don't end with punctuation
      const trimmed = line.trim();
      if (
        trimmed.length > 0 &&
        trimmed.length < 60 &&
        !trimmed.match(/[.!?,;:]$/) &&
        isLikelyHeading(trimmed)
      ) {
        if (buffer.length > 0 && buffer.length > CHAR_CHUNK * 0.3) {
          chunks.push({
            text: buffer.trim(),
            page: pageNum,
            heading: currentHeading,
          });
          buffer = buffer.slice(-CHAR_OVERLAP);
        }
        // Strip trailing page fractions like " 2 / 12" from heading text
        currentHeading =
          trimmed.replace(/\s+\d+\s*\/\s*\d+\s*$/, "").trim() || trimmed;
      }

      buffer += " " + trimmed;

      if (buffer.length >= CHAR_CHUNK) {
        chunks.push({
          text: buffer.trim(),
          page: pageNum,
          heading: currentHeading,
        });
        buffer = buffer.slice(-CHAR_OVERLAP);
      }
    }

    // Flush remaining buffer
    if (buffer.trim().length > 50) {
      chunks.push({
        text: buffer.trim(),
        page: pageNum,
        heading: currentHeading,
      });
    }
  }

  return chunks;
}

const chunks = chunkText(pages);
console.log(`  Created ${chunks.length} chunks`);

// Generate embeddings
console.log("🧠 Generating embeddings...");
const { pipeline } = await import("@huggingface/transformers");
const extractor = await pipeline(
  "feature-extraction",
  "Xenova/all-MiniLM-L6-v2",
);

const embeddedChunks = [];
for (let i = 0; i < chunks.length; i++) {
  const chunk = chunks[i];
  const output = await extractor(chunk.text, {
    pooling: "mean",
    normalize: true,
  });
  const embedding = Array.from(output.data);
  embeddedChunks.push({
    text: chunk.text,
    page: chunk.page,
    heading: chunk.heading,
    source: "pdf",
    embedding,
  });
  console.log(`  Embedded chunk ${i + 1}/${chunks.length}`);
}

// --- Embed transcript chunks ---
const TRANSCRIPTS_ROOT = join(ROOT, "transcripts");
if (existsSync(TRANSCRIPTS_ROOT)) {
  const transcriptFiles = readdirSync(TRANSCRIPTS_ROOT)
    .filter((f) => /^\d{4}-\d{2}-\d{2}\.json$/.test(f))
    .sort();

  if (transcriptFiles.length > 0) {
    console.log(`\n📼 Embedding ${transcriptFiles.length} transcript file(s)...`);

    for (const file of transcriptFiles) {
      const date = file.replace(".json", "");
      let data;
      try {
        data = JSON.parse(readFileSync(join(TRANSCRIPTS_ROOT, file), "utf8"));
      } catch (err) {
        console.warn(`  Warning: could not parse ${file}: ${err.message}`);
        continue;
      }

      const transcriptText = (data.transcript || "").trim();
      if (!transcriptText) continue;

      // Chunk transcript by accumulating segments up to CHAR_CHUNK chars
      const transcriptChunks = [];
      let buffer = "";
      const segments = Array.isArray(data.segments) ? data.segments : [];

      for (const seg of segments) {
        const segText = (seg.text || "").trim();
        if (!segText) continue;
        buffer += (buffer ? " " : "") + segText;
        if (buffer.length >= CHAR_CHUNK) {
          transcriptChunks.push(buffer.trim());
          buffer = buffer.slice(-CHAR_OVERLAP);
        }
      }

      // If no segments or remaining buffer, fall back to chunking full text directly
      if (transcriptChunks.length === 0 || buffer.trim().length > 50) {
        if (buffer.trim().length > 50) {
          transcriptChunks.push(buffer.trim());
        } else if (transcriptChunks.length === 0) {
          // No segments — chunk the full transcript text directly
          let pos = 0;
          while (pos < transcriptText.length) {
            const end = Math.min(pos + CHAR_CHUNK, transcriptText.length);
            const chunk = transcriptText.slice(pos, end).trim();
            if (chunk.length > 50) transcriptChunks.push(chunk);
            pos += CHAR_CHUNK - CHAR_OVERLAP;
          }
        }
      }

      const heading = `Class Recording - ${date}`;
      console.log(`  ${date}: ${transcriptChunks.length} chunk(s)`);

      for (let i = 0; i < transcriptChunks.length; i++) {
        const chunkText = transcriptChunks[i];
        const embOutput = await extractor(chunkText, {
          pooling: "mean",
          normalize: true,
        });
        embeddedChunks.push({
          text: chunkText,
          page: 0,
          heading,
          source: "transcript",
          date,
          embedding: Array.from(embOutput.data),
        });
        console.log(`    Embedded transcript chunk ${i + 1}/${transcriptChunks.length}`);
      }
    }
  }
} else {
  console.log("\nNo transcripts/ directory found — skipping transcript embedding.");
}

// Write output
console.log("💾 Writing embeddings.json...");
const output = { chunks: embeddedChunks };
writeFileSync(EMBEDDINGS_PATH, JSON.stringify(output));
console.log(
  `  Wrote ${embeddedChunks.length} chunks with embeddings (${(Buffer.byteLength(JSON.stringify(output)) / 1024 / 1024).toFixed(2)} MB)`,
);

// --- Copy transcript files to site/public/transcripts/ ---
console.log("\n📂 Writing public transcript files...");
const PUBLIC_TRANSCRIPTS_DIR = join(OUTPUT_DIR, "transcripts");
mkdirSync(PUBLIC_TRANSCRIPTS_DIR, { recursive: true });

const indexEntries = [];

if (existsSync(TRANSCRIPTS_ROOT)) {
  const transcriptFiles = readdirSync(TRANSCRIPTS_ROOT)
    .filter((f) => /^\d{4}-\d{2}-\d{2}\.json$/.test(f))
    .sort()
    .reverse(); // newest-first

  for (const file of transcriptFiles) {
    const date = file.replace(".json", "");
    let data;
    try {
      data = JSON.parse(readFileSync(join(TRANSCRIPTS_ROOT, file), "utf8"));
    } catch (err) {
      console.warn(`  Warning: could not parse ${file}: ${err.message}`);
      continue;
    }

    // Write full copy (all fields kept — transcript text needed by chat)
    const destPath = join(PUBLIC_TRANSCRIPTS_DIR, file);
    writeFileSync(destPath, JSON.stringify(data));
    console.log(`  Wrote ${file}`);

    // Build index entry
    const segments = Array.isArray(data.segments) ? data.segments : [];
    indexEntries.push({
      date: data.date || date,
      recordings: Array.isArray(data.recordings) ? data.recordings : [],
      segment_count: segments.length,
    });
  }
}

// Write index.json (already sorted newest-first from the loop above)
const indexData = {
  generated_at: new Date().toISOString(),
  dates: indexEntries,
};
writeFileSync(
  join(PUBLIC_TRANSCRIPTS_DIR, "index.json"),
  JSON.stringify(indexData, null, 2),
);
console.log(`  Wrote index.json with ${indexEntries.length} date(s)`);

console.log("✅ Done!");
