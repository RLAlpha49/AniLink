/**
 * Browser-safe search types and ranking math.
 *
 * Shared between the build-time indexer (`scripts/generate-search-index.ts`)
 * and the runtime search UI (`SemanticSearch.vue`). This module must not
 * import any Node-only built-ins so it bundles cleanly for the browser.
 */

/** One searchable chunk. */
export interface SearchDoc {
    /** Stable id (hash of url+title). */
    id: string;
    /** Deep link with anchor. */
    url: string;
    /** Heading or operation namespace. */
    title: string;
    /** Chunk body, truncated to ~500 chars for embedding. */
    text: string;
    /** Content source. */
    source: "guide" | "operation" | "typedoc";
    /** 384-dim embedding (filled at embed time). */
    vector?: number[];
}

/** The on-disk index file. */
export interface SearchIndex {
    /** Model id used to embed docs and queries. */
    model: string;
    /** Embedding dimensionality. */
    dim: number;
    /** All searchable chunks. */
    docs: SearchDoc[];
}

/** A scored search result, produced by ranking + merge. */
export interface ScoredResult {
    /** Result URL. */
    url: string;
    /** Result title. */
    title: string;
    /** Result snippet text. */
    text: string;
    /** Content source. */
    source: SearchDoc["source"];
    /** Normalized score in 0..1. */
    score: number;
    /** Which pass(es) matched this result. */
    matchedBy: "semantic" | "keyword" | "both";
}

/** Cosine similarity between two equal-length vectors. */
export function cosineSimilarity(a: number[], b: number[]): number {
    let dot = 0;
    let na = 0;
    let nb = 0;
    for (let i = 0; i < a.length; i++) {
        dot += a[i] * b[i];
        na += a[i] * a[i];
        nb += b[i] * b[i];
    }
    if (na === 0 || nb === 0) return 0;
    return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

/**
 * Merge semantic (0..1) and keyword (raw scores) results: normalize each list
 * to 0..1, dedupe by url keeping the max score, sort descending.
 *
 * @param semantic Semantic results with scores in 0..1.
 * @param keyword Keyword results with raw scores.
 * @returns Merged, deduped, sorted results.
 */
export function mergeResults(semantic: ScoredResult[], keyword: ScoredResult[]): ScoredResult[] {
    const norm = (arr: ScoredResult[]): ScoredResult[] => {
        if (arr.length === 0) return arr;
        const max = Math.max(...arr.map((r) => r.score));
        const min = Math.min(...arr.map((r) => r.score));
        const range = max - min || 1;
        return arr.map((r) => ({ ...r, score: (r.score - min) / range }));
    };
    const sem = norm(semantic);
    const key = norm(keyword);
    const byUrl = new Map<string, ScoredResult>();
    // First pass: semantic results, tagged by whether keyword also matched.
    const keyUrls = new Set(key.map((r) => r.url));
    for (const r of sem) {
        byUrl.set(r.url, { ...r, matchedBy: keyUrls.has(r.url) ? "both" : "semantic" });
    }
    // Second pass: keyword-only results.
    for (const r of key) {
        const existing = byUrl.get(r.url);
        if (existing) {
            // Already present from semantic; keep the higher score, preserve "both".
            if (r.score > existing.score) {
                byUrl.set(r.url, { ...r, matchedBy: "both" });
            }
        } else {
            byUrl.set(r.url, { ...r, matchedBy: "keyword" });
        }
    }
    return [...byUrl.values()].sort((a, b) => b.score - a.score);
}
