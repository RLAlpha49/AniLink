<script setup lang="ts">
/**
 * Feature grid — six cards describing the library's cross-cutting plumbing.
 * Section component of the Home composition; owns the feature data and
 * scoped styles.
 */
import { Activity, Boxes, Layers, ShieldCheck, Sparkles, Timer, Zap } from "@lucide/vue";

interface FeatureCard {
    icon: typeof Zap;
    title: string;
    body: string;
}

const features: FeatureCard[] = [
    {
        icon: Boxes,
        title: "Typed operations",
        body: "Every query, page query, and mutation ships with typed variables and a typed response, generated from the provider schemas. No hand-written GraphQL shapes.",
    },
    {
        icon: ShieldCheck,
        title: "Normalized errors",
        body: "Provider failures become AniLinkError subclasses with stable code values. Classify failures by code, not by parsing message strings.",
    },
    {
        icon: Zap,
        title: "Resilience built in",
        body: "Retries with jittered backoff, optional rate-limit pacing, and an optional circuit breaker — identical behavior on both providers.",
    },
    {
        icon: Layers,
        title: "Provider isolation",
        body: "Credentials and transport settings are scoped per provider slot. A MAL token is never sent to AniList, and vice versa.",
    },
    {
        icon: Activity,
        title: "Observability hooks",
        body: "onRequestStart, onSuccess, onRetry, and onError fire at every stage of the request lifecycle. Instrument calls without wrapping a single method.",
    },
    {
        icon: Timer,
        title: "Cancellation & timeouts",
        body: "Pass an AbortSignal or a per-request timeout and the transport cancels in flight, releases the attempt, and surfaces a typed cancellation error.",
    },
];
</script>

<template>
    <section class="home-section home-features" aria-labelledby="home-features-title">
        <header class="home-section-head">
            <p class="home-section-kicker">
                <Sparkles :size="13" aria-hidden="true" /> Why AniLink
            </p>
            <h2 id="home-features-title" class="home-section-title">The plumbing, done once</h2>
            <p class="home-section-lede">
                Calling AniList or MAL directly means hand-rolling HTTP, GraphQL documents, OAuth
                flows, retry logic, and rate-limit handling. AniLink does that once, with types.
            </p>
        </header>

        <ul class="home-feature-grid">
            <li v-for="f in features" :key="f.title" class="home-feature">
                <span class="home-feature-icon" aria-hidden="true">
                    <component :is="f.icon" :size="20" :stroke-width="1.75" />
                </span>
                <h3 class="home-feature-title">{{ f.title }}</h3>
                <p class="home-feature-body">{{ f.body }}</p>
            </li>
        </ul>
    </section>
</template>

<style scoped>
/* ------------------------------------------------------------------ */
/* FEATURES                                                           */
/* ------------------------------------------------------------------ */

.home-feature-grid {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1px;
    background: var(--rd-border);
    border: 1px solid var(--rd-border);
}

.home-feature {
    background: color-mix(in srgb, var(--rd-bg) 65%, transparent);
    padding: 1.75rem 1.6rem 1.85rem;
    margin: 0;
    transition: background 0.2s ease;
}

.home-feature:hover {
    background: color-mix(in srgb, var(--rd-bg-soft) 80%, transparent);
}

.home-feature-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 2.6rem;
    height: 2.6rem;
    border: 1px solid var(--rd-border);
    color: var(--rd-accent);
    margin-bottom: 1.1rem;
    transition:
        border-color 0.2s ease,
        color 0.2s ease;
}

.home-feature:hover .home-feature-icon {
    border-color: var(--rd-accent);
}

.home-feature-title {
    font-family: "Zen Old Mincho", "Shippori Mincho", serif;
    font-size: 1.12rem;
    font-weight: 700;
    margin: 0 0 0.55rem;
    color: var(--rd-text);
}

.home-feature-body {
    font-size: 0.9rem;
    line-height: 1.7;
    color: var(--rd-text-soft);
    margin: 0;
}

/* ------------------------------------------------------------------ */
/* RESPONSIVE                                                         */
/* ------------------------------------------------------------------ */

@media (max-width: 980px) {
    .home-feature-grid {
        grid-template-columns: repeat(2, 1fr);
    }
}

@media (max-width: 720px) {
    .home-feature-grid {
        grid-template-columns: 1fr;
    }
}
</style>
