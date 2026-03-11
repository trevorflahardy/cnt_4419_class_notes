# CNT 4419 Study Hub

A comprehensive, AI-powered interactive study platform for **CNT 4419: Secure Coding** at the University of South Florida (Spring 2026). Everything runs entirely in your browser — no server, no data leaves your machine.

Built with [Nuxt 3](https://nuxt.com), [Nuxt UI](https://ui.nuxt.com), [Typst](https://typst.app), and client-side AI.

## Live Site

**[Open Study Hub](https://trevorflahardy.github.io/cnt_4419_class_notes/)**

## Features

### Typed Class Notes (PDF Viewer)
Full, hand-typed lecture notes compiled from Typst to PDF and viewable directly in the browser with zoom, search, and page navigation. Covers all 8 chapters of the course:

1. **Foundations** — Policy, mechanism, traces, programs
2. **Properties & Policy** — CIA triad, safety & liveness, properties vs. non-properties
3. **Mechanisms** — Static/dynamic, sound/complete/precise enforcers, false positives/negatives
4. **Mechanism Categories** — Preventative, detective, containment, recovery
5. **Secure Design Principles** — Input sanitization, error handling, defense in depth, PoLP, TOCTOU, complete mediation
6. **Attack Vectors** — Trust categories, confused deputy, social engineering, phishing, DoS/DDoS
7. **Access Control** — Authentication, authorization, ACL/capabilities/ACM, RBAC, MAC, DAC, Bell-LaPadula, Biba
8. **Memory & Buffers** — Stack frames, buffer overflows, NOP sleds, return-to-libc, ROP, stack guards, ASLR, CFI, fuzzing

### Practice Quiz Engine (543 Questions)
A full quiz system with **543 pre-generated questions** across all 8 chapters, featuring:

- **Multiple question types**: Multiple choice (with easy/medium/hard difficulty), True/False, and Short Answer
- **Chapter filtering**: Focus on specific chapters or mix across all
- **Definitions sub-chapter**: A dedicated "Definitions Only" toggle that filters to 78 vocabulary and abbreviation questions covering every key term from the notes (CIA, PoLP, TOCTOU, ASLR, ROP, Bell-LaPadula, etc.)
- **Self-grading for short answer**: Submit your answer, compare against the key, and self-assess
- **AI-powered explanations**: When you get a question wrong, an on-device LLM explains why the correct answer is right, using context from the actual class notes
- **XP & leveling system**: Earn XP for every answer (more for correct ones) and level up from Rookie to Master
- **Score breakdown**: Per-chapter performance analysis after each quiz
- **Confetti celebrations**: Score 80%+ and get rewarded

### AI Chat Assistant
Ask natural language questions about the course material:

- **Semantic search** (all browsers): Uses Transformers.js embeddings to find the most relevant note sections for any query
- **Full conversational AI** (Chrome/Edge with WebGPU): On-device LLM generates detailed answers grounded in the actual class notes via RAG (Retrieval-Augmented Generation)
- **Privacy-first**: Everything runs locally in your browser — no API calls, no data collection

### Lecture Transcripts
Auto-transcribed lecture recordings with timestamps, searchable and browsable within the app.

### Course Announcements
Extracted lecture announcements for quick reference on assignments, exams, and deadlines.

### Flashcards
Review key concepts in a flashcard format for spaced-repetition-style study.

### Additional Features
- **Dark/light mode** with system preference detection
- **Fully static deployment** — no backend, just HTML/CSS/JS on GitHub Pages
- **Responsive design** — works on desktop, tablet, and mobile
- **Offline-capable** — once loaded, works without an internet connection

## Download the PDF

The latest PDF is automatically built and attached to a GitHub Release:

**[Download Latest PDF](https://github.com/trevorflahardy/cnt_4419_class_notes/releases/latest/download/cnt_4419_typed_notes.pdf)**

## Building Locally

### Notes (Typst to PDF)

```bash
typst compile cnt_4419_typed_notes.typ
```

### Study Hub (Nuxt site)

```bash
cd site
bun install
bun run dev
```

### Question Bank Scripts

```bash
# Generate embeddings from PDF
node scripts/extract-and-embed.mjs

# Add definition-based questions
node scripts/add-definitions-round.mjs

# Refine question bank with prompt variations
node scripts/refine-question-bank-round2.mjs
```

## How It Works

1. Class notes are written in [Typst](https://typst.app/) (`cnt_4419_typed_notes.typ`) — a modern typesetting system with LaTeX-quality output
2. On every push, GitHub Actions:
   - Compiles the Typst source to PDF
   - Extracts text and generates semantic embeddings for RAG search
   - Builds and deploys the Nuxt static site to GitHub Pages
   - Attaches the PDF to a GitHub Release
3. The **quiz engine** draws from a curated bank of 543 questions across 8 chapters, with difficulty levels, multiple question types, and a definitions sub-chapter for vocabulary review
4. The **AI system** uses [Transformers.js](https://huggingface.co/docs/transformers.js) for semantic search and [WebLLM](https://webllm.mlc.ai/) for chat — everything runs client-side with zero data exfiltration

## Tech Stack

| Layer | Tool |
|---|---|
| Notes | [Typst](https://typst.app/) |
| Framework | [Nuxt 3](https://nuxt.com/) |
| UI | [Nuxt UI](https://ui.nuxt.com/) + [Tailwind CSS](https://tailwindcss.com/) |
| PDF Viewer | [vue-pdf-embed](https://github.com/nickolaev/vue-pdf-embed) |
| AI Search | [Transformers.js](https://huggingface.co/docs/transformers.js) (semantic embeddings) |
| AI Chat | [WebLLM](https://webllm.mlc.ai/) (on-device LLM via WebGPU) |
| Transcription | [Whisper](https://github.com/openai/whisper) (Python, offline) |
| Package Manager | [Bun](https://bun.sh/) |
| Deployment | [GitHub Pages](https://pages.github.com/) (static, zero-cost) |

## Question Bank Statistics

| Chapter | Questions | MC | T/F | SA | Definitions |
|---|---|---|---|---|---|
| 1. Foundations | 26 | 19 | 5 | 2 | 7 |
| 2. Properties & Policy | 32 | 25 | 5 | 2 | 10 |
| 3. Mechanisms | 31 | 23 | 5 | 3 | 8 |
| 4. Mechanism Categories | 26 | 20 | 4 | 2 | 8 |
| 5. Secure Design | 109 | 73 | 17 | 19 | 11 |
| 6. Attack Vectors | 82 | 58 | 7 | 17 | 5 |
| 7. Access Control | 117 | 94 | 19 | 4 | 12 |
| 8. Memory & Buffers | 120 | 99 | 14 | 7 | 17 |
| **Total** | **543** | **411** | **76** | **56** | **78** |
