/** Vector storage formats supported by the on-disk index. Missing `format` means `float`. */
export type SearchIndexFormat = "float" | "int8";

/** One searchable content chunk from a guide, operation page, or TypeDoc page. */
export interface SearchDoc {
    /** Stable id derived from the URL and title. */
    id: string;
    /** Deep link to the chunk, including its heading anchor when present. */
    url: string;
    /** Heading or operation namespace. */
    title: string;
    /** Chunk body, truncated before embedding. */
    text: string;
    /** Content source used by result filters. */
    source: "guide" | "operation" | "typedoc";
    /** Full-precision embedding used by the float index format. */
    vector?: number[];
    /** Int8 embedding codes used by the quantized index format. */
    q?: number[];
    /** Scale used to reconstruct int8 components as `q[i] / 127 * scale`. */
    scale?: number;
}

/** Vector fields read by ranking helpers. Other document fields are not required. */
export type SearchVector = Pick<SearchDoc, "vector" | "q" | "scale">;

/** The on-disk search index generated for the docs site. */
export interface SearchIndex {
    /** Model id used to embed docs and queries. */
    model: string;
    /** Embedding dimensionality. */
    dim: number;
    /** Vector format. Older indexes without this field use float vectors. */
    format?: SearchIndexFormat;
    /** Searchable content chunks. */
    docs: SearchDoc[];
}

/** A ranked result. Before merging, scores are raw keyword or cosine scores. */
export interface ScoredResult {
    /** Result URL. */
    url: string;
    /** Result title. */
    title: string;
    /** Result snippet text. */
    text: string;
    /** Content source. */
    source: SearchDoc["source"];
    /** Raw helper score, or a normalized 0..1 score after `mergeResults`. */
    score: number;
    /** Ranking pass or passes that matched the result. */
    matchedBy: "semantic" | "keyword" | "both";
}

/** Debounce and stale-result state owned by one search UI. */
export interface SearchCoordinator {
    /** Issue the next monotonically increasing search token. */
    begin(): number;
    /** Return whether a token still belongs to the latest search. */
    isCurrent(token: number): boolean;
    /** Run a callback after the delay, replacing any pending callback. */
    schedule(callback: () => void, delay?: number): void;
    /** Cancel the pending debounced callback. */
    clearDebounce(): void;
}

/** Create independent debounce and stale-result state for one search UI. */
export function createSearchCoordinator(): SearchCoordinator;

/** Quantize an embedding without clipping its largest absolute component. */
export function quantizeVector(vector: number[]): { q: number[]; scale: number } | null;

/** Read or reconstruct a doc vector, memoizing reconstructed values by object. */
export function docVector(doc: SearchVector | SearchDoc): number[] | null;

/** Reconstruct floats with `q[i] / 127 * scale`; return null if either field is absent. */
export function dequantizeVector(doc: SearchVector | SearchDoc): number[] | null;

/** Score each query term: title matches add 3 and title-plus-body matches add 1. */
export function keywordScore(doc: Pick<SearchDoc, "title" | "text">, query: string): number;

/** Return matching docs by raw keyword score, capped at 8 results by default. */
export function keywordResults(index: SearchDoc[], query: string, limit?: number): ScoredResult[];

/** Return raw cosine-ranked docs, capped at 8 results by default. */
export function semanticResults(
    index: SearchDoc[],
    queryVector: number[],
    limit?: number
): ScoredResult[];

/** Normalize each result list to 0..1, dedupe by URL, and keep the higher score. */
export function mergeResults(semantic: ScoredResult[], keyword: ScoredResult[]): ScoredResult[];

/** Return cosine similarity for equal-length vectors, or 0 for unusable vectors. */
export function cosineSimilarity(a: number[], b: number[] | SearchVector | SearchDoc): number;
