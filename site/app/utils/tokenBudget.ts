/**
 * Utilities for estimating token counts and truncating context to stay within
 * the on-device LLM's context window.
 *
 * The Llama-3.2-3B-Instruct model compiled for WebLLM ships with a 4 096-token
 * context window.  We must leave room for the system prompt, user prompt
 * template, and generated output — so the *context snippets* budget is smaller.
 *
 * Token estimation uses the widely-accepted ~4-characters-per-token heuristic
 * for English text with BPE tokenizers.
 */

/** Approximate characters per token for Llama-style BPE tokenizers. */
const CHARS_PER_TOKEN = 4

/**
 * Rough token-count estimate for a string.
 * Intentionally over-counts slightly to avoid hitting the hard limit.
 */
export function estimateTokens(text: string): number {
    return Math.ceil(text.length / CHARS_PER_TOKEN)
}

/**
 * Default budget breakdown (in tokens) for a 4 096-token context window:
 *
 *   System message  ≈   60
 *   Prompt template ≈  120
 *   Generation room ≈  800  (JSON responses can be large)
 *   Safety margin   ≈  200
 *   ──────────────────────
 *   Available for context ≈ 2 900 tokens ≈ 11 600 chars
 *
 * We round down to 2 500 tokens (10 000 chars) for comfort.
 */
const DEFAULT_CONTEXT_TOKEN_BUDGET = 2_500
const DEFAULT_CONTEXT_CHAR_BUDGET = DEFAULT_CONTEXT_TOKEN_BUDGET * CHARS_PER_TOKEN

/**
 * A single chunk of retrieved context (from RAG embeddings).
 */
interface ContextChunk {
    text: string
    page: number
    heading: string
}

/**
 * Maximum characters to keep from any *single* chunk so that one huge chunk
 * can't consume the entire budget.
 */
const MAX_SINGLE_CHUNK_CHARS = 1_200

/**
 * Build a context string from an array of RAG chunks, staying within
 * `maxChars` total characters.
 *
 * Chunks are added in order.  Each chunk is individually capped at
 * `MAX_SINGLE_CHUNK_CHARS` characters, and the loop stops once the running
 * total would exceed the budget.
 *
 * @param chunks    Ordered array of context chunks (most-relevant first).
 * @param maxChars  Character budget for the entire context string.
 *                  Defaults to {@link DEFAULT_CONTEXT_CHAR_BUDGET}.
 * @param formatter Optional per-chunk formatter.  Receives the chunk and its
 *                  1-based index; should return the full line of text.
 * @returns         The concatenated context string (may be empty).
 */
export function buildBudgetedContext(
    chunks: ContextChunk[],
    maxChars: number = DEFAULT_CONTEXT_CHAR_BUDGET,
    formatter?: (chunk: ContextChunk, index: number) => string,
): string {
    const parts: string[] = []
    let remaining = maxChars

    for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i]!

        // Cap individual chunk text before formatting
        const truncatedText =
            chunk.text.length > MAX_SINGLE_CHUNK_CHARS
                ? chunk.text.slice(0, MAX_SINGLE_CHUNK_CHARS) + '…'
                : chunk.text

        const line = formatter
            ? formatter({ ...chunk, text: truncatedText }, i + 1)
            : `[${i + 1}] (${chunk.heading}, p.${chunk.page}) ${truncatedText}`

        if (line.length > remaining) {
            // Try to fit a partial line if we have at least 200 chars of budget
            if (remaining > 200) {
                parts.push(line.slice(0, remaining - 3) + '…')
            }
            break
        }

        parts.push(line)
        // Account for the double-newline separator
        remaining -= line.length + 2
        if (remaining <= 0) break
    }

    return parts.join('\n\n')
}
