<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useData, useRoute, withBase } from "vitepress";
import { NAV_GROUPS, flatPages, neighborsOf, type DocPage } from "../../lib/content";
import { normalizePath } from "../../lib/routes";
import {
    selectTocEntryColorProgress,
    useHeadingScrollSpy,
    type PageHeading,
} from "../../lib/useHeadingScrollSpy";
import {
    ArrowLeft,
    ArrowRight,
    ArrowUpRight,
    Disc,
    List,
    Menu,
    Minus,
    Moon,
    Search,
    Square,
    Sun,
} from "@lucide/vue";
import Home from "../../lib/components/Home.vue";
import SearchModal from "../../lib/components/SearchModal.vue";
import NotFound from "./NotFound.vue";

const searchModal = ref<InstanceType<typeof SearchModal> | null>(null);

const route = useRoute();
const { page } = useData();

const isNotFound = computed(() => page.value?.isNotFound === true);
const isLanding = computed(() => normalizePath(route.path) === "/");

const sidebarOpen = ref(false);

/** Reset the reading column to the top whenever the page changes. */
function resetScrollToTop(): void {
    if (typeof window === "undefined") return;
    const container = document.querySelector<HTMLElement>(".docs-columns");
    if (container) {
        container.scrollTo({ top: 0, left: 0, behavior: "auto" });
    } else {
        window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }
}

watch(
    () => route.path,
    () => {
        sidebarOpen.value = false;
        resetScrollToTop();
    }
);

/** Offset for the sticky header so scrolled-to headings are not hidden. */
const HEADING_SCROLL_OFFSET = 80;

/** Smoothly scroll a heading into view inside the reading column. */
function scrollToHeading(id: string, event?: MouseEvent): void {
    if (typeof window === "undefined") return;
    const target = document.getElementById(id);
    if (!target) return;

    if (event) {
        event.preventDefault();
    }

    const container = document.querySelector<HTMLElement>(".docs-columns");
    if (container) {
        const top =
            target.getBoundingClientRect().top -
            container.getBoundingClientRect().top +
            container.scrollTop -
            HEADING_SCROLL_OFFSET;
        container.scrollTo({ top, behavior: "smooth" });
    } else {
        window.scrollTo({
            top: target.getBoundingClientRect().top + window.scrollY - HEADING_SCROLL_OFFSET,
            behavior: "smooth",
        });
    }

    // Reflect the target in the URL without adding a history entry or jumping.
    if (typeof history !== "undefined") {
        history.replaceState(null, "", `#${id}`);
    }
}

/* ---------------- theme (light/dark) ---------------- */

type Theme = "light" | "dark";
const STORAGE_KEY = "anilink-docs-theme";

function readInitialTheme(): Theme {
    if (typeof document !== "undefined" && document.documentElement.classList.contains("dark")) {
        return "dark";
    }
    return "light";
}

const theme = ref<Theme>(readInitialTheme());

function applyTheme(t: Theme): void {
    if (typeof document === "undefined") return;
    document.documentElement.classList.toggle("dark", t === "dark");
}

function toggleTheme(): void {
    theme.value = theme.value === "light" ? "dark" : "light";
}

watch(theme, (t) => {
    applyTheme(t);
    if (typeof localStorage !== "undefined") {
        try {
            localStorage.setItem(STORAGE_KEY, t);
        } catch {
            /* storage may be unavailable; ignore */
        }
    }
});

/* ---------------- page model ---------------- */

