export function cosineSimilarity(a: number[], b: number[]): number {
    let dot = 0, normA = 0, normB = 0
    for (let i = 0; i < a.length; i++) {
        const ai = a[i]!, bi = b[i]!
        dot += ai * bi
        normA += ai * ai
        normB += bi * bi
    }
    return dot / (Math.sqrt(normA) * Math.sqrt(normB))
}
