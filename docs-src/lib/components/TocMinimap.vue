<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { List } from "@lucide/vue";
import {
    selectTocEntryColorProgress,
    type PageHeading,
    type ScrollIndicatorViewport,
} from "../useHeadingScrollSpy";

const props = defineProps<{
    tocHeaders: readonly PageHeading[];
    scrollProgress: number;
    scrollViewport: ScrollIndicatorViewport;
}>();

const emit = defineEmits<{
    navigate: [id: string];
}>();

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
    top: tocOffsetAtProgress(props.scrollViewport.start),
    bottom: tocOffsetAtProgress(props.scrollViewport.end),
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
 * Vertical position and height of the TOC viewport marker. It spans the same
 * percentage of the TOC as the portion of the document currently visible in
 * the reading column.
 */
const indicatorStyle = computed((): Record<string, string> => {
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
 * The on-screen region of the page stays in view in the TOC. When the TOC is
 * taller than its own viewport, the list shifts proportionally to the page's
 * scroll progress.
 */
const tocListStyle = computed((): Record<string, string> => {
    const list = tocList.value;
    if (!list || typeof window === "undefined") {
        return {};
    }
    const overflow = list.scrollHeight - list.clientHeight;
    if (overflow <= 0) {
        return {};
    }
    const y = overflow * props.scrollProgress;
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
watch(
    () => props.tocHeaders,
    () => {
        nextTick(() => measureEntries());
    }
);
</script>

<template>
    <aside class="docs-toc" aria-label="On this page">
        <p class="docs-toc-title"><List :size="14" aria-hidden="true" /> 目次 · Contents</p>
        <div class="docs-toc-viewport">
            <div class="docs-toc-list" ref="tocList" :style="tocListStyle">
                <span class="docs-toc-indicator" :style="indicatorStyle" aria-hidden="true"></span>
                <ul>
                    <li v-for="(h, i) in tocHeaders" :key="h.id">
                        <a
                            :href="`#${h.id}`"
                            :style="tocEntryStyles[i]"
                            :class="[`depth-${h.level}`]"
                            @click.prevent="emit('navigate', h.id)"
                            >{{ h.title }}</a
                        >
                    </li>
                </ul>
            </div>
        </div>
    </aside>
</template>

<style scoped>
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

@media (max-width: 1080px) {
    .docs-toc {
        display: none;
    }
}
</style>