const pageHeaders = computed<PageHeading[]>(() => {
    const headers = (page.value?.headers ?? []) as Array<{
        title: string;
        link: string;
        level: number;
    }>;
    return headers
        .filter((h) => h.level === 2 || h.level === 3)
        .map((h) => ({ id: h.link.replace(/^#/, ""), title: h.title, level: h.level }));
});

const {
    headings: tocHeaders,
    scrollProgress,
    scrollViewport,
    activeHeadingId,
} = useHeadingScrollSpy(pageHeaders);

const tocList = ref<HTMLDivElement | null>(null);
const entryTops = ref<number[]>([]);
const entryHeights = ref<number[]>([]);
let resizeObserver: ResizeObserver | null = null;
let measureFrame: number | null = null;
const tocListHeight = computed(() => {
    const list = tocList.value;
    const lastTop = entryTops.value[entryTops.value.length - 1] ?? 0;
    const lastHeight = entryHeights.value[entryHeights.value.length - 1] ?? 0;
    const measuredHeight = lastTop + lastHeight;
    return Math.max(list?.scrollHeight ?? 0, measuredHeight);
});

/** Convert heading-index progress into a measured pixel offset in the TOC. */
function tocOffsetAtProgress(progress: number): number {
    const tops = entryTops.value;
    const heights = entryHeights.value;
    const listHeight = tocListHeight.value;
    if (tops.length === 0 || heights.length !== tops.length || listHeight <= 0) {
        return 0;
    }

    const clamped = Math.min(1, Math.max(0, progress));
    if (tops.length === 1) {
        return clamped === 1 ? listHeight : tops[0];
    }
    if (clamped === 1) {
        return listHeight;
    }

    const scaled = clamped * (tops.length - 1);
    const index = Math.floor(scaled);
    const localProgress = scaled - index;
    return tops[index] + (tops[index + 1] - tops[index]) * localProgress;
}

const indicatorBounds = computed(() => ({
    top: tocOffsetAtProgress(scrollViewport.value.start),
    bottom: tocOffsetAtProgress(scrollViewport.value.end),
}));

const tocEntryStyles = computed<Record<string, string>[]>(() =>
    selectTocEntryColorProgress(entryTops.value, entryHeights.value, tocListHeight.value, {
        start: indicatorBounds.value.top / Math.max(1, tocListHeight.value),
        end: indicatorBounds.value.bottom / Math.max(1, tocListHeight.value),
    }).map((progress) => ({
        color: `color-mix(in srgb, var(--rd-accent) ${(progress * 100).toFixed(2)}%, var(--rd-text-soft))`,
    }))
);

/** Measure each TOC entry's offset and height relative to the list wrapper. */
function measureEntries(): void {
    const list = tocList.value;
    if (!list || typeof window === "undefined") {
        return;
    }
    const listTop = list.getBoundingClientRect().top;
    const items = Array.from(list.querySelectorAll<HTMLLIElement>("li"));
    entryTops.value = items.map((item) => item.getBoundingClientRect().top - listTop);
    entryHeights.value = items.map((item) => item.getBoundingClientRect().height);
}

function scheduleMeasure(): void {
    if (measureFrame !== null || typeof window === "undefined") {
        return;
    }
    if (typeof window.requestAnimationFrame !== "function") {
        measureEntries();
        return;
    }
    measureFrame = window.requestAnimationFrame(() => {
        measureFrame = null;
        measureEntries();
    });
}

/**
 * Vertical position and height of the TOC viewport marker. It represents the
 * same percentage of the document that is currently visible in the reader.
 */
const indicatorStyle = computed<Record<string, string>>(() => {
    const tops = entryTops.value;
    const heights = entryHeights.value;
    if (tops.length === 0 || heights.length !== tops.length) {
        return { display: "none" };
    }

    return {
        transform: `translateY(${indicatorBounds.value.top.toFixed(2)}px)`,
        height: `${(indicatorBounds.value.bottom - indicatorBounds.value.top).toFixed(2)}px`,
    };
});

/**
 * Translate the TOC list so it scrolls in sync with the page like a minimap.
 * The on-screen region of the page stays in view in the TOC: when the TOC is
 * taller than its own viewport, the list shifts proportionally to the page's
 * scroll progress so the currently visible entries track the page.
 */
const tocListStyle = computed<Record<string, string>>(() => {
    const list = tocList.value;
    if (!list || typeof window === "undefined") {
        return {};
    }
    const overflow = list.scrollHeight - list.clientHeight;
    if (overflow <= 0) {
        return {};
    }
    const y = overflow * scrollProgress.value;
    return { transform: `translateY(-${y.toFixed(2)}px)` };
});

onMounted(() => {
    if (typeof window === "undefined") {
        return;
    }
    nextTick(() => measureEntries());
    if (typeof ResizeObserver !== "undefined" && tocList.value) {
        resizeObserver = new ResizeObserver(() => scheduleMeasure());
        resizeObserver.observe(tocList.value);
    }
});

onBeforeUnmount(() => {
    resizeObserver?.disconnect();
    resizeObserver = null;
    if (measureFrame !== null && typeof window !== "undefined") {
        window.cancelAnimationFrame(measureFrame);
        measureFrame = null;
    }
});

// Re-measure when the set of TOC entries changes (page navigation).
watch(tocHeaders, () => {
    nextTick(() => measureEntries());
});

const showToc = computed(() => tocHeaders.value.length > 0 && !isLanding.value);

/* Reflect the active heading in the URL hash as the reader scrolls, so the
   address bar and the on-screen section stay in sync. Skipped on landing and
   when no heading is active (e.g. at the very top). */
watch(activeHeadingId, (id) => {
    if (typeof window === "undefined" || typeof history === "undefined") return;
    if (!id || isLanding.value) return;
    // Avoid clobbering a hash the user just clicked to (smooth-scroll handles it).
    if (window.location.hash === `#${id}`) return;
    history.replaceState(null, "", `#${id}`);
});

const current = computed<DocPage | undefined>(() =>
    flatPages(NAV_GROUPS.flatMap((g) => g.pages)).find((p) => p.path === normalizePath(route.path))
);
const pager = computed(() => (current.value ? neighborsOf(current.value.path) : {}));
</script>

<template>
    <div class="docs">
        <a class="docs-skip" href="#docs-content">Skip to content</a>

        <div class="docs-body">
            <header class="docs-top">
                <div class="docs-brand">
                    <button
                        type="button"
                        class="docs-menu"
                        aria-label="Toggle navigation"
                        @click="sidebarOpen = !sidebarOpen"
                    >
                        <Menu :size="18" aria-hidden="true" />
                    </button>
                    <a class="docs-brand-mark" :href="withBase('/')" aria-label="AniLink home">
                        墨
                    </a>
                    <a class="docs-brand-name" :href="withBase('/')">AniLink</a>
                    <span class="docs-brand-vert" aria-hidden="true">アニリンク文書</span>
                </div>
                <div class="docs-top-actions">
                    <div class="docs-top-links">
                        <a :href="withBase('/typedoc/')" target="_self">
                            API <ArrowUpRight :size="13" aria-hidden="true" />
                        </a>
                        <a href="https://github.com/RLAlpha49/AniLink">
                            GitHub <ArrowUpRight :size="13" aria-hidden="true" />
                        </a>
                    </div>
                    <button
                        type="button"
                        class="docs-search-trigger"
                        aria-label="Search docs"
                        title="Search (Ctrl+K)"
                        @click="searchModal?.openModal()"
                    >
                        <Search :size="16" aria-hidden="true" />
                    </button>
                    <button
                        type="button"
                        class="docs-theme-toggle"
                        :aria-label="`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`"
                        :title="`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`"
                        @click="toggleTheme"
                    >
                        <Moon v-if="theme === 'light'" :size="17" aria-hidden="true" />
                        <Sun v-else :size="17" aria-hidden="true" />
                    </button>
                </div>
            </header>

            <div class="docs-columns">
                <aside class="docs-rail" :class="{ 'is-open': sidebarOpen }">
                    <nav class="docs-nav" aria-label="Documentation">
                        <div v-for="group in NAV_GROUPS" :key="group.title" class="docs-nav-group">
                            <p class="docs-nav-title">{{ group.title }}</p>
                            <ul>
                                <li v-for="p in group.pages" :key="p.path">
                                    <a
                                        :href="withBase(p.path)"
                                        class="docs-nav-link"
                                        :class="{
                                            active:
                                                current?.path === p.path ||
                                                (p.children &&
                                                    p.children.some(
                                                        (c) => c.path === current?.path
                                                    )),
                                        }"
                                        :aria-current="
                                            current?.path === p.path ? 'page' : undefined
                                        "
                                    >
                                        <span
                                            v-if="p.provider === 'anilist'"
                                            class="docs-provider docs-provider--icon"
                                            :class="p.provider"
                                            ><Disc
                                                :size="11"
                                                :stroke-width="2.5"
                                                aria-hidden="true"
                                        /></span>
                                        <span
                                            v-else-if="p.provider === 'mal'"
                                            class="docs-provider docs-provider--icon"
                                            :class="p.provider"
                                            ><Square
                                                :size="11"
                                                :stroke-width="2.5"
                                                aria-hidden="true"
                                        /></span>
                                        <span
                                            v-else
                                            class="docs-provider docs-provider--icon docs-provider--dot"
                                            ><Minus
                                                :size="13"
                                                :stroke-width="2.5"
                                                aria-hidden="true"
                                        /></span>
                                        {{ p.title }}
                                    </a>
                                    <ul v-if="p.children && p.children.length" class="docs-nav-sub">
                                        <li v-for="child in p.children" :key="child.path">
                                            <a
                                                :href="withBase(child.path)"
                                                class="docs-nav-link docs-nav-link--sub"
                                                :class="{
                                                    active: current?.path === child.path,
                                                }"
                                                :aria-current="
                                                    current?.path === child.path
                                                        ? 'page'
                                                        : undefined
                                                "
                                            >
                                                <span
                                                    v-if="p.provider === 'anilist'"
                                                    class="docs-provider docs-provider--icon"
                                                    :class="p.provider"
                                                    ><Disc
                                                        :size="11"
                                                        :stroke-width="2.5"
                                                        aria-hidden="true"
                                                /></span>
                                                {{ child.title }}
                                            </a>
                                        </li>
                                    </ul>
                                </li>
                            </ul>
                        </div>
                    </nav>

                    <div class="docs-rail-foot">
                        <a :href="withBase('/typedoc/')" target="_self">
                            API <ArrowUpRight :size="13" aria-hidden="true" />
                        </a>
                        <a href="https://github.com/RLAlpha49/AniLink">
                            GitHub <ArrowUpRight :size="13" aria-hidden="true" />
                        </a>
                    </div>
                </aside>

                <main
                    id="docs-content"
                    class="docs-main"
                    :class="{ 'docs-main--landing': isLanding }"
                >
                    <Home v-if="isLanding" />
                    <NotFound v-else-if="isNotFound" />
                    <article v-else class="doc-content docs-doc">
                        <Content />
                    </article>

                    <nav v-if="pager.prev || pager.next" class="docs-pager" aria-label="Pager">
                        <a
                            v-if="pager.prev"
                            class="docs-pager-link"
                            :href="withBase(pager.prev.path)"
                        >
                            <span class="docs-pager-dir">
                                <ArrowLeft :size="14" aria-hidden="true" /> 前の頁
                            </span>
                            <strong>{{ pager.prev.title }}</strong>
                        </a>
                        <span v-else></span>
                        <a
                            v-if="pager.next"
                            class="docs-pager-link docs-pager-link--next"
                            :href="withBase(pager.next.path)"
                        >
                            <span class="docs-pager-dir">
                                次の頁 <ArrowRight :size="14" aria-hidden="true" />
                            </span>
                            <strong>{{ pager.next.title }}</strong>
                        </a>
                    </nav>

                    <footer class="docs-foot">
                        <p>AniLink — typed AniList & MyAnimeList client for TypeScript.</p>
                    </footer>
                </main>

                <aside v-if="showToc" class="docs-toc" aria-label="On this page">
                    <p class="docs-toc-title">
                        <List :size="14" aria-hidden="true" /> 目次 · Contents
                    </p>
                    <div class="docs-toc-viewport">
                        <div class="docs-toc-list" ref="tocList" :style="tocListStyle">
                            <span
                                class="docs-toc-indicator"
                                :style="indicatorStyle"
                                aria-hidden="true"
                            ></span>
                            <ul>
                                <li v-for="(h, i) in tocHeaders" :key="h.id">
                                    <a
                                        :href="`#${h.id}`"
                                        :style="tocEntryStyles[i]"
                                        :class="[`depth-${h.level}`]"
                                        @click="scrollToHeading(h.id, $event)"
                                        >{{ h.title }}</a
                                    >
                                </li>
                            </ul>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    </div>
    <SearchModal ref="searchModal" />
</template>

<style scoped>
/* ------------------------------------------------------------------ */
/* Theme tokens — light (Sumi, 墨) and dark (Yoru, 夜)                */
/* ------------------------------------------------------------------ */

.docs {
    --docs-top-height: 3.75rem;

    height: 100vh;
    height: 100dvh;
    min-height: 0;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    color: var(--rd-text);
    font-family: "IBM Plex Sans", "Segoe UI", system-ui, sans-serif;
    background:
        radial-gradient(1100px 500px at 85% -5%, rgba(199, 62, 46, 0.05), transparent 60%),
        radial-gradient(900px 600px at -10% 105%, rgba(33, 31, 26, 0.05), transparent 55%),
        var(--rd-bg);
}

html.dark .docs {
    background:
        radial-gradient(900px 520px at 82% -8%, rgba(201, 168, 106, 0.1), transparent 60%),
        radial-gradient(820px 600px at -8% 108%, rgba(110, 231, 210, 0.06), transparent 55%),
        var(--rd-bg);
}

/* paper / night grain */
.docs::before {
    content: "";
    position: fixed;
    inset: 0;
    pointer-events: none;
    opacity: 0.45;
    background-image: radial-gradient(var(--rd-grain) 1px, transparent 1px);
    background-size: 5px 5px;
    z-index: 0;
}

.docs > * {
    position: relative;
    z-index: 1;
}

.docs-skip {
    position: absolute;
    left: -9999px;
    top: 0;
    background: var(--rd-text);
    color: var(--rd-bg);
    padding: 0.5rem 1rem;
    z-index: 100;
}

.docs-skip:focus {
    left: 0;
}

/* ---------------- left rail ---------------- */

.docs-rail {
    width: 264px;
    flex-shrink: 0;
    position: sticky;
    top: 0;
    align-self: flex-start;
    border-right: 1px solid var(--rd-border);
    padding: 1.5rem 1.25rem 1.5rem 1.5rem;
    height: 100%;
    max-height: 100%;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
}

html.dark .docs .docs-rail {
    background: linear-gradient(180deg, rgba(22, 26, 38, 0.5), transparent 40%);
}

.docs-brand {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    flex-shrink: 0;
}

.docs-brand-mark {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 2.3rem;
    height: 2.3rem;
    border: 1.5px solid var(--rd-text);
    color: var(--rd-text);
    font-family: "Zen Old Mincho", "Shippori Mincho", serif;
    font-size: 1.25rem;
    font-weight: 700;
    text-decoration: none;
    background: var(--rd-bg);
}

html.dark .docs .docs-brand-mark {
    border-color: var(--rd-accent);
    color: var(--rd-accent);
    box-shadow: 0 0 14px rgba(201, 168, 106, 0.25);
}

.docs-brand-name {
    font-family: "Zen Old Mincho", "Shippori Mincho", serif;
    font-weight: 700;
    font-size: 1.15rem;
    letter-spacing: 0.04em;
    color: var(--rd-text);
    text-decoration: none;
}

.docs-brand-vert {
    writing-mode: vertical-rl;
    color: var(--rd-text-soft);
    font-family: "Zen Old Mincho", "Shippori Mincho", serif;
    font-size: 0.68rem;
    letter-spacing: 0.35em;
    opacity: 0.75;
}

.docs-top .docs-brand-vert {
    position: static;
    margin-left: 0.35rem;
    padding-left: 0.75rem;
    border-left: 1px solid var(--rd-border);
    writing-mode: horizontal-tb;
    font-size: 0.62rem;
    letter-spacing: 0.18em;
    white-space: nowrap;
}

.docs-nav {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 1.1rem;
}

.docs-nav-group {
    border-top: 1px solid var(--rd-border);
    padding-top: 0.8rem;
}

.docs-nav-title {
    margin: 0 0 0.4rem;
    font-family: "Zen Old Mincho", "Shippori Mincho", serif;
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--rd-text-soft);
}

.docs-nav ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
}

