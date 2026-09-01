<script setup lang="ts">
/**
 * Renders a Mermaid diagram from a fenced code block.
 *
 * Mermaid is a devDependency, so this component imports it lazily and renders
 * client-side. It honors the active light/dark theme by re-running whenever the
 * `dark` class on `<html>` changes. Registered globally in the theme so it can
 * be used from Markdown as `<Mermaid>` with a `:code` prop, or wrapped by a
 * small Markdown shim that passes the fenced body through.
 *
 * A toolbar button opens the rendered SVG in a full-screen overlay where the
 * user can zoom (wheel or buttons) and pan (drag) freely. The overlay closes
 * on Escape, backdrop click, or its close button.
 */
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useData } from "vitepress";
import { escapeHtml } from "../search-rank";

const props = defineProps<{
    /** Mermaid diagram source (the fenced code body). */
    code: string;
}>();

const container = ref<HTMLDivElement | null>(null);
const svg = ref("");
let observer: MutationObserver | null = null;

const { isDark } = useData();

async function render(): Promise<void> {
    if (typeof window === "undefined" || !container.value) return;
    const mermaid = (await import("mermaid")).default;
    const id = `mermaid-${Date.now().toString(36)}-${renderCounter++}`;
    try {
        mermaid.initialize({
            startOnLoad: false,
            theme: isDark.value ? "dark" : "neutral",
            securityLevel: "loose",
            fontFamily: '"JetBrains Mono", monospace',
        });
        const { svg: out } = await mermaid.render(id, props.code);
        svg.value = out;
        requestAnimationFrame(applyReadableContrast);
    } catch {
        // Fall back to the raw source so a malformed diagram still shows text.
        svg.value = `<pre class="mermaid-error">${escapeHtml(props.code)}</pre>`;
    }
}

/**
 * Walk every node in the rendered SVG and set its label text color to a
 * dark or light value based on the luminance of the node's actual fill.
 * This keeps text readable regardless of which Mermaid theme is active or
 * how classDef fills were inverted, because it reads the computed fill at
 * runtime rather than assuming a fixed palette.
 */
function applyReadableContrast(): void {
    if (typeof document === "undefined" || !container.value) return;
    const svgEl = container.value.querySelector("svg");
    if (!svgEl) return;
    const nodes = svgEl.querySelectorAll("g.node");
    nodes.forEach((node) => {
        const containerShape = node.querySelector(
            ".label-container rect, .label-container path, .label-container circle, .label-container ellipse, .label-container polygon"
        );
        const fallbackShapes = node.querySelectorAll("rect, polygon, circle, ellipse, path");
        let shape: SVGElement | null = containerShape as SVGElement | null;
        if (!shape && fallbackShapes.length > 0) {
            let best: SVGElement | null = null;
            let bestLum = -1;
            fallbackShapes.forEach((s) => {
                const rgb = parseRgb(getComputedStyle(s).fill);
                if (!rgb) return;
                const lum = 0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b;
                if (lum > bestLum) {
                    bestLum = lum;
                    best = s as SVGElement;
                }
            });
            shape = best;
        }
        if (!shape) return;
        const fill = getComputedStyle(shape).fill;
        const rgb = parseRgb(fill);
        if (!rgb) return;
        const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
        const textColor = luminance > 0.55 ? "#1a1a1a" : "#f5f5f5";
        node.querySelectorAll("span, div, p, text, foreignObject div").forEach((el) => {
            (el as HTMLElement | SVGElement).style.color = textColor;
            if (el instanceof SVGTextElement) el.style.fill = textColor;
        });
    });
}

function parseRgb(color: string): { r: number; g: number; b: number } | null {
    const m = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (!m) return null;
    return { r: +m[1], g: +m[2], b: +m[3] };
}

let renderCounter = 0;

onMounted(() => {
    render();
    // Re-render when the theme flips, since Mermaid bakes colors into the SVG.
    if (typeof MutationObserver !== "undefined" && typeof document !== "undefined") {
        observer = new MutationObserver(() => render());
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ["class"],
        });
    }
});

onBeforeUnmount(() => {
    observer?.disconnect();
    observer = null;
    if (typeof window !== "undefined") {
        window.removeEventListener("keydown", onOverlayKeydown);
    }
});

watch(() => props.code, render);

// --- Zoom / pan overlay -------------------------------------------------

const overlayOpen = ref(false);
const zoom = ref(1);
const panX = ref(0);
const panY = ref(0);
let dragging = false;
let lastX = 0;
let lastY = 0;

function openOverlay(): void {
    overlayOpen.value = true;
    zoom.value = 1;
    panX.value = 0;
    panY.value = 0;
    if (typeof window !== "undefined") {
        window.addEventListener("keydown", onOverlayKeydown);
    }
}

function closeOverlay(): void {
    overlayOpen.value = false;
    if (typeof window !== "undefined") {
        window.removeEventListener("keydown", onOverlayKeydown);
    }
}

function onOverlayKeydown(e: KeyboardEvent): void {
    if (e.key === "Escape") closeOverlay();
}

