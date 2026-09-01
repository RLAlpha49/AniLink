/**
 * Heading scroll spy shared by the redesign layouts.
 *
 * Tracks every heading currently visible in the reading viewport so the
 * table of contents can highlight all on-screen sections at once (short or
 * skipped sections stay lit while they are visible). It also exposes a
 * continuous scroll-progress value (0..1) across the whole page so the TOC
 * can scroll in sync with the page like a minimap.
 */
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import type { ComputedRef, Readonly, Ref } from "vue";

/** A heading exposed by the current documentation page. */
export interface PageHeading {
    id: string;
    title: string;
    level: number;
}

/** A heading's document position used by the scroll spy. */
export interface HeadingPosition {
    id: string;
    top: number;
    bottom: number;
}

/** Result of computing which sections are visible in the viewport. */
export interface VisibleSections {
    /** Indices of every section whose body intersects the reading viewport. */
    indices: number[];
    /** Index of the section nearest the top of the viewport (the lead one). */
    leadIndex: number;
    /** How far the lead section has scrolled toward the next one (0..1). */
    leadProgress: number;
    /** Whole-page scroll progress from 0 (top) to 1 (bottom). */
    progress: number;
}

/** The normalized portion of the document currently visible in the viewport. */
export interface ScrollIndicatorViewport {
    start: number;
    end: number;
}

/** Map the visible page window to the corresponding heading range in the TOC. */
export function selectScrollIndicatorViewport(
    scrollTop: number,
    viewportHeight: number,
    contentHeight: number,
    headingPositions: HeadingPosition[] = []
): ScrollIndicatorViewport {
    if (!Number.isFinite(contentHeight) || contentHeight <= 0 || viewportHeight >= contentHeight) {
        return { start: 0, end: 1 };
    }

    const rawStart = Number.isFinite(scrollTop) ? scrollTop : 0;
    const rawEnd = rawStart + Math.max(0, viewportHeight);
    if (headingPositions.length < 2) {
        const viewportRatio = Math.max(0, viewportHeight / contentHeight);
        const maxStart = 1 - viewportRatio;
        const start = Math.min(maxStart, Math.max(0, rawStart / contentHeight));
        return { start, end: start + viewportRatio };
    }

    const lastIndex = headingPositions.length - 1;
    const headingProgressAt = (documentPosition: number): number => {
        if (documentPosition <= headingPositions[0].top) {
            return 0;
        }
        if (documentPosition >= headingPositions[lastIndex].top) {
            return 1;
        }

        for (let index = 0; index < lastIndex; index++) {
            const current = headingPositions[index].top;
            const next = headingPositions[index + 1].top;
            if (documentPosition <= next) {
                const span = next - current;
                const localProgress = span > 0 ? (documentPosition - current) / span : 0;
                return (index + Math.min(1, Math.max(0, localProgress))) / lastIndex;
            }
        }

        return 1;
    };

    const start = headingProgressAt(rawStart);
    const end = headingProgressAt(rawEnd);

    return {
        start,
        end: Math.max(start, end),
    };
}

/** Calculate how much of each TOC entry is covered by the visible range. */
export function selectTocEntryColorProgress(
    entryTops: number[],
    entryHeights: number[],
    listHeight: number,
    viewport: ScrollIndicatorViewport
): number[] {
    if (listHeight <= 0 || entryTops.length !== entryHeights.length) {
        return [];
    }

    const start = Math.max(0, Math.min(1, Math.min(viewport.start, viewport.end)));
    const end = Math.max(0, Math.min(1, Math.max(viewport.start, viewport.end)));

    return entryTops.map((top, index) => {
        const entryStart = top / listHeight;
        const entryEnd = (top + entryHeights[index]) / listHeight;
        const entryLength = entryEnd - entryStart;
        if (entryLength <= 0) {
            return 0;
        }

        const overlap = Math.max(0, Math.min(entryEnd, end) - Math.max(entryStart, start));
        return Math.min(1, overlap / entryLength);
    });
}

/**
 * Compute every section visible in the reading viewport plus the overall
 * page scroll progress.
 *
 * A section is considered visible when any part of its body (from its heading
 * to the next heading) overlaps the viewport band. This lets short or skipped
 * sections stay highlighted while they are on screen, instead of only the
 * single heading nearest the top. `progress` is the fraction of the scrollable
 * content already scrolled, clamped to [0, 1], so the TOC can mirror page
 * scroll position.
 */