.docs-nav-link {
    display: flex;
    align-items: baseline;
    gap: 0.45rem;
    padding: 0.28rem 0.5rem;
    font-size: 0.86rem;
    color: var(--rd-text-soft);
    text-decoration: none;
    border-left: 2px solid transparent;
    transition:
        color 0.15s ease,
        border-color 0.15s ease;
}

.docs-nav-link:hover {
    color: var(--rd-text);
    text-decoration: none;
    background: color-mix(in srgb, var(--rd-text) 4%, transparent);
}

.docs-nav-link.active {
    color: var(--rd-text);
    font-weight: 600;
    border-left-color: var(--rd-accent);
    background: linear-gradient(
        to right,
        color-mix(in srgb, var(--rd-accent) 8%, transparent),
        transparent 70%
    );
}

li .docs-nav-sub {
    list-style: none;
    margin: 0.1rem 0 0.3rem 1.1rem;
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
}

.docs-nav-link--sub {
    padding: 0.22rem 0.5rem;
    font-size: 0.82rem;
}

.docs-provider {
    font-size: 0.72rem;
    font-weight: 700;
    color: var(--rd-anilist);
}

.docs-provider.mal {
    color: var(--rd-mal);
}

.docs-provider--dot {
    color: var(--rd-border);
}

.docs-provider--icon {
    display: inline-flex;
    align-items: center;
    width: 1.1em;
    height: 1.1em;
    margin-right: 0.35em;
    vertical-align: -0.18em;
}

