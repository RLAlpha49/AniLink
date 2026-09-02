<script setup lang="ts">
/**
 * Semantic search UI for the AniLink docs.
 *
 * Loads the precomputed vector index (`/search-index.json`) and the same
 * `Xenova/bge-small-en-v1.5` model used at build time, embeds the query
 * in-browser, and ranks chunks by cosine similarity. Results are merged
 * with a lightweight keyword pass over the same index text so exact API
 * names surface instantly while concept queries get meaning-aware matches.
 *
 * Two-phase results: keyword matches appear immediately (before the model
 * has loaded), then semantic results refine the list once the query vector
 * is computed. A status indicator stays visible throughout so the user
 * always knows whether semantic search is still warming up.
 *
 * Everything browser-only (fetch, dynamic import of the transformers lib,
 * localStorage) is guarded so the component is SSR-safe under VitePress.
 *
 * The multi-megabyte transformers bundle and model weights load lazily on
 * the first submitted query, not on mount. Opening the modal costs
 * only the small index fetch; visitors who never search never download the
 * model. The keyword phase still runs first so results appear while the
 * model warms up, and the model is browser-cached after the first load.
 */
import { onMounted, ref, computed } from "vue";
import { CornerDownLeft, Search, Sparkles } from "@lucide/vue";
import {
    cosineSimilarity,
    mergeResults,
    type ScoredResult,
    type SearchDoc,
    type SearchIndex,
} from "../search-rank";

const props = defineProps<{ open: boolean }>();
const emit = defineEmits<{
    (e: "select", url: string): void;
    (e: "close"): void;
}>();

const query = ref("");
const keywordLoading = ref(false);
const semanticLoading = ref(false);
const semanticReady = ref(false);
const semanticError = ref(false);
const results = ref<ScoredResult[]>([]);
const recent = ref<string[]>([]);
const activeIndex = ref(0);

/** Source-type filters. `null` = all sources enabled. */
const filters = ref<Record<SearchDoc["source"], boolean>>({
    guide: true,
    operation: true,
    typedoc: true,
});

/** Results after applying the source-type filter. */
const filteredResults = computed(() => results.value.filter((r) => filters.value[r.source]));

let index: SearchDoc[] = [];
type Extractor = (
    text: string | string[],
    options?: Record<string, unknown>
) => Promise<{ tolist: () => Float32Array[] }>;
let extractor: Extractor | null = null;

/** True while any search phase is in progress. */
const anyLoading = computed(() => keywordLoading.value || semanticLoading.value);

/** Status line shown beneath the input. */
const statusText = computed(() => {
    if (semanticError.value) return "Semantic unavailable — keyword results only";
    if (semanticLoading.value) return "Warming up semantic search…";
    if (keywordLoading.value) return "Searching…";
    if (query.value && semanticReady.value && results.value.length) return "Semantic results";
    return "";
});

/** Load the JSON index once. */
async function loadIndex(): Promise<void> {
    if (index.length) return;
    const res = await fetch("/search-index.json");
    const json: SearchIndex = (await res.json()) as SearchIndex;
    index = json.docs;
}

/** Load the model once, lazily. Sets `semanticError` on failure. */
async function loadModel(): Promise<void> {
    if (extractor || semanticError.value) return;
    semanticLoading.value = true;
    try {
        const mod = await import("@huggingface/transformers");
        extractor = (await mod.pipeline(
            "feature-extraction",
            "Xenova/bge-small-en-v1.5"
        )) as Extractor;
        semanticReady.value = true;
    } catch {
        semanticError.value = true;
    } finally {
        semanticLoading.value = false;
    }
}

/** Lightweight keyword score over index text (title weighted higher). */
function keywordScore(doc: SearchDoc, q: string): number {
    const title = doc.title.toLowerCase();
    const text = (doc.title + " " + doc.text).toLowerCase();
    const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
    let score = 0;
    for (const t of terms) {
        if (title.includes(t)) score += 3;
        if (text.includes(t)) score += 1;
    }
    return score;
}

