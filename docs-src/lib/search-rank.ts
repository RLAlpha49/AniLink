/**
 * Browser-safe search types and ranking math.
 *
 * Shared between the build-time indexer (`scripts/generate-search-index.ts`)
 * and the runtime search UI (`SemanticSearch.vue`). This module must not
 * import any Node-only built-ins so it bundles cleanly for the browser.
 */

/**
 * The embedding model used by the semantic search, shared verbatim by the
 * build-time indexer (`scripts/generate-search-index.ts`), the VitePress
 * search UI (`SemanticSearch.vue`), and the TypeDoc search bridge
 * (`anilink-search.js`). All three must embed with the same weights or
 * cosine rankings silently degrade, so the id and revision live here — the
 * one module every consumer already imports.
 */
export const SEARCH_MODEL_ID = "Xenova/bge-small-en-v1.5";

/**
 * Pinned model revision. Pinning keeps build-time and browser embeddings
 * byte-identical across deploys; every consumer — the build indexer, the
 * VitePress search UI, the TypeDoc bridge, and the CI model cache key —
 * must reference this same constant or cosine rankings silently degrade.
 */
export const SEARCH_MODEL_REVISION = "ea104dacec62c0de699686887e3f920caeb4f3e3";

/**
 * On-disk index format version.
 *
 * - `"float"` (v1): each `SearchDoc.vector` is a full-precision float array
 *   (~3.5 KB of JSON per chunk; the whole index ships ~2.2 MB).
 * - `"int8"` (v2): each `SearchDoc.q` is an int8 array plus a per-vector
 *   `scale` factor; floats are reconstructed at ranking time. Roughly 4x
 *   smaller and near-lossless for cosine ranking (embeddings are
 *   L2-normalized, so all components live in a narrow range).
 */
export type SearchIndexFormat = "float" | "int8";

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
    /**
     * Int8-quantized embedding (v2 format). Present only when the index was
     * written with `format: "int8"`; mutually exclusive with `vector`.
     */
    q?: number[];
    /**
     * Per-vector scale factor for `q` (v2 format): `q[i] / 127 * scale`
     * reconstructs the float component. Chosen as the max absolute component
     * so quantization never clips.
     */
    scale?: number;
}

/** The on-disk index file. */
export interface SearchIndex {
    /** Model id used to embed docs and queries. */
    model: string;
    /** Embedding dimensionality. */
    dim: number;
    /**
     * Vector storage format (see {@link SearchIndexFormat}). Older indexes
     * without this field are treated as `"float"`.
     */
    format?: SearchIndexFormat;
    /** All searchable chunks. */
    docs: SearchDoc[];
}

/**
 * Quantize a float embedding to int8 plus a scale factor.
 *
 * The scale is the max absolute component, so every component maps into
 * [-127, 127] without clipping. Returns `null` for zero vectors (nothing to
 * encode; the caller leaves both `q` and `scale` unset and ranking treats the
 * doc as having no vector).
 *
 * @param vector Full-precision embedding.
 * @returns Int8 codes and the scale factor, or `null` for a zero vector.
 */
export function quantizeVector(vector: number[]): { q: number[]; scale: number } | null {
    let max = 0;
    for (let i = 0; i < vector.length; i++) {
        const a = Math.abs(vector[i]);
        if (a > max) max = a;
    }
    if (max === 0) return null;
    const q = new Array<number>(vector.length);
    for (let i = 0; i < vector.length; i++) {
        q[i] = Math.round((vector[i] / max) * 127);
    }
    return { q, scale: max };
}

/**
 * Reconstructed vectors, memoized per doc. Docs are immutable after the
 * index loads, but every query re-ranks every doc, so without this cache the
 * int8→float reconstruction would repeat per doc per query.
 */
const vectorCache = new WeakMap<SearchDoc, number[]>();

/**
 * Reconstruct a doc's embedding as floats, whichever format the index was
 * written in: v1 docs carry `vector` directly; v2 docs carry `q` (int8 codes)
 * and `scale`, and `q[i] / 127 * scale` rebuilds the component. Memoized —
 * see {@link vectorCache}.
 *
 * @param doc Chunk carrying `vector`, or `q` and `scale`.
 * @returns The doc's embedding, or `null` when no usable vector data exists.
 */
export function docVector(doc: SearchDoc): number[] | null {
    const cached = vectorCache.get(doc);
    if (cached) return cached;
    let v: number[] | null = null;
    if (doc.vector) {
        v = doc.vector;
    } else if (doc.q && doc.scale !== undefined) {
        v = new Array<number>(doc.q.length);
        for (let i = 0; i < doc.q.length; i++) {
            v[i] = (doc.q[i] / 127) * doc.scale;
        }
    }
    if (v) vectorCache.set(doc, v);
    return v;
}

/**
 * Reconstruct a float embedding from int8 codes.
 *
 * Inverse of {@link quantizeVector}: `q[i] / 127 * scale`.
 *
 * @param doc Chunk carrying `q` and `scale`.
 * @returns The reconstructed embedding, or `null` when either field is missing.
 */
export function dequantizeVector(doc: SearchDoc): number[] | null {
    if (!doc.q || doc.scale === undefined) return null;
    const out = new Array<number>(doc.q.length);
    for (let i = 0; i < doc.q.length; i++) {
        out[i] = (doc.q[i] / 127) * doc.scale;
    }
    return out;
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

/**
 * Escape characters that could be interpreted as HTML markup in text content.
 *
 * Ampersands are encoded first so the entities added for angle brackets are
 * not encoded a second time.
 *
 * @param s Text to escape.
 * @returns Text safe to insert as HTML text content.
 */
export function escapeHtml(s: string): string {
    return s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

/**
 * Cosine similarity between two equal-length vectors.
 *
 * `b` may be a doc instead of a raw vector: whichever format the index was
 * written in — v1 (`vector`) or v2 (`q`/`scale`) — the embedding is resolved
 * on the fly, so callers pass the doc itself and never need to know the
 * format. A doc with neither `vector` nor `q`/`scale` scores 0.
 */
export function cosineSimilarity(a: number[], b: number[] | SearchDoc): number {
    const bv = Array.isArray(b) ? b : (docVector(b) ?? []);
    // A doc with no vector data (or a length mismatch, which would make every
    // product NaN) has no similarity to anything: score 0.
    if (bv.length === 0 || bv.length !== a.length) return 0;
    let dot = 0;
    let na = 0;
    let nb = 0;
    for (let i = 0; i < a.length; i++) {
        dot += a[i] * bv[i];
        na += a[i] * a[i];
        nb += bv[i] * bv[i];
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
