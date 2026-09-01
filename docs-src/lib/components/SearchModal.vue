<script setup lang="ts">
/**
 * Modal shell for semantic search.
 *
 * Mounts `SemanticSearch` in a centered overlay with a backdrop. Opens via
 * `openModal()` (called from the navbar button) or the global `Cmd/Ctrl+K`
 * and `/` keyboard shortcuts. Closes on Escape or backdrop click. On select,
 * performs a full navigation to the result URL.
 */
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import SemanticSearch from "./SemanticSearch.vue";

const open = ref(false);

function openModal(): void {
    open.value = true;
    nextTick(() => {
        if (typeof document === "undefined") return;
        const el = document.querySelector<HTMLElement>(".ss-input");
        el?.focus();
    });
}

function closeModal(): void {
    open.value = false;
}

function onSelect(url: string): void {
    closeModal();
    if (typeof window !== "undefined") window.location.assign(url);
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

// Lock body scroll while the modal is open so the page behind stays put.
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
                <div v-if="open" class="ss-overlay" @click.self="closeModal">
                    <Transition name="ss-panel" appear>
                        <div
                            v-if="open"
                            class="ss-modal"
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

/* Panel rise + scale */
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