export function selectVisibleSections(
    positions: HeadingPosition[],
    scrollTop: number,
    viewportHeight: number,
    topOffset: number
): VisibleSections {
    if (positions.length === 0) {
        return { indices: [], leadIndex: -1, leadProgress: 0, progress: 0 };
    }

    const viewTop = scrollTop + topOffset;
    const viewBottom = scrollTop + viewportHeight;
    const lastIndex = positions.length - 1;
    const maxScroll = positions[lastIndex].bottom - viewportHeight;
    const progress = maxScroll > 0 ? Math.min(1, Math.max(0, scrollTop / maxScroll)) : 0;

    const indices: number[] = [];
    let leadIndex = -1;

    for (let i = 0; i < positions.length; i++) {
        const sectionTop = positions[i].top;
        const sectionBottom = positions[i + 1]?.top ?? positions[i].bottom;
        // Visible when the section overlaps the viewport band.
        if (sectionTop < viewBottom && sectionBottom > viewTop) {
            indices.push(i);
            // The lead section is the first visible one whose heading has
            // passed the top threshold, or the very first visible section.
            if (leadIndex === -1 && sectionTop <= viewTop) {
                leadIndex = i;
            }
        }
    }

    if (leadIndex === -1 && indices.length > 0) {
        leadIndex = indices[0];
    }

    // Continuous progress of the lead section toward the next heading, so the
    // TOC highlight can glide smoothly between entries instead of snapping.
    let leadProgress = 0;
    if (leadIndex >= 0) {
        const sectionTop = positions[leadIndex].top;
        const nextTop = positions[leadIndex + 1]?.top ?? positions[leadIndex].bottom;
        const span = nextTop - sectionTop;
        if (span > 0) {
            leadProgress = Math.min(1, Math.max(0, (viewTop - sectionTop) / span));
        }
    }

    return { indices, leadIndex, leadProgress, progress };
}

/** Choose the heading currently nearest below the sticky header threshold. */
export function selectActiveHeading(
    positions: HeadingPosition[],
    scrollY: number,
    topOffset: number
): string | null {
    if (positions.length === 0) {
        return null;
    }
    const threshold = scrollY + topOffset;
    let active = positions[0].id;
    for (const position of positions) {
        if (position.top <= threshold) {
            active = position.id;
        } else {
            break;
        }
    }
    return active;
}

const TOP_OFFSET = 72;