.docs-provider--icon svg {
    width: 100%;
    height: 100%;
}

.docs-rail-foot {
    display: flex;
    gap: 1rem;
    font-size: 0.8rem;
    border-top: 1px solid var(--rd-border);
    padding-top: 0.9rem;
}

.docs-rail-foot a {
    display: inline-flex;
    align-items: center;
    gap: 0.2em;
    color: var(--rd-text-soft);
    text-decoration: none;
}

.docs-rail-foot a:hover {
    color: var(--rd-accent);
}

/* ---------------- body ---------------- */

.docs-body {
    flex: 1;
    min-width: 0;
    min-height: 0;
    width: 100%;
    overflow: hidden;
    display: flex;
    flex-direction: column;
}

.docs-top {
    flex: 0 0 var(--docs-top-height);
    width: 100%;
    display: flex;
    align-items: center;
    gap: 1rem;
    min-height: var(--docs-top-height);
    padding: 0.8rem 2rem;
    border-bottom: 1px solid var(--rd-border);
    position: relative;
    top: 0;
    background: color-mix(in srgb, var(--rd-bg) 88%, transparent);
    backdrop-filter: blur(6px);
    z-index: 10;
}

.docs-top-actions {
    margin-left: auto;
    display: flex;
    align-items: center;
    gap: 1rem;
}

