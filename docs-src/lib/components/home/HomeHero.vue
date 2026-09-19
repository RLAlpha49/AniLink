<script setup lang="ts">
/**
 * Landing hero: display title, lede, action buttons, and the at-a-glance
 * stats card with the version tag. Section component of the Home
 * composition; owns the hero markup and scoped styles.
 */
import { withBase } from "vitepress";
import { ArrowUpRight, BookOpen, Library } from "@lucide/vue";

declare const __ANILINK_VERSION__: string;
const anilinkVersion = __ANILINK_VERSION__;

/* ------------------------------------------------------------------ */
/* Stats strip                                                         */
/* ------------------------------------------------------------------ */

const stats = [
    { value: "2", label: "Providers" },
    { value: "1", label: "Client class" },
    { value: "100%", label: "Typed end-to-end" },
];
</script>

<template>
    <section class="home-hero" aria-labelledby="home-hero-title">
        <div class="home-hero-grid">
            <div class="home-hero-text">
                <p class="home-kicker">
                    <span class="home-kicker-mark" aria-hidden="true">墨</span>
                    文書 · Documentation
                </p>
                <h1 id="home-hero-title" class="home-hero-title">
                    AniLink
                    <span class="home-hero-title-jp" aria-hidden="true">アニリンク</span>
                </h1>
                <p class="home-hero-lede">
                    A typed TypeScript client for the AniList GraphQL and MyAnimeList REST APIs. One
                    class, two isolated providers, normalized errors, retries, pacing, and a
                    generated operation reference.
                </p>
                <div class="home-hero-actions">
                    <a class="home-btn home-btn--solid" :href="withBase('/getting-started')">
                        <BookOpen :size="16" aria-hidden="true" /> Begin reading
                    </a>
                    <a class="home-btn" :href="withBase('/operations/index')">
                        <Library :size="16" aria-hidden="true" /> Operation reference
                    </a>
                    <a class="home-btn home-btn--ghost" href="https://github.com/RLAlpha49/AniLink">
                        GitHub <ArrowUpRight :size="14" aria-hidden="true" />
                    </a>
                </div>
            </div>

            <aside class="home-hero-card" aria-label="At a glance">
                <div class="home-hero-card-head">
                    <span class="home-hero-card-tag">v{{ anilinkVersion }}</span>
                    <span class="home-hero-card-vert" aria-hidden="true">型安全</span>
                </div>
                <dl class="home-hero-stats">
                    <div v-for="s in stats" :key="s.label" class="home-hero-stat">
                        <dt class="home-hero-stat-value">{{ s.value }}</dt>
                        <dd class="home-hero-stat-label">{{ s.label }}</dd>
                    </div>
                </dl>
                <p class="home-hero-card-foot">ESM-only · Node.js ≥ 22 · MIT licensed</p>
            </aside>
        </div>

        <div class="home-hero-rule" aria-hidden="true">
            <span class="home-hero-rule-cap"></span>
            <span class="home-hero-rule-line"></span>
            <span class="home-hero-rule-cap"></span>
        </div>
    </section>
</template>

<style scoped>
/* ------------------------------------------------------------------ */
/* HERO                                                               */
/* ------------------------------------------------------------------ */

.home-hero {
    max-width: var(--home-inner);
    margin: 0 auto;
    padding: clamp(2rem, 5vw, 3.5rem) 2.5rem 0;
}

.home-hero-grid {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: clamp(2rem, 5vw, 4rem);
    align-items: start;
}

.home-kicker {
    display: inline-flex;
    align-items: center;
    gap: 0.6rem;
    font-size: 0.75rem;
    letter-spacing: 0.3em;
    text-transform: uppercase;
    color: var(--rd-accent);
    margin: 0 0 1.4rem;
}

.home-kicker-mark {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1.7rem;
    height: 1.7rem;
    border: 1.5px solid var(--rd-accent);
    color: var(--rd-accent);
    font-family: "Zen Old Mincho", "Shippori Mincho", serif;
    font-size: 0.95rem;
    font-weight: 700;
    letter-spacing: 0;
}