/** Run the keyword pass instantly, then the semantic pass when ready. */
async function runSearch(): Promise<void> {
    const q = query.value.trim();
    activeIndex.value = 0;
    if (!q) {
        results.value = [];
        return;
    }

    // Phase 1 — keyword results appear immediately. The index is preloaded
    // on mount, so this usually resolves from the in-memory cache without a
    // network round-trip; if still in flight it waits for the preload.
    keywordLoading.value = true;
    try {
        await loadIndex();
        const keyword: ScoredResult[] = index
            .map((d) => ({
                url: d.url,
                title: d.title,
                text: d.text,
                source: d.source,
                score: keywordScore(d, q),
                matchedBy: "keyword" as const,
            }))
            .filter((r) => r.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, 8);
        results.value = keyword;
    } finally {
        keywordLoading.value = false;
    }

    // Phase 2 — semantic results refine the list once the model is ready.
    if (semanticError.value) return;
    await loadModel();
    if (!extractor) return;
    semanticLoading.value = true;
    try {
        const out = await extractor(q, { pooling: "mean", normalize: true });
        const qvec = Array.from(out.tolist()[0] as Float32Array);
        const semantic: ScoredResult[] = index
            .map((d) => ({
                url: d.url,
                title: d.title,
                text: d.text,
                source: d.source,
                score: d.vector ? cosineSimilarity(qvec, d.vector) : 0,
                matchedBy: "semantic" as const,
            }))
            .sort((a, b) => b.score - a.score)
            .slice(0, 8);
        results.value = mergeResults(semantic, results.value);
        activeIndex.value = 0;
    } finally {
        semanticLoading.value = false;
    }
}

/** Select a result: persist the query as recent, emit the URL. */
function select(url: string): void {
    const q = query.value.trim();
    if (q) {
        recent.value = [q, ...recent.value.filter((r) => r !== q)].slice(0, 5);
        try {
            localStorage.setItem("anilink-search-recent", JSON.stringify(recent.value));
        } catch {
            /* storage may be unavailable; ignore */
        }
    }
    emit("select", url);
}

/** Keyboard navigation: arrows move selection, enter activates. */
function onKeydown(e: KeyboardEvent): void {
    if (!filteredResults.value.length) return;
    if (e.key === "ArrowDown") {
        e.preventDefault();
        activeIndex.value = (activeIndex.value + 1) % filteredResults.value.length;
    } else if (e.key === "ArrowUp") {
        e.preventDefault();
        activeIndex.value =
            (activeIndex.value - 1 + filteredResults.value.length) % filteredResults.value.length;
    } else if (e.key === "Enter") {
        e.preventDefault();
        const r = filteredResults.value[activeIndex.value];
        if (r) select(r.url);
    }
}

onMounted(() => {
    try {
        const saved = localStorage.getItem("anilink-search-recent");
        if (saved) recent.value = JSON.parse(saved) as string[];
    } catch {
        /* ignore */
    }
    // Load only the small JSON index on mount. It is needed for the keyword
    // phase of every search, so pre-fetching it keeps first results instant
    // when the user submits a query. The multi-megabyte transformers bundle
    // and model weights are NOT touched here: `loadModel()` runs lazily from
    // `runSearch()` on the first submitted query, so visitors who
    // never search never pay for the model download.
    void loadIndex();
});

// Keep `props.open` referenced so Vue doesn't tree-shake the prop; the modal
// parent controls mount lifecycle, and we only react when open.
void props;
void emit;
</script>

<template>
    <div class="ss-root">
        <div class="ss-input-row">
            <Search :size="18" aria-hidden="true" class="ss-icon" />
            <input
                v-model="query"
                type="text"
                class="ss-input"
                placeholder="Search the docs… (try “how do I authenticate”)"
                aria-label="Search docs"
                autocomplete="off"
                spellcheck="false"
                @input="runSearch"
                @keydown="onKeydown"
            />
            <kbd class="ss-kbd" aria-hidden="true">↵</kbd>
        </div>

        <div v-if="statusText" class="ss-status" :class="{ 'is-error': semanticError }">
            <span v-if="anyLoading" class="ss-dot" aria-hidden="true"></span>
            <Sparkles
                v-else-if="semanticReady && !semanticError"
                :size="12"
                aria-hidden="true"
                class="ss-status-icon"
            />
            <span class="ss-status-text">{{ statusText }}</span>
        </div>

        <fieldset v-if="query" class="ss-filters" aria-label="Filter results by type">
            <button
                v-for="src in ['guide', 'operation', 'typedoc'] as const"
                :key="src"
                type="button"
                class="ss-filter"
                :class="{ 'is-on': filters[src], [`is-${src}`]: true }"
                :aria-pressed="filters[src]"
                @click="filters[src] = !filters[src]"
            >
                {{ src }}
            </button>
        </fieldset>

        <ul v-if="filteredResults.length" class="ss-list">
            <li
                v-for="(r, i) in filteredResults"
                :key="r.url"
                class="ss-item"
                :style="{ '--ss-i': i }"
            >
                <button
                    type="button"
                    class="ss-result"
                    :class="{ 'is-active': i === activeIndex }"
                    :aria-selected="i === activeIndex"
                    @click="select(r.url)"
                    @mousemove="activeIndex = i"
                >
                    <span class="ss-badges">
                        <span class="ss-badge" :data-source="r.source">{{ r.source }}</span>
                        <span
                            v-if="r.matchedBy !== 'keyword'"
                            class="ss-match"
                            :class="`match-${r.matchedBy}`"
                            :title="
                                r.matchedBy === 'both'
                                    ? 'Matched by keyword and semantic search'
                                    : 'Matched by semantic search'
                            "
                        >
                            <Sparkles :size="10" aria-hidden="true" />
                            <span v-if="r.matchedBy === 'both'" class="ss-match-label">+kw</span>
                        </span>
                    </span>
                    <span class="ss-title">{{ r.title }}</span>
                    <span class="ss-snippet-wrap">
                        <span class="ss-snippet">{{ r.text }}</span>
                    </span>
                    <CornerDownLeft
                        v-if="i === activeIndex"
                        :size="14"
                        aria-hidden="true"
                        class="ss-enter-icon"
                    />
                </button>
            </li>
        </ul>

        <div v-else-if="query && !anyLoading" class="ss-empty">
            <p>No results for “{{ query }}”.</p>
            <a class="ss-empty-link" href="https://github.com/RLAlpha49/AniLink/issues">
                Search GitHub issues →
            </a>
        </div>

        <div v-else-if="!query && recent.length" class="ss-recent">
            <p class="ss-recent-label">Recent searches</p>
            <div class="ss-recent-chips">
                <button
                    v-for="r in recent"
                    :key="r"
                    type="button"
                    class="ss-recent-item"
                    @click="
                        query = r;
                        runSearch();
                    "
                >
                    {{ r }}
                </button>
            </div>
        </div>

        <div v-else-if="!query" class="ss-hint-empty">
            <p>Search across guides, operations, and the API reference.</p>
            <p class="ss-hint-sub">Type a question, a concept, or an API name.</p>
        </div>
    </div>
