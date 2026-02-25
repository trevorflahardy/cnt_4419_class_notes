# CNT 4419 Study Hub

An interactive study tool for **CNT 4419: Secure Coding** at the University of South Florida (Spring 2026).

Built with [Nuxt 3](https://nuxt.com), [Nuxt UI](https://ui.nuxt.com), [Typst](https://typst.app), and client-side AI.

## 🌐 View Online

**[📖 Open Study Hub](https://trevorflahardy.github.io/cnt_4419_class_notes/)**

## Features

- **📄 PDF Viewer** — Read the compiled class notes with zoom, search, and page navigation
- **🤖 AI Chat** — Ask questions about the notes using client-side AI (no data leaves your browser)
  - **Smart Search** (all browsers): Finds the most relevant sections from the notes
  - **Full AI** (Chrome/Edge with WebGPU): Natural language answers powered by a local LLM
- **📝 Practice Quizzes** — Generate AI-powered practice tests from the notes with multiple choice questions, explanations, and score tracking
- **🌙 Dark Mode** — Full light/dark theme support

## 📄 Download the PDF

The latest PDF is automatically built and attached to a GitHub Release:

**[⬇ Download Latest PDF](https://github.com/trevorflahardy/cnt_4419_class_notes/releases/latest/download/cnt_4419_typed_notes.pdf)**

## Building Locally

### Notes (Typst → PDF)

```bash
typst compile cnt_4419_typed_notes.typ
```

### Study Hub (Nuxt site)

```bash
cd site
bun install
bun run dev
```

## How It Works

1. Class notes are written in [Typst](https://typst.app/) (`cnt_4419_typed_notes.typ`)
2. On every push, GitHub Actions:
   - Compiles the Typst file to PDF
   - Extracts text and generates semantic embeddings
   - Builds and deploys the Nuxt static site to GitHub Pages
   - Attaches the PDF to a GitHub Release
3. The site uses [Transformers.js](https://huggingface.co/docs/transformers.js) for semantic search and [WebLLM](https://webllm.mlc.ai/) for chat — everything runs in your browser

## Tech Stack

| Layer      | Tool                                                                       |
| ---------- | -------------------------------------------------------------------------- |
| Notes      | [Typst](https://typst.app/)                                                |
| Framework  | [Nuxt 3](https://nuxt.com/)                                                |
| UI         | [Nuxt UI](https://ui.nuxt.com/) + [Tailwind CSS](https://tailwindcss.com/) |
| PDF Viewer | [vue-pdf-embed](https://github.com/nickolaev/vue-pdf-embed)                |
| AI Search  | [Transformers.js](https://huggingface.co/docs/transformers.js)             |
| AI Chat    | [WebLLM](https://webllm.mlc.ai/)                                           |
| Deployment | [GitHub Pages](https://pages.github.com/)                                  |