.docs-menu {
    display: none;
    border: 1px solid var(--rd-border);
    background: none;
    color: var(--rd-text);
    width: 2rem;
    height: 2rem;
    cursor: pointer;
}

.docs-top-links {
    display: flex;
    gap: 1rem;
    font-size: 0.8rem;
}

.docs-top-links a {
    display: inline-flex;
    align-items: center;
    gap: 0.2em;
    color: var(--rd-text-soft);
    text-decoration: none;
}

.docs-top-links a:hover {
    color: var(--rd-accent);
}

.docs-search-trigger {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
    border: 1px solid var(--rd-border);
    background: none;
    color: var(--rd-text-soft);
    cursor: pointer;
    border-radius: 4px;
    transition:
        color 0.15s ease,
        border-color 0.15s ease;
}

.docs-search-trigger:hover {
    color: var(--rd-accent);
    border-color: var(--rd-accent);
}

.docs-theme-toggle {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
    border: 1px solid var(--rd-border);
    background: none;
    color: var(--rd-text-soft);
    cursor: pointer;
    border-radius: 4px;
    transition:
        color 0.15s ease,
        border-color 0.15s ease;
}

.docs-theme-toggle:hover {
    color: var(--rd-accent);
    border-color: var(--rd-accent);
}

.docs-columns {
    display: flex;
    flex: 1;
    width: 100%;
    min-height: 0;
    align-items: flex-start;
    overflow-x: hidden;
    overflow-y: auto;
}