</template>

<style scoped>
.ss-root {
    display: flex;
    flex-direction: column;
    padding: 16px 16px 8px;
}

/* ---- input ---- */
.ss-input-row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 14px;
    border: 1px solid var(--rd-border);
    border-radius: 12px;
    background: var(--rd-bg-soft);
    transition:
        border-color 0.15s ease,
        box-shadow 0.15s ease;
}
.ss-input-row:focus-within {
    border-color: var(--rd-accent);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--rd-accent) 18%, transparent);
}
.ss-icon {
    color: var(--rd-text-soft);
    flex-shrink: 0;
}
.ss-input {
    flex: 1;
    min-width: 0;
    border: none;
    background: transparent;
    color: var(--rd-text);
    font: inherit;
    font-size: 15px;
    outline: none;
}
.ss-input::placeholder {
    color: var(--rd-text-soft);
    opacity: 0.7;
}
.ss-kbd {
    flex-shrink: 0;
    font-family: "JetBrains Mono", monospace;
    font-size: 11px;
    line-height: 1;
    padding: 4px 6px;
    border-radius: 5px;
    border: 1px solid var(--rd-border);
    background: var(--rd-code-bg);
    color: var(--rd-text-soft);
}

/* ---- status ---- */
.ss-status {
    display: flex;
    align-items: center;
    gap: 7px;
    padding: 8px 4px 2px;
    font-size: 12px;
    color: var(--rd-text-soft);
    min-height: 22px;
}
.ss-status.is-error {
    color: var(--rd-accent);
}
.ss-status-icon {
    color: var(--rd-anilist);
    flex-shrink: 0;
}
.ss-status-text {
    line-height: 1.3;
}
.ss-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--rd-accent);
    flex-shrink: 0;
    animation: ss-pulse 1s ease-in-out infinite;
}
@keyframes ss-pulse {
    0%,
    100% {
        opacity: 0.35;
        transform: scale(0.85);
    }
    50% {
        opacity: 1;
        transform: scale(1.15);
    }
}

/* ---- filters ---- */
.ss-filters {
    display: flex;
    gap: 6px;
    padding: 8px 4px 0;
    margin: 0;
    border: none;
}
.ss-filter {
    font-size: 11px;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    padding: 3px 9px;
    border-radius: 999px;
    border: 1px solid var(--rd-border);
    background: transparent;
    color: var(--rd-text-soft);
    cursor: pointer;
    transition:
        color 0.12s ease,
        border-color 0.12s ease,
        background 0.12s ease;
}
.ss-filter.is-on.is-guide {
    color: var(--rd-anilist);
    border-color: color-mix(in srgb, var(--rd-anilist) 40%, transparent);
    background: var(--rd-anilist-soft);
}
.ss-filter.is-on.is-operation {
    color: var(--rd-mal);
    border-color: color-mix(in srgb, var(--rd-mal) 40%, transparent);
    background: var(--rd-mal-soft);
}
.ss-filter.is-on.is-typedoc {
    color: var(--rd-accent);
    border-color: color-mix(in srgb, var(--rd-accent) 40%, transparent);
    background: color-mix(in srgb, var(--rd-accent) 12%, transparent);
}
.ss-filter:not(.is-on) {
    opacity: 0.5;
}

