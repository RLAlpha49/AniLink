/** Runtime-agnostic search ranking and coordination shared by both docs runtimes. */

const INT8_MAX = 127;
const TITLE_MATCH_WEIGHT = 3;
const BODY_MATCH_WEIGHT = 1;
const DEFAULT_RESULT_LIMIT = 8;

/**
 * Create per-search-UI debounce and stale-result state.
 *
 * @returns Methods for issuing monotonic search tokens and managing one debounce timer.
 */
export function createSearchCoordinator() {
    let searchToken = 0;
    let debounceTimer = null;

    return {
        begin() {
            searchToken += 1;
            return searchToken;
        },
        isCurrent(token) {
            return token === searchToken;
        },
        schedule(callback, delay = 150) {
            if (debounceTimer !== null) clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                debounceTimer = null;
                callback();
            }, delay);
        },
        clearDebounce() {
            if (debounceTimer !== null) {
                clearTimeout(debounceTimer);
                debounceTimer = null;
            }
        },
    };
}

/**
 * Quantize a float embedding to int8 codes and a scale factor.
 *
 * The scale is the largest absolute component, so quantization does not clip.
 * Reconstruct each component with `q[i] / 127 * scale`.
 *
 * @param vector Full-precision embedding.
 * @returns Int8 codes and their scale, or `null` for a zero vector.
 */
export function quantizeVector(vector) {
    let max = 0;
    for (let i = 0; i < vector.length; i++) {
        const a = Math.abs(vector[i]);
        if (a > max) max = a;
    }
    if (max === 0) return null;
    const q = new Array(vector.length);
    for (let i = 0; i < vector.length; i++) {
        q[i] = Math.round((vector[i] / max) * INT8_MAX);
    }
    return { q, scale: max };
}

/** Cache reconstructed vectors while leaving indexed documents unchanged. */
const vectorCache = new WeakMap();

/**
 * Reconstruct a doc embedding from either the float or int8 index format.
 *
 * Indexed docs remain unchanged. The WeakMap avoids rebuilding an int8 vector
 * each time a query ranks the same doc.
 *
 * @param doc Record containing `vector`, or `q` and `scale`.
 * @returns The float vector, or `null` when no usable vector exists.
 */
export function docVector(doc) {
    const cached = vectorCache.get(doc);
    if (cached) return cached;
    let vector = null;
    if (doc.vector) {
        vector = doc.vector;
    } else if (doc.q && typeof doc.scale === "number") {
        vector = dequantizeVector(doc);
    }
    if (vector) vectorCache.set(doc, vector);
    return vector;
}

/**
 * Reconstruct a float embedding from int8 codes and their scale factor.
 *
 * @param doc Record containing int8 `q` codes and a numeric `scale`.
 * @returns The reconstructed vector, or `null` when either field is missing.
 */
export function dequantizeVector(doc) {
    if (!doc.q || typeof doc.scale !== "number") return null;
    const out = new Array(doc.q.length);
    for (let i = 0; i < doc.q.length; i++) {
        out[i] = (doc.q[i] / INT8_MAX) * doc.scale;
    }
    return out;
}

/**
 * Score query terms with a title weight of 3 and a body weight of 1.
 * A title match also occurs in the combined title and body text, so it adds 4.
 *
 * @param doc Searchable title and body text.
 * @param query User query. Terms are split on whitespace and matched case-insensitively.
 * @returns The sum of the title and body weights for all matching terms.
 */
export function keywordScore(doc, query) {
    const title = doc.title.toLowerCase();
    const text = (doc.title + " " + doc.text).toLowerCase();
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    let score = 0;
    for (const term of terms) {
        if (title.includes(term)) score += TITLE_MATCH_WEIGHT;
        if (text.includes(term)) score += BODY_MATCH_WEIGHT;
    }
    return score;
}

/**
 * Return the highest-scoring keyword results.
 *
 * Results with no matching terms are removed. Scores remain raw weighted
 * keyword scores until `mergeResults` normalizes them.
 *
 * @param index Searchable docs.
 * @param query User query.
 * @param limit Maximum number of results to return.
 * @returns Matching docs ordered by descending keyword score.
 */
export function keywordResults(index, query, limit = DEFAULT_RESULT_LIMIT) {
    return index
        .map((doc) => ({
            url: doc.url,
            title: doc.title,
            text: doc.text,
            source: doc.source,
            score: keywordScore(doc, query),
            matchedBy: "keyword",
        }))
        .filter((result) => result.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
}

/**
 * Calculate cosine similarity between equal-length vectors or a query and an indexed doc.
 *
 * Docs may use float `vector` values or int8 `q` codes with a numeric `scale`.
 * A missing vector, zero vector, or length mismatch scores 0.
 *
 * @param a Query embedding.
 * @param b Float embedding or indexed doc.
 * @returns Cosine similarity in the range -1..1, or 0 for unusable vectors.
 */
export function cosineSimilarity(a, b) {
    const bv = Array.isArray(b) ? b : (docVector(b) ?? []);
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
 * Return the highest-scoring semantic results for an embedded query.
 *
 * Scores are raw cosine similarities until `mergeResults` normalizes them.
 *
 * @param index Searchable docs.
 * @param queryVector Embedded user query.
 * @param limit Maximum number of results to return.
 * @returns Docs ordered by descending cosine similarity.
 */
export function semanticResults(index, queryVector, limit = DEFAULT_RESULT_LIMIT) {
    return index
        .map((doc) => ({
            url: doc.url,
            title: doc.title,
            text: doc.text,
            source: doc.source,
            score: cosineSimilarity(queryVector, doc),
            matchedBy: "semantic",
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
}

/**
 * Normalize and merge keyword and semantic result lists, deduplicating by URL.
 *
 * Each list is independently scaled to 0..1. When a URL appears in both lists,
 * the higher normalized score is kept and `matchedBy` is set to `both`.
 *
 * @param semantic Results scored by cosine similarity.
 * @param keyword Results scored by weighted keyword matches.
 * @returns Deduplicated results ordered by descending normalized score.
 */
export function mergeResults(semantic, keyword) {
    const normalize = (results) => {
        if (results.length === 0) return results;
        const max = Math.max(...results.map((result) => result.score));
        const min = Math.min(...results.map((result) => result.score));
        const range = max - min || 1;
        return results.map((result) => ({ ...result, score: (result.score - min) / range }));
    };
    const normalizedSemantic = normalize(semantic);
    const normalizedKeyword = normalize(keyword);
    const byUrl = new Map();
    const keywordUrls = new Set(normalizedKeyword.map((result) => result.url));

    for (const result of normalizedSemantic) {
        byUrl.set(result.url, {
            ...result,
            matchedBy: keywordUrls.has(result.url) ? "both" : "semantic",
        });
    }
    for (const result of normalizedKeyword) {
        const existing = byUrl.get(result.url);
        if (existing) {
            if (result.score > existing.score) {
                byUrl.set(result.url, { ...result, matchedBy: "both" });
            }
        } else {
            byUrl.set(result.url, { ...result, matchedBy: "keyword" });
        }
    }
    return [...byUrl.values()].sort((a, b) => b.score - a.score);
}