.docs-main {
    flex: 1;
    min-width: 0;
    width: 100%;
    max-width: min(90%, 52rem);
    margin: 0 auto;
    padding: 2.5rem 2.5rem 3rem;
}

/* The landing page breaks out of the constrained reading column into a
   full-width editorial composition rendered by Home.vue. */
.docs-main--landing {
    max-width: 100%;
    margin: 0;
    padding: 0;
}

/* ---------------- hero ---------------- */

.docs-hero {
    padding-top: 2rem;
}

.docs-hero-kicker {
    font-size: 0.75rem;
    letter-spacing: 0.3em;
    text-transform: uppercase;
    color: var(--rd-accent);
    margin: 0 0 1rem;
}

.docs-hero-title {
    font-family: "Zen Old Mincho", "Shippori Mincho", serif;
    font-size: clamp(3rem, 8vw, 4.6rem);
    font-weight: 900;
    letter-spacing: 0.02em;
    margin: 0 0 1.25rem;
    line-height: 1;
}

html.dark .docs .docs-hero-title {
    font-weight: 800;
    text-shadow: 0 0 40px rgba(201, 168, 106, 0.2);
}

.docs-hero-lede {
    font-size: 1.08rem;
    line-height: 1.8;
    color: var(--rd-text-soft);
    max-width: 34em;
    margin: 0 0 1.75rem;
}

.docs-hero-actions {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
    margin-bottom: 2.5rem;
}

.docs-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    padding: 0.55rem 1.3rem;
    border: 1.5px solid var(--rd-text);
    color: var(--rd-text);
    text-decoration: none;
    font-weight: 600;
    font-size: 0.9rem;
    transition:
        background 0.15s ease,
        color 0.15s ease;
}

.docs-btn:hover {
    text-decoration: none;
    background: color-mix(in srgb, var(--rd-text) 6%, transparent);
}

.docs-btn--solid {
    background: var(--rd-text);
    color: var(--rd-bg);
}

.docs .docs-btn--solid:hover {
    background: #000;
}

html.dark .docs .docs-btn--solid {
    background: var(--rd-accent);
    color: var(--rd-bg);
    border-color: var(--rd-accent);
}

html.dark .docs .docs-btn--solid:hover {
    background: #e0bd84;
    border-color: #e0bd84;
}

/* ---------------- document ---------------- */

.docs-doc {
    font-size: 0.95rem;
    line-height: 1.85;
}

.docs-doc :deep(h1) {
    font-family: "Zen Old Mincho", "Shippori Mincho", serif;
    font-size: 2.3rem;
    font-weight: 900;
    margin: 0 0 1.25rem;
    padding-bottom: 0.9rem;
    position: relative;
}

html.dark .docs .docs-doc :deep(h1) {
    font-weight: 800;
}

.docs-doc :deep(h1)::after {
    content: "";
    position: absolute;
    left: 0;
    bottom: 0;
    width: 88px;
    height: 5px;
    background: var(--rd-accent);
    border-radius: 999px 999px 999px 2px;
    transform: rotate(-0.6deg);
}

html.dark .docs .docs-doc :deep(h1)::after {
    box-shadow: 0 0 12px rgba(201, 168, 106, 0.5);
}

.docs-doc :deep(h2) {
    font-family: "Zen Old Mincho", "Shippori Mincho", serif;
    font-size: 1.5rem;
    font-weight: 700;
    margin: 2.6rem 0 0.8rem;
    padding-top: 1.1rem;
    border-top: 1px solid var(--rd-border);
}

.docs-doc :deep(h3) {
    font-size: 1.12rem;
    font-weight: 600;
    margin: 1.8rem 0 0.5rem;
}

.docs-doc :deep(p) {
    margin: 0.7rem 0;
}

.docs-doc :deep(a) {
    color: var(--rd-anilist);
    text-decoration: underline;
    text-decoration-color: color-mix(in srgb, var(--rd-anilist) 40%, transparent);
    text-underline-offset: 3px;
}

.docs-doc :deep(a:hover) {
    color: var(--rd-accent);
    text-decoration-color: var(--rd-accent);
}

.docs-doc :deep(code) {
    font-family: "JetBrains Mono", monospace;
    font-size: 0.84em;
    background: var(--rd-code-bg);
    border: 1px solid var(--rd-border);
    padding: 0.1em 0.35em;
}

.docs-doc :deep(pre) {
    background: var(--rd-code-bg);
    color: var(--rd-text);
}

