/**
 * AniLink semantic search bridge for TypeDoc pages.
 *
 * TypeDoc ships its own keyword search (a compressed lunr-style index in
 * search.js). This script replaces it with the same semantic search the
 * VitePress docs use: it loads the precomputed `/search-index.json` and the
 * `Xenova/bge-small-en-v1.5` model, embeds the query in-browser, and ranks
 * chunks by cosine similarity. Results are scoped to show all sources, with
 * source-type filters so the user can narrow to guides, operations, or the
 * API reference.
 */
(function () {
    "use strict";

    var MODEL_ID = "Xenova/bge-small-en-v1.5";
    var INDEX_URL = "/search-index.json";
    var STORAGE_KEY = "anilink-search-recent";

    var index = [];
    var extractor = null;
    var semanticReady = false;
    var semanticError = false;
    var semanticLoading = false;
    var keywordLoading = false;
    var results = [];
    var activeIndex = 0;
    var filters = { guide: true, operation: true, typedoc: true };
    var recent = [];

    var overlay, modal, input, statusEl, listEl, filtersEl;

    function theme() {
        var t = document.documentElement.getAttribute("data-theme") || "os";
        if (t === "os") {
            t = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
        }
        return t;
    }

    function cosine(a, b) {
        var dot = 0, na = 0, nb = 0;
        for (var i = 0; i < a.length; i++) {
            dot += a[i] * b[i];
            na += a[i] * a[i];
            nb += b[i] * b[i];
        }
        if (na === 0 || nb === 0) return 0;
        return dot / (Math.sqrt(na) * Math.sqrt(nb));
    }

    function keywordScore(doc, q) {
        var title = doc.title.toLowerCase();
        var text = (doc.title + " " + doc.text).toLowerCase();
        var terms = q.toLowerCase().split(/\s+/).filter(Boolean);
        var score = 0;
        for (var i = 0; i < terms.length; i++) {
            var t = terms[i];
            if (title.indexOf(t) >= 0) score += 3;
            if (text.indexOf(t) >= 0) score += 1;
        }
        return score;
    }

    function mergeResults(semantic, keyword) {
        function norm(arr) {
            if (!arr.length) return arr;
            var max = -Infinity, min = Infinity;
            for (var i = 0; i < arr.length; i++) {
                if (arr[i].score > max) max = arr[i].score;
                if (arr[i].score < min) min = arr[i].score;
            }
            var range = max - min || 1;
            return arr.map(function (r) {
                return Object.assign({}, r, { score: (r.score - min) / range });
            });
        }
        var sem = norm(semantic);
        var key = norm(keyword);
        var keyUrls = {};
        key.forEach(function (r) { keyUrls[r.url] = true; });
        var byUrl = {};
        sem.forEach(function (r) {
            byUrl[r.url] = Object.assign({}, r, {
                matchedBy: keyUrls[r.url] ? "both" : "semantic",
            });
        });
        key.forEach(function (r) {
            if (byUrl[r.url]) {
                if (r.score > byUrl[r.url].score) byUrl[r.url] = Object.assign({}, r, { matchedBy: "both" });
            } else {
                byUrl[r.url] = Object.assign({}, r, { matchedBy: "keyword" });
            }
        });
        return Object.keys(byUrl).map(function (u) { return byUrl[u]; })
            .sort(function (a, b) { return b.score - a.score; });
    }

    async function loadIndex() {
        if (index.length) return;
        var res = await fetch(INDEX_URL);
        var json = await res.json();
        index = json.docs;
    }

    async function loadModel() {
        if (extractor || semanticError) return;
        semanticLoading = true;
        renderStatus();
        try {
            var mod = await import("https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.0.0/dist/transformers.min.js");
            extractor = await mod.pipeline("feature-extraction", MODEL_ID);
            semanticReady = true;
        } catch {
            semanticError = true;
        } finally {
            semanticLoading = false;
            renderStatus();
        }
    }

    async function runSearch() {
        var q = input.value.trim();
        activeIndex = 0;
        if (!q) { results = []; renderResults(); return; }

        keywordLoading = true;
        renderStatus();
        try {
            await loadIndex();
            var keyword = index.map(function (d) {
                return { url: d.url, title: d.title, text: d.text, source: d.source, score: keywordScore(d, q), matchedBy: "keyword" };
            }).filter(function (r) { return r.score > 0; })
              .sort(function (a, b) { return b.score - a.score; })
              .slice(0, 8);
            results = keyword;
            renderResults();
        } finally {
            keywordLoading = false;
            renderStatus();
        }

        if (semanticError) return;
        await loadModel();
        if (!extractor) return;
        semanticLoading = true;
        renderStatus();
        try {
            var out = await extractor(q, { pooling: "mean", normalize: true });
            var qvec = Array.from(out.tolist()[0]);
            var semantic = index.map(function (d) {
                return { url: d.url, title: d.title, text: d.text, source: d.source, score: d.vector ? cosine(qvec, d.vector) : 0, matchedBy: "semantic" };
            }).sort(function (a, b) { return b.score - a.score; }).slice(0, 8);
            results = mergeResults(semantic, results);
            activeIndex = 0;
            renderResults();
        } finally {
            semanticLoading = false;
            renderStatus();
        }
    }

    function select(url) {
        var q = input.value.trim();
        if (q) {
            recent = [q].concat(recent.filter(function (r) { return r !== q; })).slice(0, 5);
            try { localStorage.setItem(STORAGE_KEY, JSON.stringify(recent)); } catch {}
        }
        closeModal();
        window.location.assign(url);
    }

    function renderStatus() {
        if (!statusEl) return;
        var anyLoading = keywordLoading || semanticLoading;
        var text = "";
        if (semanticError) text = "Semantic unavailable — keyword results only";
        else if (semanticLoading) text = "Warming up semantic search…";
        else if (keywordLoading) text = "Searching…";
        else if (input && input.value.trim() && semanticReady && results.length) text = "Semantic results";
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
        var filtered = results.filter(function (r) { return filters[r.source]; });
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
                match.title = r.matchedBy === "both" ? "Matched by keyword and semantic search" : "Matched by semantic search";
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

            btn.addEventListener("click", function () { select(r.url); });
            btn.addEventListener("mousemove", function () { activeIndex = i; renderActive(); });
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
        input.placeholder = "Search the docs\u2026 (try \u201chow do I authenticate\u201d)";
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

        input.addEventListener("input", runSearch);
        input.addEventListener("keydown", function (e) {
            var filtered = results.filter(function (r) { return filters[r.source]; });
            if (!filtered.length) return;
            if (e.key === "ArrowDown") { e.preventDefault(); activeIndex = (activeIndex + 1) % filtered.length; renderActive(); }
            else if (e.key === "ArrowUp") { e.preventDefault(); activeIndex = (activeIndex - 1 + filtered.length) % filtered.length; renderActive(); }
            else if (e.key === "Enter") { e.preventDefault(); var r = filtered[activeIndex]; if (r) select(r.url); }
        });
    }

    function openModal() {
        if (!overlay) buildModal();
        overlay.className = "as-overlay theme-" + theme();
        document.body.appendChild(overlay);
        document.body.style.overflow = "hidden";
        requestAnimationFrame(function () { if (input) input.focus(); });
        renderStatus();
        // Preload the search index and the model the moment the modal opens.
        // The index is small and needed for every search (keyword results
        // appear instantly), so it loads first; the model warms up only after
        // the index is ready, so its large download can't starve the index
        // fetch on a slow connection and leave the input unable to show
        // keyword results. The model is browser-cached after first load.
        (async function () {
            await loadIndex();
            loadModel();
        })();
    }

    function closeModal() {
        if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
        document.body.style.overflow = "";
    }

    function neutralizeNativeSearch() {
        var nativeDialog = document.getElementById("tsd-search");
        if (nativeDialog && !nativeDialog.dataset.asHijacked) {
            nativeDialog.dataset.asHijacked = "1";
            nativeDialog.showModal = function () { openModal(); };
            nativeDialog.show = function () { openModal(); };
            nativeDialog.close = function () {};
        }
    }

    function init() {
        document.addEventListener("click", function (e) {
            var target = e.target;
            if (!target) return;
            var trigger = target.closest ? target.closest("#tsd-search-trigger") : null;
            if (trigger) {
                e.preventDefault();
                e.stopPropagation();
                openModal();
            }
        }, true);

        neutralizeNativeSearch();
        setTimeout(neutralizeNativeSearch, 0);
        setTimeout(neutralizeNativeSearch, 500);
        setTimeout(neutralizeNativeSearch, 1500);

        window.addEventListener("keydown", function (e) {
            var mod = e.metaKey || e.ctrlKey;
            if (mod && e.key.toLowerCase() === "k") {
                e.preventDefault();
                if (overlay && overlay.parentNode) closeModal();
                else openModal();
            } else if (e.key === "Escape" && overlay && overlay.parentNode) {
                closeModal();
            }
        });
        try {
            var saved = localStorage.getItem(STORAGE_KEY);
            if (saved) recent = JSON.parse(saved);
        } catch {}
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
