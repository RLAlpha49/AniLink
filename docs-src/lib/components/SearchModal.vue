<script setup lang="ts">
/**
 * Modal shell for semantic search.
 *
 * Mounts `SemanticSearch` in a centered overlay with a backdrop. Opens via
 * `openModal()`, which the navbar button calls, or the global `Cmd/Ctrl+K`
 * and `/` keyboard shortcuts. Closes on Escape or backdrop click. On select,
 * performs a full navigation to the result URL.
 */
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRouter } from "vitepress";
import SemanticSearch from "./SemanticSearch.vue";

const router = useRouter();

/**
 * Offset for the sticky header so scrolled-to headings stay visible.
 * Mirrors HEADING_SCROLL_OFFSET in DocsLayout.vue so anchor targets appear
 * at the same position whether reached via the TOC or via search.
 */
const HEADING_SCROLL_OFFSET = 80;

const open = ref(false);
/** The panel element is the focus-trap boundary. */
const panelRef = ref<HTMLElement | null>(null);
/** Element to restore focus to when the modal closes. */
let lastFocused: HTMLElement | null = null;

/** Selector matching focusable elements inside the panel. */
const FOCUSABLE =
    'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';

function openModal(): void {
    if (open.value) return;
    if (typeof document !== "undefined") {
        lastFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    }
    open.value = true;
    nextTick(() => {
        if (typeof document === "undefined") return;
        const el = document.querySelector<HTMLElement>(".ss-input");
        el?.focus();
    });
}

function closeModal(): void {
    if (!open.value) return;
    open.value = false;
    // Hand focus back to the trigger so keyboard users stay where they were.
    lastFocused?.focus();
    lastFocused = null;
}

/**
 * Scroll an anchor target into view inside the reading column, offset for
 * the sticky header. Mirrors the container logic in DocsLayout.vue's
 * scrollToHeading. The docs layout scrolls `.docs-columns`, not the window.
 */
function scrollToAnchor(hash: string): void {
    if (typeof window === "undefined") return;
    const target = document.getElementById(decodeURIComponent(hash.slice(1)));
    if (!target) return;
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
}

function onSelect(url: string): void {
    closeModal();
    if (typeof window === "undefined") return;
    // Prefer the VitePress router. SPA navigation keeps the page (and the
    // already-loaded transformers model) alive instead of a full reload.
    // The router is only meaningful in the browser. Under SSR there is no
    // history to push, so fall back to a full page assignment.
    if (router) {
        const hashIdx = url.indexOf("#");
        const path = hashIdx >= 0 ? url.slice(0, hashIdx) : url;
        const hash = hashIdx >= 0 ? url.slice(hashIdx) : "";
        // A same-page anchor link, such as an operation anchor on the
        // operations page. router.go() pushes the URL but does not scroll
        // when the pathname is unchanged, so scroll the target manually.
        if (hash && path === router.route.path) {
            void router.go(url).then(() => scrollToAnchor(hash));
        } else if (hash) {
            // Most results are cross-page anchor links. The router's built-in
            // hash scroll targets the window, but this layout scrolls
            // `.docs-columns` because html and body have overflow:hidden. The
            // built-in scroll is a no-op here, and the route watcher resets to
            // the top. Navigate, then scroll the anchor manually once the new
            // page has rendered.
            void router.go(url).then(() => {
                nextTick(() => {
                    requestAnimationFrame(() => scrollToAnchor(hash));
                });
            });
        } else {
            void router.go(url);
        }
        return;
    }
    window.location.assign(url);
}

/** True when the key event target is an editable element. */
function isTyping(e: KeyboardEvent): boolean {
    if (typeof document === "undefined") return false;
    const t = e.target as HTMLElement | null;
    if (!t) return false;
    return (
        t.tagName === "INPUT" ||
        t.tagName === "TEXTAREA" ||
        t.tagName === "SELECT" ||
        t.isContentEditable === true
    );
}

/**
 * Keep Tab focus inside the dialog (WCAG 2.1.2 and 2.4.3). The template
 * attaches this handler to the overlay, so the handler fires for every
 * keydown that bubbles out of the panel while the modal is open.
 */