/** Track every heading visible in the reading viewport. */
export function useHeadingScrollSpy(pageHeaders: Readonly<Ref<readonly PageHeading[]>>): {
    headings: Readonly<Ref<readonly PageHeading[]>>;
    activeHeadingId: Readonly<Ref<string | null>>;
    visibleIndices: Readonly<Ref<readonly number[]>>;
    leadIndex: Readonly<Ref<number>>;
    leadProgress: Readonly<Ref<number>>;
    scrollProgress: Readonly<Ref<number>>;
    scrollViewport: Readonly<Ref<ScrollIndicatorViewport>>;
} {
    const headings = ref<readonly PageHeading[]>(pageHeaders.value);
    const visibleIndices = ref<readonly number[]>([]);
    const leadIndex = ref<number>(-1);
    const leadProgress = ref<number>(0);
    const scrollProgress = ref<number>(0);
    const scrollViewport = ref<ScrollIndicatorViewport>({ start: 0, end: 1 });
    const activeHeadingId: ComputedRef<string | null> = computed(() =>
        leadIndex.value >= 0 ? (headings.value[leadIndex.value]?.id ?? null) : null
    );
    let animationFrame: number | null = null;
    let stopWatching: (() => void) | null = null;
    let scrollContainer: HTMLElement | null = null;
    let contentObserver: MutationObserver | null = null;
    let contentObserverTimer: number | null = null;
    let mounted = false;

    function findScrollContainer(): HTMLElement | null {
        if (typeof document === "undefined") {
            return null;
        }
        return document.querySelector<HTMLElement>(".docs-columns");
    }

    function cancelScheduledUpdate(): void {
        if (animationFrame !== null && typeof window !== "undefined") {
            window.cancelAnimationFrame(animationFrame);
            animationFrame = null;
        }
    }

    function updateActiveHeading(): void {
        if (typeof window === "undefined") {
            return;
        }

        const container = scrollContainer ?? findScrollContainer();
        const scrollTop = container?.scrollTop ?? window.scrollY;
        const viewportHeight = container?.clientHeight ?? window.innerHeight;
        const contentHeight = container?.scrollHeight ?? document.documentElement.scrollHeight;
        const containerTop = container?.getBoundingClientRect().top ?? 0;
        const positions: HeadingPosition[] = [];
        for (const heading of headings.value) {
            const element = document.getElementById(heading.id);
            if (element) {
                const rect = element.getBoundingClientRect();
                positions.push({
                    id: heading.id,
                    top: rect.top - containerTop + scrollTop,
                    bottom: rect.bottom - containerTop + scrollTop,
                });
            }
        }

        const visible = selectVisibleSections(positions, scrollTop, viewportHeight, TOP_OFFSET);
        visibleIndices.value = visible.indices;
        leadIndex.value = visible.leadIndex;
        leadProgress.value = visible.leadProgress;
        scrollProgress.value = visible.progress;
        scrollViewport.value = selectScrollIndicatorViewport(
            scrollTop,
            viewportHeight,
            contentHeight,
            positions
        );
    }

    function collectRenderedHeadings(): void {
        if (typeof document === "undefined") {
            return;
        }

        const renderedHeadings = Array.from(
            document.querySelectorAll<HTMLElement>(".doc-content h2[id], .doc-content h3[id]")
        ).map((element) => ({
            id: element.id,
            title: element.textContent?.trim() || element.id,
            level: Number(element.tagName.slice(1)),
        }));

        headings.value = renderedHeadings.length > 0 ? renderedHeadings : [...pageHeaders.value];
    }

    /**
     * Watch the content area for added/changed headings so pages that render
     * their h2/h3 asynchronously (e.g. the generated operation catalogs) still
     * populate the scroll spy once the Vue components mount.
     */
    function observeContentChanges(): void {
        if (typeof window === "undefined" || typeof MutationObserver === "undefined") {
            return;
        }
        const content = document.querySelector<HTMLElement>(".doc-content");
        if (!content) {
            return;
        }

        contentObserver?.disconnect();
        contentObserver = new MutationObserver(() => {
            // Debounce: coalesce bursts of mutations (e.g. Shiki highlighting) into
            // a single re-collection so we don't thrash on every text node change.
            if (contentObserverTimer !== null && typeof window !== "undefined") {
                window.clearTimeout(contentObserverTimer);
            }
            contentObserverTimer = window.setTimeout(() => {
                contentObserverTimer = null;
                if (!mounted) return;
                const before = headings.value.map((h) => h.id).join("|");
                collectRenderedHeadings();
                const after = headings.value.map((h) => h.id).join("|");
                updateActiveHeading();
                // Once the heading set is stable, stop observing to avoid churn.
                if (before === after && headings.value.length > 0) {
                    contentObserver?.disconnect();
                    contentObserver = null;
                }
            }, 120);
        });
        contentObserver.observe(content, { childList: true, subtree: true });
    }

    function scheduleUpdate(): void {
        if (typeof window === "undefined" || animationFrame !== null) {
            return;
        }

        if (typeof window.requestAnimationFrame !== "function") {
            updateActiveHeading();
            return;
        }

        animationFrame = window.requestAnimationFrame(() => {
            animationFrame = null;
            updateActiveHeading();
        });
    }

    function removeListeners(): void {
        if (typeof window === "undefined") {
            return;
        }

        cancelScheduledUpdate();
        scrollContainer?.removeEventListener("scroll", scheduleUpdate);
        window.removeEventListener("scroll", scheduleUpdate);
        window.removeEventListener("resize", scheduleUpdate);
        contentObserver?.disconnect();
        contentObserver = null;
        if (contentObserverTimer !== null) {
            window.clearTimeout(contentObserverTimer);
            contentObserverTimer = null;
        }
    }

    async function refreshHeadings(): Promise<void> {
        if (!mounted || typeof window === "undefined") {
            return;
        }

        removeListeners();
        visibleIndices.value = [];
        leadIndex.value = -1;
        leadProgress.value = 0;
        scrollProgress.value = 0;
        scrollViewport.value = { start: 0, end: 1 };
        await nextTick();

        if (!mounted) {
            return;
        }

        collectRenderedHeadings();
        updateActiveHeading();
        scrollContainer = findScrollContainer();
        if (scrollContainer) {
            scrollContainer.addEventListener("scroll", scheduleUpdate, { passive: true });
        } else {
            window.addEventListener("scroll", scheduleUpdate, { passive: true });
        }
        window.addEventListener("resize", scheduleUpdate);
        observeContentChanges();
    }

    onMounted(() => {
        mounted = true;
        stopWatching = watch(pageHeaders, refreshHeadings, {
            deep: true,
            immediate: true,
        });
    });

    onBeforeUnmount(() => {
        mounted = false;
        stopWatching?.();
        removeListeners();
    });

    return {
        headings,
        activeHeadingId,
        visibleIndices,
        leadIndex,
        leadProgress,
        scrollProgress,
        scrollViewport,
    };
}
