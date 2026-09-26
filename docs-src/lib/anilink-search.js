/**
 * AniLink semantic search bridge for TypeDoc pages.
 *
 * TypeDoc ships its own keyword search (a compressed lunr-style index in
 * search.js). This script replaces it with the same semantic search the
 * VitePress docs use: it loads the precomputed `/search-index.json` and the
 * `Xenova/bge-small-en-v1.5` model, embeds the query in-browser, and ranks
 * chunks by cosine similarity. Results show all sources by default, with
 * source-type filters so the user can narrow to guides, operations, or the
 * API reference.
 */
(function () {
    "use strict";

    var SEARCH_MODEL_ID = null;
    var SEARCH_MODEL_REVISION = null;
    var TRANSFORMERS_CDN = null;
    var SEARCH_CORE_ASSET = "anilink-search-core.js";
    var SEARCH_CONFIG_ASSET = "anilink-search-config.js";
    var INDEX_URL = "/search-index.json";
    var searchCore = null;
    var searchCoordinator = null;
    var searchModulesState = "loading";
    var pendingOpen = false;

    var index = [];
    var extractor = null;
    var semanticReady = false;
    var semanticError = false;
    var semanticLoading = false;
    var keywordLoading = false;
    var results = [];
    var activeIndex = 0;
    var filters = { guide: true, operation: true, typedoc: true };

    /**
     * Debounced entry point for the input event. Waits for a typing pause
     * so the keyword phase runs once per pause instead of once per
     * keystroke. Each keystroke would otherwise await a full query
     * embedding on the semantic path.
     */
    function scheduleSearch() {
        searchCoordinator.schedule(function () {
            runSearch();
        });
    }

    var overlay, modal, input, statusEl, listEl, filtersEl;

    /**
     * Active theme for the page. TypeDoc stores its choice as a
     * `data-theme` attribute on `<html>`, and the literal `"os"` resolves
     * to the OS preference. Used to theme the modal overlay's palette.
     */
    function theme() {
        var t = document.documentElement.getAttribute("data-theme") || "os";
        if (t === "os") {
            t = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
        }
        return t;
    }

    /**
     * Fetch and cache `/search-index.json` once per page load. Warns but
     * continues when the index carries a format this runtime predates.
     * Per-doc field sniffing ranks either known format, but it cannot
     * rank an unknown future format, and a visible warning beats
     * silently degraded semantic results.
     */
    async function loadIndex() {
        if (index.length) return;
        var res = await fetch(INDEX_URL);
        var json = await res.json();
        // Per-doc field sniffing (vector vs q/scale) ranks either format, but
        // it cannot rank a format this runtime predates. Warn instead of
        // letting semantic ranking degrade silently.
        if (json.format && json.format !== "float" && json.format !== "int8") {
            console.warn(
                "[anilink-search] unknown search-index format '" +
                    json.format +
                    "'; semantic ranking may be degraded"
            );
        }
        index = json.docs;
    }

    /**
     * Lazily import the transformers library from the CDN and build the
     * feature-extraction pipeline. Any failure is sticky (`semanticError`)
     * so the session degrades to keyword-only results instead of
     * retrying the large download on every keystroke.
     */
    async function loadModel() {
        if (extractor || semanticError) return;
        semanticLoading = true;
        renderStatus();
        try {
            var mod = await import(TRANSFORMERS_CDN);
            extractor = await mod.pipeline("feature-extraction", SEARCH_MODEL_ID, {
                revision: SEARCH_MODEL_REVISION,
            });
            semanticReady = true;
        } catch {
            semanticError = true;
        } finally {
            semanticLoading = false;
            renderStatus();
        }
    }

    /**
     * Two-phase search for the current input value. The keyword phase
     * runs first and uses only the index, so results appear instantly.
     * The semantic phase then embeds the query and merges cosine-ranked
     * results over them. Both phases capture a coordinator token before
     * awaiting and drop stale results, so a slow phase cannot overwrite
     * newer results or clear newer loading flags.
     */
    async function runSearch() {
        var q = input.value.trim();
        var token = searchCoordinator.begin();
        activeIndex = 0;
        if (!q) {
            results = [];
            // The token bump above invalidates any in-flight run, whose
            // finally blocks then skip clearing their own loading flags.
            // Clear both here so the status line drops immediately.
            keywordLoading = false;
            semanticLoading = false;
            renderResults();
            renderStatus();
            return;
        }

        keywordLoading = true;
        renderStatus();
        try {
            await loadIndex();
            if (!searchCoordinator.isCurrent(token)) return;
            var keyword = searchCore.keywordResults(index, q);
            results = keyword;
            renderResults();
        } finally {
            if (searchCoordinator.isCurrent(token)) {
                keywordLoading = false;
                renderStatus();
            }
        }

        if (semanticError) return;
        await loadModel();
        if (!extractor) return;
        if (!searchCoordinator.isCurrent(token)) return;
        semanticLoading = true;
        renderStatus();
        try {
            var out = await extractor(q, { pooling: "mean", normalize: true });
            // A newer keystroke superseded this invocation while the model
            // was embedding; its results are stale, so leave the newer
            // keyword results and any newer semantic pass in place.
            if (!searchCoordinator.isCurrent(token)) return;
            var qvec = Array.from(out.tolist()[0]);
            var semantic = searchCore.semanticResults(index, qvec);
            results = searchCore.mergeResults(semantic, results);
            activeIndex = 0;
            renderResults();
        } finally {
            if (searchCoordinator.isCurrent(token)) {
                semanticLoading = false;
                renderStatus();
            }
        }
    }

    function select(url) {
        closeModal();
        window.location.assign(url);
    }

    function renderStatus() {
        if (!statusEl) return;
        var anyLoading = keywordLoading || semanticLoading;
        var text = "";
        if (semanticError) text = "Semantic unavailable, keyword results only";
        else if (semanticLoading) text = "Warming up semantic search…";
        else if (keywordLoading) text = "Searching…";
        else if (input && input.value.trim() && semanticReady && results.length)
            text = "Semantic results";
        statusEl.style.display = text ? "flex" : "none";
        statusEl.innerHTML = "";
        if (anyLoading) {
            var dot = document.createElement("span");
            dot.className = "as-dot";
            statusEl.appendChild(dot);
        } else if (semanticReady && !semanticError) {
            var sp = document.createElement("span");
            sp.className = "as-spark";
            sp.textContent = "\u2726";
            statusEl.appendChild(sp);
        }
        if (text) {
            var t = document.createElement("span");
            t.textContent = text;
            statusEl.appendChild(t);
        }
    }

    function renderResults() {
        if (!listEl) return;
        var filtered = results.filter(function (r) {
            return filters[r.source];
        });
        listEl.innerHTML = "";
        if (!filtered.length) {
            if (input && input.value.trim()) {
                var empty = document.createElement("div");
                empty.className = "as-empty";
                var p = document.createElement("p");
                p.textContent = 'No results for "' + input.value.trim() + '".';
                empty.appendChild(p);
                listEl.appendChild(empty);
            }
            return;
        }
        filtered.forEach(function (r, i) {
            var li = document.createElement("li");
            li.className = "as-item";
            li.style.setProperty("--as-i", i);
            var btn = document.createElement("button");
            btn.type = "button";
            btn.className = "as-result" + (i === activeIndex ? " is-active" : "");
            btn.setAttribute("aria-selected", i === activeIndex);

            var badges = document.createElement("span");
            badges.className = "as-badges";
            var badge = document.createElement("span");
            badge.className = "as-badge";
            badge.setAttribute("data-source", r.source);
            badge.textContent = r.source;
            badges.appendChild(badge);
            if (r.matchedBy !== "keyword") {
                var match = document.createElement("span");
                match.className = "as-match match-" + r.matchedBy;
                match.textContent = r.matchedBy === "both" ? "\u2726 +kw" : "\u2726";
                match.title =
                    r.matchedBy === "both"
                        ? "Matched by keyword and semantic search"
                        : "Matched by semantic search";
                badges.appendChild(match);
            }
            btn.appendChild(badges);

            var title = document.createElement("span");
            title.className = "as-title";
            title.textContent = r.title;
            btn.appendChild(title);

            var wrap = document.createElement("span");
            wrap.className = "as-snippet-wrap";
            var snip = document.createElement("span");
            snip.className = "as-snippet";
            snip.textContent = r.text;
            wrap.appendChild(snip);
            btn.appendChild(wrap);

            btn.addEventListener("click", function () {
                select(r.url);
            });
            btn.addEventListener("mousemove", function () {
                activeIndex = i;
                renderActive();
            });
            li.appendChild(btn);
            listEl.appendChild(li);
        });
    }

    function renderActive() {
        var items = listEl.querySelectorAll(".as-result");
        items.forEach(function (el, i) {
            el.classList.toggle("is-active", i === activeIndex);
            el.setAttribute("aria-selected", i === activeIndex);
        });
    }

    function renderFilters() {
        if (!filtersEl) return;
        filtersEl.innerHTML = "";
        ["guide", "operation", "typedoc"].forEach(function (src) {
            var btn = document.createElement("button");
            btn.type = "button";
            btn.className = "as-filter is-" + src + (filters[src] ? " is-on" : "");
            btn.textContent = src;
            btn.setAttribute("aria-pressed", filters[src]);
            btn.addEventListener("click", function () {
                filters[src] = !filters[src];
                btn.classList.toggle("is-on", filters[src]);
                btn.setAttribute("aria-pressed", filters[src]);
                renderResults();
            });
            filtersEl.appendChild(btn);
        });
    }

    function buildModal() {
        overlay = document.createElement("div");
        overlay.className = "as-overlay theme-" + theme();
        modal = document.createElement("div");
        modal.className = "as-modal";
        modal.setAttribute("aria-modal", "true");
        modal.setAttribute("aria-label", "Search docs");

        var root = document.createElement("div");
        root.className = "as-root";

        var row = document.createElement("div");
        row.className = "as-input-row";
        var icon = document.createElement("span");
        icon.className = "as-icon";
        icon.textContent = "\u2315";
        row.appendChild(icon);
        input = document.createElement("input");
        input.type = "text";
        input.className = "as-input";
        input.placeholder = "Search the docs\u2026 (try 'how do I authenticate')";
        input.setAttribute("aria-label", "Search docs");
        input.autocomplete = "off";
        input.spellcheck = false;
        var kbd = document.createElement("kbd");
        kbd.className = "as-kbd";
        kbd.textContent = "\u21b5";
        row.appendChild(input);
        row.appendChild(kbd);
        root.appendChild(row);

        statusEl = document.createElement("div");
        statusEl.className = "as-status";
        root.appendChild(statusEl);

        filtersEl = document.createElement("fieldset");
        filtersEl.className = "as-filters";
        filtersEl.setAttribute("aria-label", "Filter results by type");
        root.appendChild(filtersEl);
        renderFilters();

        listEl = document.createElement("ul");
        listEl.className = "as-list";
        root.appendChild(listEl);

        modal.appendChild(root);
        overlay.appendChild(modal);
        overlay.addEventListener("click", function (e) {
            if (e.target === overlay) closeModal();
        });

        input.addEventListener("input", scheduleSearch);
        input.addEventListener("keydown", function (e) {
            var filtered = results.filter(function (r) {
                return filters[r.source];
            });
            if (!filtered.length) return;
            if (e.key === "ArrowDown") {
                e.preventDefault();
                activeIndex = (activeIndex + 1) % filtered.length;
                renderActive();
            } else if (e.key === "ArrowUp") {
                e.preventDefault();
                activeIndex = (activeIndex - 1 + filtered.length) % filtered.length;
                renderActive();
            } else if (e.key === "Enter") {
                e.preventDefault();
                var r = filtered[activeIndex];
                if (r) select(r.url);
            }
        });
    }

    function openModal() {
        if (searchModulesState === "loading") {
            pendingOpen = true;
            return;
        }
        if (searchModulesState !== "ready") return;
        if (!overlay) buildModal();
        overlay.className = "as-overlay theme-" + theme();
        document.body.appendChild(overlay);
        document.body.style.overflow = "hidden";
        requestAnimationFrame(function () {
            if (input) input.focus();
        });
        renderStatus();
        // Preload the search index and the model the moment the modal opens.
        // The index is small and needed for every search (keyword results
        // appear instantly), so it loads first; the model warms up only after
        // the index is ready, so its large download can't starve the index
        // fetch on a slow connection and leave the input unable to show
        // keyword results. The browser caches the model after first load.
        (async function () {
            await loadIndex();
            loadModel();
        })();
    }

    function closeModal() {
        // A pending debounce firing after close would run a search against
        // a detached input; drop it.
        searchCoordinator.clearDebounce();
        pendingOpen = false;
        if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
        document.body.style.overflow = "";
    }

    function neutralizeNativeSearch() {
        var nativeDialog = document.getElementById("tsd-search");
        if (nativeDialog && !nativeDialog.dataset.asHijacked) {
            nativeDialog.dataset.asHijacked = "1";
            nativeDialog.showModal = function () {
                openModal();
            };
            nativeDialog.show = function () {
                openModal();
            };
            nativeDialog.close = function () {};
        }
    }

    function init() {
        document.addEventListener(
            "click",
            function (e) {
                var target = e.target;
                if (!target) return;
                var trigger = target.closest ? target.closest("#tsd-search-trigger") : null;
                if (trigger) {
                    if (searchModulesState === "failed") return;
                    e.preventDefault();
                    e.stopPropagation();
                    openModal();
                }
            },
            true
        );

        window.addEventListener(
            "keydown",
            function (e) {
                var mod = e.metaKey || e.ctrlKey;
                if (mod && e.key.toLowerCase() === "k") {
                    if (searchModulesState === "failed") return;
                    e.preventDefault();
                    e.stopPropagation();
                    if (overlay && overlay.parentNode) closeModal();
                    else if (searchModulesState === "loading" && pendingOpen) pendingOpen = false;
                    else openModal();
                } else if (e.key === "Escape" && overlay && overlay.parentNode) {
                    closeModal();
                } else if (e.key === "Escape" && pendingOpen) {
                    pendingOpen = false;
                    e.preventDefault();
                }
            },
            true
        );
    }

    function openNativeSearch() {
        var nativeDialog = document.getElementById("tsd-search");
        if (nativeDialog && !nativeDialog.open && typeof nativeDialog.showModal === "function") {
            nativeDialog.showModal();
        }
    }

    var bridgeScript = document.getElementById("anilink-search-script");
    if (!bridgeScript || !bridgeScript.src) {
        console.warn("[anilink-search] search bridge script URL is unavailable");
        return;
    }
    var assetUrl = new URL("./", bridgeScript.src);
    var coreUrl = new URL(SEARCH_CORE_ASSET, assetUrl);
    var configUrl = new URL(SEARCH_CONFIG_ASSET, assetUrl);
    // Install handlers synchronously so TypeDoc's native search cannot win a
    // race while the two local ESM assets load.
    init();
    Promise.all([import(coreUrl.href), import(configUrl.href)])
        .then(function (modules) {
            var config = modules[1];
            if (
                typeof config.SEARCH_MODEL_ID !== "string" ||
                !config.SEARCH_MODEL_ID ||
                typeof config.SEARCH_MODEL_REVISION !== "string" ||
                !config.SEARCH_MODEL_REVISION ||
                typeof config.TRANSFORMERS_CDN !== "string" ||
                !/^https:\/\/cdn\.jsdelivr\.net\/npm\/@huggingface\/transformers@\d+\.\d+\.\d+\/dist\/transformers\.min\.js$/.test(
                    config.TRANSFORMERS_CDN
                )
            ) {
                throw new Error("generated search config is incomplete or invalid");
            }
            searchCore = modules[0];
            searchCoordinator = searchCore.createSearchCoordinator();
            SEARCH_MODEL_ID = config.SEARCH_MODEL_ID;
            SEARCH_MODEL_REVISION = config.SEARCH_MODEL_REVISION;
            TRANSFORMERS_CDN = config.TRANSFORMERS_CDN;
            searchModulesState = "ready";
            neutralizeNativeSearch();
            setTimeout(neutralizeNativeSearch, 0);
            setTimeout(neutralizeNativeSearch, 500);
            setTimeout(neutralizeNativeSearch, 1500);
            if (pendingOpen) {
                pendingOpen = false;
                openModal();
            }
        })
        .catch(function (error) {
            searchModulesState = "failed";
            console.error(
                "[anilink-search] failed to load generated search assets " +
                    coreUrl.href +
                    " and " +
                    configUrl.href +
                    "; TypeDoc native search remains available",
                error
            );
            if (pendingOpen) {
                pendingOpen = false;
                openNativeSearch();
            }
        });
})();