function onWheel(e: WheelEvent): void {
    e.preventDefault();
    // Zoom toward the cursor: keep the point under the pointer stationary.
    const stage = e.currentTarget as HTMLDivElement;
    const rect = stage.getBoundingClientRect();
    const px = e.clientX - rect.left - rect.width / 2;
    const py = e.clientY - rect.top - rect.height / 2;
    const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
    const next = Math.min(8, Math.max(0.2, zoom.value * factor));
    const ratio = next / zoom.value;
    panX.value = (panX.value - px) * ratio + px;
    panY.value = (panY.value - py) * ratio + py;
    zoom.value = next;
}

function onDragStart(e: PointerEvent): void {
    dragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
}

function onDragMove(e: PointerEvent): void {
    if (!dragging) return;
    panX.value += e.clientX - lastX;
    panY.value += e.clientY - lastY;
    lastX = e.clientX;
    lastY = e.clientY;
}

function onDragEnd(e: PointerEvent): void {
    dragging = false;
    (e.currentTarget as HTMLDivElement).releasePointerCapture?.(e.pointerId);
}

function zoomBy(factor: number): void {
    zoom.value = Math.min(8, Math.max(0.2, zoom.value * factor));
}

function resetView(): void {
    zoom.value = 1;
    panX.value = 0;
    panY.value = 0;
}
</script>

<template>
    <div class="docs-mermaid-wrap">
        <div ref="container" class="docs-mermaid" v-html="svg"></div>
        <button
            class="docs-mermaid-expand"
            type="button"
            title="Open in zoomable view"
            @click="openOverlay"
        >
            <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
            >
                <path d="M15 3h6v6" />
                <path d="M9 21H3v-6" />
                <path d="M21 3l-7 7" />
                <path d="M3 21l7-7" />
            </svg>
            <span>Expand</span>
        </button>
    </div>

    <Teleport to="body">
        <div v-if="overlayOpen" class="docs-mermaid-overlay" @click.self="closeOverlay">
            <div class="docs-mermaid-overlay-bar">
                <div class="docs-mermaid-overlay-controls">
                    <button type="button" title="Zoom out" @click="zoomBy(1 / 1.25)">−</button>
                    <button type="button" title="Reset view" @click="resetView">⟲</button>
                    <button type="button" title="Zoom in" @click="zoomBy(1.25)">+</button>
                    <span class="docs-mermaid-zoom-label">{{ Math.round(zoom * 100) }}%</span>
                </div>
                <button
                    type="button"
                    class="docs-mermaid-close"
                    title="Close (Esc)"
                    @click="closeOverlay"
                >
                    ✕
                </button>
            </div>
            <div
                class="docs-mermaid-stage"
                @wheel="onWheel"
                @pointerdown="onDragStart"
                @pointermove="onDragMove"
                @pointerup="onDragEnd"
                @pointercancel="onDragEnd"
            >
                <div
                    class="docs-mermaid-canvas"
                    :style="{ transform: `translate(${panX}px, ${panY}px) scale(${zoom})` }"
                    v-html="svg"
                ></div>
            </div>
        </div>
    </Teleport>
</template>

<style scoped>
.docs-mermaid-wrap {
    position: relative;
    margin: 1.5rem 0;
}

.docs-mermaid {
    padding: 1.25rem;
    border: 1px solid var(--rd-border);
    background: var(--rd-bg-soft);
    overflow-x: auto;
    text-align: center;
}

.docs-mermaid :deep(svg) {
    max-width: 100%;
    height: auto;
}

.docs-mermaid :deep(.mermaid-error) {
    margin: 0;
    text-align: left;
    font-family: "JetBrains Mono", monospace;
    font-size: 0.82rem;
    white-space: pre-wrap;
}

.docs-mermaid :deep(.edgePaths path),
.docs-mermaid :deep(.edgePath path),
.docs-mermaid :deep(.flowchart-link) {
    stroke: var(--rd-text) !important;
    stroke-width: 1.5px !important;
}

.docs-mermaid :deep(.edgeLabels .edgeLabel),
.docs-mermaid :deep(.edgeLabel) {
    color: var(--rd-text) !important;
}

.docs-mermaid :deep(.edgeLabels .edgeLabel rect),
.docs-mermaid :deep(.edgeLabel rect) {
    fill: var(--rd-bg-soft) !important;
}

.docs-mermaid :deep(.edgeLabels .edgeLabel text),
.docs-mermaid :deep(.edgeLabel text) {
    fill: var(--rd-text) !important;
}

.docs-mermaid :deep(.edgeLabels foreignObject div),
.docs-mermaid :deep(.edgeLabels foreignObject span),
.docs-mermaid :deep(.edgeLabel foreignObject div),
.docs-mermaid :deep(.edgeLabel foreignObject span) {
    color: var(--rd-text) !important;
}

.docs-mermaid :deep(.actor-line),
.docs-mermaid :deep(.messageLine0),
.docs-mermaid :deep(.messageLine1),
.docs-mermaid :deep(.messageLine) {
    stroke: var(--rd-text) !important;
    stroke-width: 1.5px !important;
}

