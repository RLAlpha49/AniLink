<script setup lang="ts">
// Custom 404 view for the AniLink docs. Rendered by DocsLayout for any
// not-found route (page.isNotFound) and embedded in 404.md for the static
// 404.html entry point. Theme tokens (--rd-*) are inherited from .docs.
import { BookOpen, Home, Library, Rocket } from "@lucide/vue";
</script>

<template>
    <div class="nf">
        <p class="nf-code">404</p>
        <h1 class="nf-title">Page not found</h1>
        <p class="nf-message">
            The page you were looking for has wandered off — or never existed in the first place.
            Use one of the entry points below to get back on track.
        </p>
        <div class="nf-actions">
            <a class="nf-btn nf-btn--primary" href="/">
                <Home :size="16" aria-hidden="true" /> Home
            </a>
            <a class="nf-btn" href="/introduction">
                <BookOpen :size="16" aria-hidden="true" /> Introduction
            </a>
            <a class="nf-btn" href="/getting-started">
                <Rocket :size="16" aria-hidden="true" /> Getting started
            </a>
            <a class="nf-btn" href="/operations/index">
                <Library :size="16" aria-hidden="true" /> Operation reference
            </a>
        </div>
    </div>
</template>

<style scoped>
.nf {
    min-height: 60vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    gap: 0.75rem;
    padding: 2rem 1.25rem;
}

.nf-code {
    margin: 0;
    font-size: clamp(5rem, 18vw, 9rem);
    font-weight: 900;
    letter-spacing: -0.04em;
    line-height: 1;
    color: var(--rd-accent);
}

.nf-title {
    margin: 0;
    font-size: 1.4rem;
    font-weight: 700;
    color: var(--rd-text);
}

.nf-message {
    margin: 0 0 1.25rem;
    max-width: 34em;
    color: var(--rd-text-soft);
    line-height: 1.7;
}

.nf-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.6rem;
    justify-content: center;
}

.nf-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    padding: 0.5rem 1.2rem;
    border: 1px solid var(--rd-border);
    color: var(--rd-text);
    text-decoration: none;
    font-weight: 600;
    font-size: 0.9rem;
}

.nf-btn:hover {
    border-color: var(--rd-accent);
    color: var(--rd-accent);
}

.nf-btn--primary {
    background: var(--rd-text);
    border-color: var(--rd-text);
    color: var(--rd-bg);
}
</style>