function trapFocus(e: KeyboardEvent): void {
    if (e.key !== "Tab") return;
    const root = panelRef.value;
    if (!root) return;
    const focusables = Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.offsetWidth > 0 || el.offsetHeight > 0 || el === document.activeElement
    );
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    if (e.shiftKey) {
        if (!active || active === first || !root.contains(active)) {
            e.preventDefault();
            last.focus();
        }
    } else if (!active || active === last || !root.contains(active)) {
        e.preventDefault();
        first.focus();
    }
}

function onKeydown(e: KeyboardEvent): void {
    if (typeof window === "undefined") return;
    const mod = e.metaKey || e.ctrlKey;
    if (mod && e.key.toLowerCase() === "k") {
        e.preventDefault();
        open.value ? closeModal() : openModal();
    } else if (e.key === "Escape" && open.value) {
        closeModal();
    } else if (e.key === "/" && !isTyping(e)) {
        e.preventDefault();
        openModal();
    }
}

// Lock body scroll while the modal is open so the page behind does not scroll.
watch(open, (isOpen) => {
    if (typeof document === "undefined") return;
    document.body.style.overflow = isOpen ? "hidden" : "";
});

onMounted(() => {
    if (typeof window === "undefined") return;
    window.addEventListener("keydown", onKeydown);
});

onBeforeUnmount(() => {
    if (typeof window === "undefined") return;
    window.removeEventListener("keydown", onKeydown);
    if (typeof document !== "undefined") document.body.style.overflow = "";
});

defineExpose({ openModal });
</script>

<template>
    <ClientOnly>
        <Teleport to="body">
            <Transition name="ss-overlay">
                <div v-if="open" class="ss-overlay" @click.self="closeModal" @keydown="trapFocus">
                    <Transition name="ss-panel" appear>
                        <div
                            v-if="open"
                            ref="panelRef"
                            class="ss-modal"
                            role="dialog"
                            aria-modal="true"
                            aria-label="Search docs"
                        >
                            <SemanticSearch :open="open" @select="onSelect" @close="closeModal" />
                        </div>
                    </Transition>
                </div>
            </Transition>
        </Teleport>
    </ClientOnly>
</template>

<style scoped>
.ss-overlay {
    position: fixed;
    inset: 0;
    z-index: 1000;
    background: color-mix(in srgb, var(--rd-bg) 30%, rgba(0, 0, 0, 0.45));
    backdrop-filter: blur(8px) saturate(1.1);
    -webkit-backdrop-filter: blur(8px) saturate(1.1);
    display: flex;
    justify-content: center;
    align-items: flex-start;
    padding-top: 11vh;
}

.ss-modal {
    width: min(640px, 92vw);
    max-height: 72vh;
    overflow: hidden;
    background: var(--rd-bg);
    border: 1px solid var(--rd-border);
    border-radius: 16px;
    box-shadow:
        0 1px 0 color-mix(in srgb, var(--rd-bg-soft) 80%, transparent) inset,
        0 24px 70px -12px rgba(0, 0, 0, 0.4),
        0 8px 24px -8px rgba(0, 0, 0, 0.25);
    padding: 0;
}

/* Overlay fade */
.ss-overlay-enter-active,
.ss-overlay-leave-active {
    transition: opacity 0.18s ease;
}
.ss-overlay-enter-from,
.ss-overlay-leave-to {
    opacity: 0;
}

/* Panel rise and scale */
.ss-panel-enter-active {
    transition:
        opacity 0.22s ease,
        transform 0.22s cubic-bezier(0.22, 1, 0.36, 1);
}
.ss-panel-leave-active {
    transition:
        opacity 0.16s ease,
        transform 0.16s ease;
}
.ss-panel-enter-from {
    opacity: 0;
    transform: translateY(-14px) scale(0.97);
}
.ss-panel-leave-to {
    opacity: 0;
    transform: translateY(-8px) scale(0.98);
}

@media (prefers-reduced-motion: reduce) {
    .ss-overlay-enter-active,
    .ss-overlay-leave-active,
    .ss-panel-enter-active,
    .ss-panel-leave-active {
        transition: none;
    }
}
</style>
