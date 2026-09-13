<script setup lang="ts">
/**
 * Editorial landing page for the AniLink documentation.
 *
 * Breaks out of the constrained reading column into a full-width, multi-section
 * composition that honors the Sumi (墨, ink) / Yoru (夜, night) aesthetic of the
 * rest of the site: Zen Old Mincho display type, vermillion/gold accents, paper
 * grain, and vertical Japanese text motifs. All content is static and SSR-safe.
 *
 * Thin composition: each section (hero, code showcase, features, provider
 * comparison, docs index, CTA) lives in its own component under home/, owning
 * its data and scoped styles. This file owns the shared entrance animation
 * state and the section-level layout tokens the sections consume.
 */
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import HomeHero from "./home/HomeHero.vue";
import HomeCodePanel from "./home/HomeCodePanel.vue";
import HomeFeatures from "./home/HomeFeatures.vue";
import HomeCompare from "./home/HomeCompare.vue";
import HomeDocsIndex from "./home/HomeDocsIndex.vue";
import HomeCta from "./home/HomeCta.vue";

/* ------------------------------------------------------------------ */
/* Entrance animation — staggered reveal on mount, SSR-safe            */
/* ------------------------------------------------------------------ */

const mounted = ref(false);

onMounted(() => {
    // Defer to next frame so the initial paint completes before transitions fire.
    requestAnimationFrame(() => {
        mounted.value = true;
    });
});

onBeforeUnmount(() => {
    mounted.value = false;
});

const rootClass = computed(() => ({
    "home--ready": mounted.value,
}));
</script>

<template>
    <div class="home" :class="rootClass">
        <HomeHero />
        <HomeCodePanel />
        <HomeFeatures />
        <HomeCompare />
        <HomeDocsIndex />
        <HomeCta />
    </div>
</template>

<style scoped>
/* ================================================================== */
/* Home — full-width editorial landing. Uses the DocsLayout tokens.   */
/* ================================================================== */

.home {
    --home-gap: clamp(4rem, 8vw, 6.5rem);
    --home-inner: min(72rem, 100%);
    width: 100%;
}

.home-section {
    max-width: var(--home-inner);
    margin: 0 auto;
    padding: 0 2.5rem;
}

/* ------------------------------------------------------------------ */
/* Entrance animation — staggered fade/rise. The `--ready` class is    */
/* toggled one frame after mount so SSR markup paints first.          */
/* ------------------------------------------------------------------ */

.home > section {
    opacity: 0;
    transform: translateY(14px);
    transition:
        opacity 0.7s cubic-bezier(0.22, 1, 0.36, 1),
        transform 0.7s cubic-bezier(0.22, 1, 0.36, 1);
}

.home--ready > section {
    opacity: 1;
    transform: none;
}

.home--ready > section:nth-child(1) {
    transition-delay: 0s;
}
.home--ready > section:nth-child(2) {
    transition-delay: 0.08s;
}
.home--ready > section:nth-child(3) {
    transition-delay: 0.16s;
}
.home--ready > section:nth-child(4) {
    transition-delay: 0.24s;
}
.home--ready > section:nth-child(5) {
    transition-delay: 0.32s;
}
.home--ready > section:nth-child(6) {
    transition-delay: 0.4s;
}

@media (prefers-reduced-motion: reduce) {
    .home > section {
        opacity: 1;
        transform: none;
        transition: none;
    }
}

/* ------------------------------------------------------------------ */
/* Shared section header                                              */
/* ------------------------------------------------------------------ */

.home-section + .home-section {
    padding-top: var(--home-gap);
}

/* The section header and buttons render inside the section components,
   so their shared skins use :deep() to reach past the child scope. */

.home :deep(.home-section-head) {
    max-width: 46rem;
    margin-bottom: 2.5rem;
}

.home :deep(.home-section-kicker) {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    margin: 0 0 0.9rem;
    font-family: "Zen Old Mincho", "Shippori Mincho", serif;
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: var(--rd-accent);
}

.home :deep(.home-section-title) {
    font-family: "Zen Old Mincho", "Shippori Mincho", serif;
    font-size: clamp(1.7rem, 3.4vw, 2.3rem);
    font-weight: 900;
    line-height: 1.15;
    letter-spacing: 0.01em;
    margin: 0 0 0.9rem;
    color: var(--rd-text);
}

.home :deep(.home-section-lede) {
    font-size: 1.02rem;
    line-height: 1.75;
    color: var(--rd-text-soft);
    margin: 0;
}

/* ------------------------------------------------------------------ */
/* Buttons (home-scoped, mirror DocsLayout .docs-btn)                 */
/* ------------------------------------------------------------------ */

.home :deep(.home-btn) {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    padding: 0.6rem 1.35rem;
    border: 1.5px solid var(--rd-text);
    color: var(--rd-text);
    text-decoration: none;
    font-weight: 600;
    font-size: 0.9rem;
    background: transparent;
    transition:
        background 0.15s ease,
        color 0.15s ease,
        border-color 0.15s ease,
        transform 0.15s ease;
}

.home :deep(.home-btn:hover) {
    text-decoration: none;
    background: color-mix(in srgb, var(--rd-text) 6%, transparent);
}

.home :deep(.home-btn--solid) {
    background: var(--rd-text);
    color: var(--rd-bg);
}

.home :deep(.home-btn--ghost) {
    border-color: var(--rd-border);
    color: var(--rd-text-soft);
}

.home :deep(.home-btn--ghost:hover) {
    border-color: var(--rd-text);
    color: var(--rd-text);
}

.home :deep(.home-btn--solid:hover) {
    background: #000;
}

html.dark .home :deep(.home-btn--solid) {
    background: var(--rd-accent);
    color: var(--rd-bg);
    border-color: var(--rd-accent);
}

html.dark .home :deep(.home-btn--solid:hover) {
    background: #e0bd84;
    border-color: #e0bd84;
}

/* ------------------------------------------------------------------ */
/* RESPONSIVE                                                         */
/* ------------------------------------------------------------------ */

@media (max-width: 720px) {
    .home-section {
        padding-left: 1.25rem;
        padding-right: 1.25rem;
    }
}
</style>
