<script setup lang="ts">
/**
 * Documentation index — the reading-path sections and the provider guide
 * chips. Section component of the Home composition; derives its page lists
 * from the single source of truth in content.ts.
 */
import { withBase } from "vitepress";
import { BookOpen, Disc, Square } from "@lucide/vue";
import { PAGES, type DocPage } from "../../content";

interface DocSection {
    title: string;
    kicker: string;
    pages: DocPage[];
}

const docSections: DocSection[] = [
    {
        kicker: "Start here",
        title: "Getting oriented",
        pages: PAGES.filter((p) => p.section === "start"),
    },
    {
        kicker: "Core concepts",
        title: "The transport layer",
        pages: PAGES.filter((p) => p.section === "core"),
    },
    {
        kicker: "Cookbook",
        title: "Patterns & recipes",
        pages: PAGES.filter((p) => p.section === "cookbook"),
    },
];

const anilistGuidePages = PAGES.filter((p) => p.section === "anilist");
const malGuidePages = PAGES.filter((p) => p.section === "mal");
</script>

<template>
    <section class="home-section home-docs" aria-labelledby="home-docs-title">
        <header class="home-section-head">
            <p class="home-section-kicker">
                <BookOpen :size="13" aria-hidden="true" /> The documentation
            </p>
            <h2 id="home-docs-title" class="home-section-title">Where to start reading</h2>
            <p class="home-section-lede">
                The docs are organized as a single reading path. Begin with the start guides, move
                through the core transport concepts, then branch into provider-specific guides and
                the generated operation reference.
            </p>
        </header>

        <div class="home-docs-grid">
            <section v-for="sec in docSections" :key="sec.title" class="home-docs-block">
                <p class="home-docs-block-kicker">{{ sec.kicker }}</p>
                <h3 class="home-docs-block-title">{{ sec.title }}</h3>
                <ul class="home-docs-list">
                    <li v-for="p in sec.pages" :key="p.path">
                        <a :href="withBase(p.path)" class="home-docs-link">
                            <span class="home-docs-link-title">{{ p.title }}</span>
                            <span class="home-docs-link-summary">{{ p.summary }}</span>
                        </a>
                    </li>
                </ul>
            </section>
        </div>

        <div class="home-docs-providers">
            <section class="home-docs-block home-docs-block--provider">
                <p class="home-docs-block-kicker">
                    <Disc :size="11" :stroke-width="2.5" aria-hidden="true" /> AniList · GraphQL
                </p>
                <h3 class="home-docs-block-title">AniList guides</h3>
                <ul class="home-docs-list home-docs-list--inline">
                    <li v-for="p in anilistGuidePages" :key="p.path">
                        <a :href="withBase(p.path)" class="home-docs-chip home-docs-chip--anilist">
                            {{ p.title }}
                        </a>
                    </li>
                </ul>
            </section>
            <section class="home-docs-block home-docs-block--provider">
                <p class="home-docs-block-kicker">
                    <Square :size="11" :stroke-width="2.5" aria-hidden="true" /> MyAnimeList · REST
                </p>
                <h3 class="home-docs-block-title">MAL guides</h3>
                <ul class="home-docs-list home-docs-list--inline">
                    <li v-for="p in malGuidePages" :key="p.path">
                        <a :href="withBase(p.path)" class="home-docs-chip home-docs-chip--mal">
                            {{ p.title }}
                        </a>
                    </li>
                </ul>
            </section>
        </div>
    </section>
</template>

<style scoped>
/* ------------------------------------------------------------------ */
/* DOCUMENTATION INDEX                                                */
/* ------------------------------------------------------------------ */

.home-docs-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1.5rem;
    margin-bottom: 2.5rem;
}

.home-docs-block {
    border: 1px solid var(--rd-border);
    background: color-mix(in srgb, var(--rd-bg) 55%, transparent);
    padding: 1.5rem 1.5rem 1.25rem;
}

.home-docs-block-kicker {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    margin: 0 0 0.5rem;
    font-family: "Zen Old Mincho", "Shippori Mincho", serif;
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--rd-text-soft);
}

.home-docs-block-title {
    font-family: "Zen Old Mincho", "Shippori Mincho", serif;
    font-size: 1.2rem;
    font-weight: 700;
    margin: 0 0 1rem;
    color: var(--rd-text);
}

.home-docs-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
}

.home-docs-link {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
    padding: 0.55rem 0;
    border-top: 1px solid var(--rd-border);
    text-decoration: none;
    transition: padding-left 0.18s ease;
}

.home-docs-link:hover {
    text-decoration: none;
    padding-left: 0.4rem;
}

.home-docs-link-title {
    font-weight: 600;
    font-size: 0.92rem;
    color: var(--rd-text);
}

.home-docs-link:hover .home-docs-link-title {
    color: var(--rd-accent);
}

.home-docs-link-summary {
    font-size: 0.8rem;
    line-height: 1.5;
    color: var(--rd-text-soft);
}

/* provider guide chips */
.home-docs-providers {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;
}

.home-docs-block--provider {
    border-left: 3px solid var(--rd-border);
}

.home-docs-list--inline {
    flex-direction: row;
    flex-wrap: wrap;
    gap: 0.5rem;
}

.home-docs-chip {
    display: inline-flex;
    align-items: center;
    padding: 0.35rem 0.8rem;
    border: 1px solid var(--rd-border);
    font-size: 0.82rem;
    font-weight: 500;
    color: var(--rd-text-soft);
    text-decoration: none;
    transition:
        border-color 0.15s ease,
        color 0.15s ease,
        background 0.15s ease;
}

.home-docs-chip:hover {
    text-decoration: none;
}

.home-docs-chip--anilist:hover {
    border-color: var(--rd-anilist);
    color: var(--rd-anilist);
    background: var(--rd-anilist-soft);
}

.home-docs-chip--mal:hover {
    border-color: var(--rd-mal);
    color: var(--rd-mal);
    background: var(--rd-mal-soft);
}

/* ------------------------------------------------------------------ */
/* RESPONSIVE                                                         */
/* ------------------------------------------------------------------ */

@media (max-width: 980px) {
    .home-docs-grid {
        grid-template-columns: 1fr;
    }
}

@media (max-width: 720px) {
    .home-docs-providers {
        grid-template-columns: 1fr;
    }
}
</style>
