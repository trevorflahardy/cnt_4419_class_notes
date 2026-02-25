import { readFileSync, writeFileSync, copyFileSync, mkdirSync } from "fs";
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
        !trimmed.match(/[.!?,;:]$/)
      ) {
        if (buffer.length > 0 && buffer.length > CHAR_CHUNK * 0.3) {
          chunks.push({
            text: buffer.trim(),
            page: pageNum,
            heading: currentHeading,
          });
          buffer = buffer.slice(-CHAR_OVERLAP);
        }
        currentHeading = trimmed;
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
    embedding,
  });
  console.log(`  Embedded chunk ${i + 1}/${chunks.length}`);
}

// Write output
console.log("💾 Writing embeddings.json...");
const output = { chunks: embeddedChunks };
writeFileSync(EMBEDDINGS_PATH, JSON.stringify(output));
console.log(
  `  Wrote ${embeddedChunks.length} chunks with embeddings (${(Buffer.byteLength(JSON.stringify(output)) / 1024 / 1024).toFixed(2)} MB)`,
);

console.log("✅ Done!");