.home-hero-title {
    font-family: "Zen Old Mincho", "Shippori Mincho", serif;
    font-size: clamp(3.4rem, 9vw, 5.6rem);
    font-weight: 900;
    letter-spacing: 0.02em;
    line-height: 0.95;
    margin: 0 0 1.5rem;
    color: var(--rd-text);
    display: flex;
    align-items: baseline;
    flex-wrap: wrap;
    gap: 0.4em;
}

.home-hero-title-jp {
    font-size: clamp(1.1rem, 2.4vw, 1.6rem);
    font-weight: 500;
    letter-spacing: 0.18em;
    color: var(--rd-text-soft);
    align-self: center;
    border-left: 1px solid var(--rd-border);
    padding-left: 0.6em;
    margin-left: 0.1em;
}

.home-hero-lede {
    font-size: 1.12rem;
    line-height: 1.8;
    color: var(--rd-text-soft);
    max-width: 34em;
    margin: 0 0 2rem;
}

.home-hero-actions {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
}

/* hero stat card */
.home-hero-card {
    width: clamp(15rem, 22vw, 18rem);
    border: 1px solid var(--rd-border);
    background: color-mix(in srgb, var(--rd-bg-soft) 60%, transparent);
    padding: 1.4rem 1.5rem 1.25rem;
    position: relative;
    overflow: hidden;
}

.home-hero-card::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 3px;
    background: var(--rd-accent);
}

.home-hero-card-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1.25rem;
}

.home-hero-card-tag {
    font-family: "JetBrains Mono", monospace;
    font-size: 0.72rem;
    font-weight: 600;
    letter-spacing: 0.05em;
    color: var(--rd-text-soft);
    border: 1px solid var(--rd-border);
    padding: 0.15rem 0.5rem;
}

.home-hero-card-vert {
    writing-mode: vertical-rl;
    font-family: "Zen Old Mincho", "Shippori Mincho", serif;
    font-size: 0.85rem;
    font-weight: 700;
    letter-spacing: 0.3em;
    color: var(--rd-accent);
    opacity: 0.85;
}

.home-hero-stats {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.1rem 1rem;
    margin: 0 0 1.25rem;
}

.home-hero-stat {
    margin: 0;
}

.home-hero-stat-value {
    font-family: "Zen Old Mincho", "Shippori Mincho", serif;
    font-size: 1.85rem;
    font-weight: 900;
    line-height: 1;
    color: var(--rd-text);
    margin-bottom: 0.25rem;
}

.home-hero-stat-label {
    margin: 0;
    font-size: 0.74rem;
    letter-spacing: 0.04em;
    color: var(--rd-text-soft);
}

.home-hero-card-foot {
    margin: 0;
    padding-top: 0.9rem;
    border-top: 1px solid var(--rd-border);
    font-family: "JetBrains Mono", monospace;
    font-size: 0.7rem;
    letter-spacing: 0.02em;
    color: var(--rd-text-soft);
}

/* hero rule with seal */
.home-hero-rule {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    max-width: var(--home-inner);
    margin: clamp(2.5rem, 5vw, 3.5rem) auto clamp(2.5rem, 5vw, 3.5rem);
    padding: 0 2.5rem;
}

.home-hero-rule-cap {
    width: 0.5rem;
    height: 0.5rem;
    background: var(--rd-accent);
    flex-shrink: 0;
    transform: rotate(45deg);
}

.home-hero-rule-line {
    flex: 1;
    height: 1px;
    background: var(--rd-border);
}

/* ------------------------------------------------------------------ */
/* RESPONSIVE                                                         */
/* ------------------------------------------------------------------ */

@media (max-width: 980px) {
    .home-hero-grid {
        grid-template-columns: 1fr;
    }

    .home-hero-card {
        width: 100%;
        max-width: 24rem;
    }
}

@media (max-width: 720px) {
    .home-hero,
    .home-hero-rule {
        padding-left: 1.25rem;
        padding-right: 1.25rem;
    }

    .home-hero-title {
        font-size: clamp(2.8rem, 14vw, 3.6rem);
    }

    .home-hero-title-jp {
        display: none;
    }
}
</style>