.docs-doc :deep(pre code),
.docs :deep(.al-code-content pre code) {
    background: transparent;
    border: 0;
    padding: 0;
    font-size: inherit;
}

.docs-doc :deep(blockquote) {
    margin: 1.25rem 0;
    padding: 0.4rem 1.1rem;
    border-left: 3px solid var(--rd-accent);
    color: var(--rd-text-soft);
    background: linear-gradient(
        to right,
        color-mix(in srgb, var(--rd-accent) 6%, transparent),
        transparent 70%
    );
}

.docs-doc :deep(th) {
    background: var(--rd-bg-soft);
    font-family: "Zen Old Mincho", "Shippori Mincho", serif;
}

.docs-doc :deep(td),
.docs-doc :deep(th) {
    border-bottom: 1px solid var(--rd-border);
}

.docs-doc :deep(table) {
    border: 1px solid var(--rd-border);
}

/* shared component skins */
.docs-doc :deep(.al-code-block),
.docs :deep(.al-code-block) {
    border: 1px solid var(--rd-border);
    background: var(--rd-code-bg);
}

.docs :deep(.al-code-toolbar) {
    border-bottom: 1px solid var(--rd-border);
    background: var(--rd-bg-soft);
    color: var(--rd-text-soft);
}

.docs :deep(.al-code-copy) {
    border: 1px solid var(--rd-border);
    background: var(--rd-bg);
    color: var(--rd-text-soft);
}

.docs :deep(.al-code-copy:hover) {
    border-color: var(--rd-accent);
    color: var(--rd-accent);
}

.docs :deep(div[class*="language-"]) {
    border: 1px solid var(--rd-border);
    background: var(--rd-code-bg);
}

.docs :deep(div[class*="language-"] > .lang) {
    color: var(--rd-text-soft);
}

.docs :deep(div[class*="language-"] > .copy) {
    border: 1px solid var(--rd-border);
    background: var(--rd-bg);
    color: var(--rd-text-soft);
}

.docs :deep(div[class*="language-"] > .copy:hover) {
    border-color: var(--rd-accent);
    color: var(--rd-accent);
}

.docs :deep(.callout) {
    border: 1px solid var(--rd-border);
    border-left: 3px solid var(--rd-anilist);
    background: var(--rd-bg);
    padding: 0.75rem 1rem;
    margin: 1.25rem 0;
}

.docs :deep(.callout--caution) {
    border-left-color: var(--rd-accent);
}

.docs :deep(.callout--provider) {
    border-left-color: var(--rd-mal);
}

.docs :deep(.callout-label) {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    margin: 0 0 0.25rem;
    font-family: "Zen Old Mincho", "Shippori Mincho", serif;
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--rd-text-soft);
}

.docs :deep(.provider-tabs .tab-buttons) {
    display: inline-flex;
    border: 1.5px solid var(--rd-text);
}

.docs :deep(.provider-tabs .tab-btn) {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    border: 0;
    background: none;
    padding: 0.35rem 1.1rem;
    font-weight: 600;
    font-size: 0.86rem;
    color: var(--rd-text-soft);
    cursor: pointer;
}

.docs :deep(.provider-tabs .tab-btn--anilist.active) {
    background: var(--rd-anilist);
    color: #fff;
}

html.dark .docs :deep(.provider-tabs .tab-btn--anilist.active) {
    color: var(--rd-bg);
}

.docs :deep(.provider-tabs .tab-btn--mal.active) {
    background: var(--rd-mal);
    color: #fff;
}

html.dark .docs :deep(.provider-tabs .tab-btn--mal.active) {
    color: var(--rd-bg);
}

/* operation cards */
.docs :deep(.op-card) {
    border: 1px solid var(--rd-border);
    background: color-mix(in srgb, var(--rd-bg) 50%, transparent);
    padding: 1.25rem 1.5rem;
    margin: 1.5rem 0;
}

.docs :deep(.op-purpose) {
    color: var(--rd-text-soft);
}

.docs :deep(.op-block-title) {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-family: "Zen Old Mincho", "Shippori Mincho", serif;
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--rd-text-soft);
    margin: 0 0 0.4rem;
}

/* Collapsible request/response blocks: collapsed by default. */
.docs :deep(.op-collapsible .op-toggle) {
    width: 100%;
    margin: 0 0 0;
    padding: 0.3rem 0;
    background: none;
    border: 0;
    border-bottom: 1px solid var(--rd-border);
    cursor: pointer;
    text-align: left;
    font: inherit;
    color: inherit;
    justify-content: flex-start;
}

.docs :deep(.op-collapsible .op-toggle:hover) {
    color: var(--rd-accent);
}

.docs :deep(.op-collapsible .op-chevron) {
    margin-left: auto;
    transition: transform 0.18s ease;
}