.docs-mermaid :deep(.messageText),
.docs-mermaid :deep(.messageText foreignObject div),
.docs-mermaid :deep(.messageText foreignObject span),
.docs-mermaid :deep(.messageText text) {
    color: var(--rd-text) !important;
    fill: var(--rd-text) !important;
}

.docs-mermaid :deep(.noteText),
.docs-mermaid :deep(.note foreignObject div),
.docs-mermaid :deep(.note foreignObject span),
.docs-mermaid :deep(.note text) {
    color: var(--rd-text) !important;
    fill: var(--rd-text) !important;
}

.docs-mermaid-expand {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    padding: 0.25rem 0.55rem;
    border: 1px solid var(--rd-border);
    border-radius: 6px;
    background: var(--rd-bg);
    color: var(--rd-text);
    font-size: 0.78rem;
    cursor: pointer;
    opacity: 0.7;
    transition: opacity 0.15s;
}

.docs-mermaid-expand:hover {
    opacity: 1;
}

.docs-mermaid-overlay {
    position: fixed;
    inset: 0;
    z-index: 1000;
    display: flex;
    flex-direction: column;
    background: rgba(0, 0, 0, 0.85);
}

.docs-mermaid-overlay-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.5rem 0.75rem;
    background: rgba(0, 0, 0, 0.4);
    color: #fff;
}

.docs-mermaid-overlay-controls {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
}

.docs-mermaid-overlay-controls button {
    width: 2rem;
    height: 2rem;
    border: 1px solid rgba(255, 255, 255, 0.25);
    border-radius: 6px;
    background: rgba(255, 255, 255, 0.08);
    color: #fff;
    font-size: 1.1rem;
    line-height: 1;
    cursor: pointer;
}

.docs-mermaid-overlay-controls button:hover {
    background: rgba(255, 255, 255, 0.18);
}

.docs-mermaid-zoom-label {
    margin-left: 0.4rem;
    font-size: 0.85rem;
    color: rgba(255, 255, 255, 0.7);
    min-width: 3.5rem;
}

.docs-mermaid-close {
    width: 2rem;
    height: 2rem;
    border: 1px solid rgba(255, 255, 255, 0.25);
    border-radius: 6px;
    background: rgba(255, 255, 255, 0.08);
    color: #fff;
    font-size: 1rem;
    cursor: pointer;
}

.docs-mermaid-close:hover {
    background: rgba(255, 255, 255, 0.18);
}

.docs-mermaid-stage {
    flex: 1;
    overflow: hidden;
    cursor: grab;
    touch-action: none;
}

.docs-mermaid-stage:active {
    cursor: grabbing;
}

.docs-mermaid-canvas {
    transform-origin: center center;
    transition: transform 0.05s linear;
    will-change: transform;
}

.docs-mermaid-canvas :deep(svg) {
    display: block;
    margin: auto;
    max-width: none;
    height: auto;
}

.docs-mermaid-canvas :deep(.edgePaths path),
.docs-mermaid-canvas :deep(.edgePath path),
.docs-mermaid-canvas :deep(.flowchart-link) {
    stroke: #e0e0e0 !important;
    stroke-width: 1.5px !important;
}

.docs-mermaid-canvas :deep(.edgeLabels .edgeLabel),
.docs-mermaid-canvas :deep(.edgeLabel) {
    color: #e0e0e0 !important;
}

.docs-mermaid-canvas :deep(.edgeLabels .edgeLabel rect),
.docs-mermaid-canvas :deep(.edgeLabel rect) {
    fill: rgba(0, 0, 0, 0.6) !important;
}

.docs-mermaid-canvas :deep(.edgeLabels .edgeLabel text),
.docs-mermaid-canvas :deep(.edgeLabel text) {
    fill: #e0e0e0 !important;
}

.docs-mermaid-canvas :deep(.edgeLabels foreignObject div),
.docs-mermaid-canvas :deep(.edgeLabels foreignObject span),
.docs-mermaid-canvas :deep(.edgeLabel foreignObject div),
.docs-mermaid-canvas :deep(.edgeLabel foreignObject span) {
    color: #e0e0e0 !important;
}

.docs-mermaid-canvas :deep(.actor-line),
.docs-mermaid-canvas :deep(.messageLine0),
.docs-mermaid-canvas :deep(.messageLine1),
.docs-mermaid-canvas :deep(.messageLine) {
    stroke: #e0e0e0 !important;
    stroke-width: 1.5px !important;
}

.docs-mermaid-canvas :deep(.messageText),
.docs-mermaid-canvas :deep(.messageText foreignObject div),
.docs-mermaid-canvas :deep(.messageText foreignObject span),
.docs-mermaid-canvas :deep(.messageText text) {
    color: #e0e0e0 !important;
    fill: #e0e0e0 !important;
}

.docs-mermaid-canvas :deep(.noteText),
.docs-mermaid-canvas :deep(.note foreignObject div),
.docs-mermaid-canvas :deep(.note foreignObject span),
.docs-mermaid-canvas :deep(.note text) {
    color: #e0e0e0 !important;
    fill: #e0e0e0 !important;
}
</style>