/* ---- results ---- */
.ss-list {
    list-style: none;
    margin: 6px 0 0;
    padding: 0 0 8px;
    max-height: calc(72vh - 130px);
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 2px;
}
.ss-item {
    animation: ss-rise 0.28s cubic-bezier(0.22, 1, 0.36, 1) both;
    animation-delay: calc(var(--ss-i, 0) * 32ms);
}
@keyframes ss-rise {
    from {
        opacity: 0;
        transform: translateY(6px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}
.ss-result {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 3px;
    width: 100%;
    text-align: left;
    padding: 9px 40px 9px 12px;
    border: 1px solid transparent;
    background: transparent;
    border-radius: 10px;
    cursor: pointer;
    color: inherit;
    transition:
        background 0.12s ease,
        border-color 0.12s ease;
}
.ss-result:hover,
.ss-result.is-active {
    background: color-mix(in srgb, var(--rd-accent) 8%, transparent);
    border-color: color-mix(in srgb, var(--rd-accent) 22%, transparent);
}
.ss-enter-icon {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--rd-text-soft);
    opacity: 0.7;
}
.ss-badges {
    display: flex;
    align-items: center;
    gap: 5px;
}
.ss-badge {
    font-size: 9.5px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    padding: 2px 7px;
    border-radius: 5px;
    background: var(--rd-anilist-soft);
    color: var(--rd-anilist);
}
.ss-badge[data-source="operation"] {
    background: var(--rd-mal-soft);
    color: var(--rd-mal);
}
.ss-badge[data-source="typedoc"] {
    background: color-mix(in srgb, var(--rd-accent) 16%, transparent);
    color: var(--rd-accent);
}
/* Semantic-match indicator: a small sparkles chip on results that the
   semantic pass surfaced (not just keyword). */
.ss-match {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    font-size: 9px;
    font-weight: 600;
    padding: 2px 5px;
    border-radius: 5px;
    color: var(--rd-anilist);
    background: color-mix(in srgb, var(--rd-anilist) 14%, transparent);
    line-height: 1;
}
.ss-match.match-both {
    color: var(--rd-accent);
    background: color-mix(in srgb, var(--rd-accent) 14%, transparent);
}
.ss-match-label {
    text-transform: uppercase;
    letter-spacing: 0.03em;
}
.ss-title {
    min-width: 0;
    max-width: 100%;
    font-weight: 600;
    font-size: 14px;
    color: var(--rd-text);
    line-height: 1.35;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
.ss-snippet-wrap {
    position: relative;
    width: 100%;
    min-width: 0;
    max-width: 100%;
}
.ss-snippet {
    font-size: 12.5px;
    color: var(--rd-text-soft);
    line-height: 1.45;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    max-height: calc(1.45em * 2);
}

/* ---- empty / recent / hint ---- */
.ss-empty,
.ss-recent,
.ss-hint-empty {
    padding: 18px 14px 14px;
    text-align: center;
}
.ss-empty p {
    margin: 0 0 8px;
    font-size: 14px;
    color: var(--rd-text);
}
.ss-empty-link {
    font-size: 13px;
    color: var(--rd-accent);
    text-decoration: none;
}
.ss-empty-link:hover {
    text-decoration: underline;
}
.ss-recent-label,
.ss-hint-empty p {
    margin: 0;
    font-size: 13px;
    color: var(--rd-text-soft);
}
.ss-hint-sub {
    margin-top: 4px !important;
    font-size: 12px;
    opacity: 0.7;
}
.ss-recent-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    justify-content: center;
    margin-top: 10px;
}
.ss-recent-item {
    font-size: 12.5px;
    padding: 5px 11px;
    border: 1px solid var(--rd-border);
    border-radius: 999px;
    background: var(--rd-bg-soft);
    color: var(--rd-text);
    cursor: pointer;
    transition:
        border-color 0.12s ease,
        color 0.12s ease;
}
.ss-recent-item:hover {
    border-color: var(--rd-accent);
    color: var(--rd-accent);
}

/* ---- scrollbar ---- */
.ss-list::-webkit-scrollbar {
    width: 8px;
}
.ss-list::-webkit-scrollbar-thumb {
    background: color-mix(in srgb, var(--rd-text-soft) 30%, transparent);
    border-radius: 4px;
}
.ss-list::-webkit-scrollbar-thumb:hover {
    background: color-mix(in srgb, var(--rd-text-soft) 50%, transparent);
}

@media (prefers-reduced-motion: reduce) {
    .ss-item,
    .ss-dot {
        animation: none;
    }
}
</style>
