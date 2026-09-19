<script setup lang="ts">
/**
 * Closing call-to-action: install the package and start reading. Section
 * component of the Home composition.
 */
import { withBase } from "vitepress";
import { ArrowRight, ArrowUpRight, BookOpen, Package } from "@lucide/vue";
</script>

<template>
    <section class="home-cta" aria-labelledby="home-cta-title">
        <div class="home-cta-inner">
            <p class="home-cta-kicker" aria-hidden="true">始める</p>
            <h2 id="home-cta-title" class="home-cta-title">Ready to build?</h2>
            <p class="home-cta-lede">
                Install the package and make your first typed call in under a minute.
            </p>
            <div class="home-cta-actions">
                <a class="home-btn home-btn--solid" :href="withBase('/getting-started')">
                    <BookOpen :size="16" aria-hidden="true" /> Get started
                    <ArrowRight :size="15" aria-hidden="true" />
                </a>
                <a
                    class="home-btn"
                    :href="withBase('/typedoc/classes/AniLink.AniLink.html')"
                    target="_self"
                >
                    <Package :size="16" aria-hidden="true" /> API reference
                    <ArrowUpRight :size="13" aria-hidden="true" />
                </a>
            </div>
        </div>
    </section>
</template>

<style scoped>
/* ------------------------------------------------------------------ */
/* CLOSING CTA                                                        */
/* ------------------------------------------------------------------ */

.home-cta {
    max-width: var(--home-inner);
    margin: var(--home-gap) auto 50px;
    padding: 0 2.5rem;
}

.home-cta-inner {
    border: 1px solid var(--rd-border);
    background:
        radial-gradient(
            700px 300px at 90% -20%,
            color-mix(in srgb, var(--rd-accent) 10%, transparent),
            transparent 60%
        ),
        color-mix(in srgb, var(--rd-bg-soft) 55%, transparent);
    padding: clamp(2.5rem, 6vw, 4rem) clamp(1.75rem, 5vw, 3.5rem);
    text-align: center;
    position: relative;
    overflow: hidden;
}

.home-cta-kicker {
    font-family: "Zen Old Mincho", "Shippori Mincho", serif;
    font-size: 0.85rem;
    font-weight: 700;
    letter-spacing: 0.3em;
    color: var(--rd-accent);
    margin: 0 0 0.75rem;
}

.home-cta-title {
    font-family: "Zen Old Mincho", "Shippori Mincho", serif;
    font-size: clamp(2rem, 5vw, 2.8rem);
    font-weight: 900;
    margin: 0 0 0.75rem;
    color: var(--rd-text);
}

.home-cta-lede {
    font-size: 1.05rem;
    color: var(--rd-text-soft);
    margin: 0 0 1.75rem;
}

.home-cta-actions {
    display: flex;
    gap: 0.75rem;
    justify-content: center;
    flex-wrap: wrap;
}

/* ------------------------------------------------------------------ */
/* RESPONSIVE                                                         */
/* ------------------------------------------------------------------ */

@media (max-width: 720px) {
    .home-cta {
        padding-left: 1.25rem;
        padding-right: 1.25rem;
    }
}
</style>
