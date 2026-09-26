/** Public search-ranking exports used by the indexer and docs UI. */

export {
    cosineSimilarity,
    createSearchCoordinator,
    dequantizeVector,
    docVector,
    keywordResults,
    keywordScore,
    mergeResults,
    quantizeVector,
    semanticResults,
    type ScoredResult,
    type SearchCoordinator,
    type SearchDoc,
    type SearchIndex,
    type SearchIndexFormat,
    type SearchVector,
} from "./search-core.js";

/**
 * The embedding model used by the semantic search, shared verbatim by the
 * build-time indexer (`scripts/generate-search-index.ts`), the VitePress
 * search UI (`SemanticSearch.vue`), and the TypeDoc search bridge
 * (`anilink-search.js`). All three must embed with the same weights or
 * cosine rankings silently degrade, so the id and revision are defined
 * here, the one module every consumer already imports.
 */
export const SEARCH_MODEL_ID = "Xenova/bge-small-en-v1.5";

/**
 * Pinned model revision. Pinning keeps build-time and browser embeddings
 * byte-identical across deploys; every consumer (the build indexer, the
 * VitePress search UI, the TypeDoc bridge, and the CI model cache key)
 * must reference this same constant or cosine rankings silently degrade.
 */
export const SEARCH_MODEL_REVISION = "ea104dacec62c0de699686887e3f920caeb4f3e3";

/**
 * Escape characters that could be interpreted as HTML markup in text content.
 *
 * This function encodes ampersands first so the entities added for angle
 * brackets are not encoded a second time.
 *
 * @param s Text to escape.
 * @returns Text safe to insert as HTML text content.
 */
export function escapeHtml(s: string): string {
    return s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}
