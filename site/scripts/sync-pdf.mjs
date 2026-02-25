import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const siteRoot = join(__dirname, "..");
const repoRoot = join(siteRoot, "..");

const sourcePdf = join(repoRoot, "cnt_4419_typed_notes.pdf");
const outputDir = join(siteRoot, "public");
const outputPdf = join(outputDir, "notes.pdf");

mkdirSync(outputDir, { recursive: true });

if (!existsSync(sourcePdf)) {
  console.warn("[sync-pdf] Source PDF not found:", sourcePdf);
  console.warn(
    "[sync-pdf] Run Typst build first: typst compile cnt_4419_typed_notes.typ cnt_4419_typed_notes.pdf",
  );
  process.exit(0);
}

copyFileSync(sourcePdf, outputPdf);
console.log("[sync-pdf] Copied PDF to:", outputPdf);