.docs :deep(.op-collapsible.is-open .op-chevron) {
    transform: rotate(180deg);
}

.docs :deep(.op-collapsible-body) {
    display: none;
    margin-top: 0.5rem;
}

.docs :deep(.op-collapsible.is-open .op-collapsible-body) {
    display: block;
}

.docs :deep(.op-links) {
    display: flex;
    gap: 1rem;
    border-top: 1px solid var(--rd-border);
    padding-top: 0.75rem;
    font-size: 0.85rem;
}

.docs :deep(.op-links a) {
    display: inline-flex;
    align-items: center;
    gap: 0.2em;
}

/* ---------------- toc ---------------- */

.docs-toc {
    width: 220px;
    flex-shrink: 0;
    position: sticky;
    top: 0;
    max-height: 100%;
    overflow: hidden;
    padding: 2.5rem 1.5rem 2rem 0;
    font-size: 0.82rem;
}

.docs-toc-title {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-family: "Zen Old Mincho", "Shippori Mincho", serif;
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: var(--rd-text-soft);
    margin: 0 0 0.6rem;
}

.docs-toc-viewport {
    position: relative;
    /* Match the reading viewport so the TOC can scroll in sync with the page
       (minimap) when it has enough entries to overflow. Short TOCs fit. */
    max-height: calc(100vh - var(--docs-top-height) - 4rem);
    overflow: hidden;
}

.docs-toc-list {
    position: relative;
    transition: transform 0.12s ease-out;
    will-change: transform;
}

.docs-toc-indicator {
    position: absolute;
    top: 0;
    left: 0;
    width: 2px;
    border-radius: 2px;
    background: var(--rd-accent);
    pointer-events: none;
}

.docs-toc ul {
    list-style: none;
    margin: 0;
    padding: 0;
    border-left: 1px solid var(--rd-border);
}

.docs-toc a {
    display: block;
    padding: 0.18rem 0 0.18rem 0.85rem;
    color: var(--rd-text-soft);
    text-decoration: none;
    border-left: 2px solid transparent;
    margin-left: -1.5px;
    transition:
        color 0.15s ease,
        border-color 0.15s ease;
}

.docs-toc a:hover {
    color: var(--rd-text);
}

.docs-toc a.depth-3 {
    padding-left: 1.7rem;
}

/* ---------------- pager / footer ---------------- */

.docs-pager {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    margin-top: 3rem;
    padding-top: 1.25rem;
    border-top: 1px solid var(--rd-border);
}

.docs-pager-link {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
    text-decoration: none;
    color: var(--rd-text);
    max-width: 46%;
}

.docs-pager-link--next {
    text-align: right;
    margin-left: auto;
}

.docs-pager-link span {
    font-size: 0.72rem;
    letter-spacing: 0.14em;
    color: var(--rd-text-soft);
}

.docs-pager-dir {
    display: inline-flex;
    align-items: center;
    gap: 0.3em;
}

.docs-pager-link strong {
    font-family: "Zen Old Mincho", "Shippori Mincho", serif;
    font-weight: 700;
}

.docs-pager-link:hover strong {
    color: var(--rd-accent);
}

.docs-foot {
    margin-top: 3rem;
    padding-top: 1rem;
    border-top: 1px solid var(--rd-border);
    font-size: 0.8rem;
    color: var(--rd-text-soft);
}

.docs-main--landing .docs-foot {
    display: none;
}

/* ---------------- responsive ---------------- */

@media (max-width: 1080px) {
    .docs-toc {
        display: none;
    }
}

@media (max-width: 880px) {
    .docs-body {
        z-index: auto;
    }

    .docs-rail {
        position: fixed;
        left: 0;
        top: var(--docs-top-height);
        bottom: auto;
        height: calc(100dvh - var(--docs-top-height));
        min-height: 0;
        max-height: none;
        z-index: 40;
        background: var(--rd-bg);
        display: none;
        width: min(82vw, 320px);
        box-shadow: 0 0 40px rgba(0, 0, 0, 0.18);
        transform: translateX(-100%);
        transition:
            transform 0.22s ease,
            box-shadow 0.22s ease;
    }

    html.dark .docs .docs-rail {
        background: var(--rd-bg);
    }

    .docs-rail.is-open {
        display: flex;
        transform: translateX(0);
    }

    .docs-menu {
        display: inline-flex;
        align-items: center;
        justify-content: center;
    }

    .docs-main {
        padding: 1.75rem 1.25rem 2.5rem;
    }

    .docs-top {
        padding: 0.8rem 1rem;
        gap: 0.75rem;
    }

    .docs-top-actions {
        gap: 0.75rem;
    }

    .docs-top .docs-brand-vert {
        display: none;
    }
}

@media (max-width: 480px) {
    .docs-top-links {
        gap: 0.6rem;
        font-size: 0.76rem;
    }

    .docs-top-actions {
        gap: 0.5rem;
    }
}
</style>
