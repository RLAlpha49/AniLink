<script setup lang="ts">
/**
 * Editorial landing page for the AniLink documentation.
 *
 * Breaks out of the constrained reading column into a full-width, multi-section
 * composition that honors the Sumi (墨, ink) / Yoru (夜, night) aesthetic of the
 * rest of the site: Zen Old Mincho display type, vermillion/gold accents, paper
 * grain, and vertical Japanese text motifs. All content is static and SSR-safe.
 */
import { computed, onMounted, onBeforeUnmount, ref } from "vue";
import { highlightTypeScript } from "../useShikiHighlighter";
import {
    Activity,
    ArrowRight,
    ArrowUpRight,
    BookOpen,
    Boxes,
    Disc,
    Layers,
    Library,
    Package,
    ShieldCheck,
    Sparkles,
    Square,
    Terminal,
    Timer,
    Zap,
} from "@lucide/vue";
import { PAGES, type DocPage } from "../content";

/* ------------------------------------------------------------------ */
/* Section model — derived from the single source of truth in content */
/* ------------------------------------------------------------------ */

interface FeatureCard {
    icon: typeof Zap;
    title: string;
    body: string;
}

interface DocSection {
    title: string;
    kicker: string;
    pages: DocPage[];
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

/* ------------------------------------------------------------------ */
/* Provider comparison rows                                            */
/* ------------------------------------------------------------------ */

interface CompareRow {
    label: string;
    anilist: string;
    mal: string;
}

const compareRows: CompareRow[] = [
    { label: "Protocol", anilist: "GraphQL", mal: "REST" },
    { label: "Namespace", anilist: "aniLink.anilist", mal: "aniLink.mal" },
    {
        label: "Surface",
        anilist: "Queries · Page · Mutations · custom()",
        mal: "anime.get · user.me",
    },
    { label: "Auth", anilist: "OAuth bearer token", mal: "PKCE OAuth2 access token" },
    { label: "Credential slot", anilist: "anilist.authToken", mal: "mal.accessToken" },
];

/* ------------------------------------------------------------------ */
/* Stats strip                                                         */
/* ------------------------------------------------------------------ */

const stats = [
    { value: "2", label: "Provider surfaces" },
    { value: "1", label: "Client class" },
    { value: "100%", label: "Typed end-to-end" },
];

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

/* ------------------------------------------------------------------ */
/* Code showcase — a representative typed call, syntax-highlighted    */
/* with the site's shared Shiki highlighter. The highlighter emits     */
/* dual-theme HTML (light/dark) whose token colors are mapped to the   */
/* site palette by the global .shiki rules in base.css. We populate    */
/* the highlighted HTML on mount (client-side) and fall back to a      */
/* plain <pre> for the SSR/initial paint so the panel is never empty.   */
/* ------------------------------------------------------------------ */

const codeSource = [
    'import { AniLink } from "anilink-api-wrapper";',
    "",
    "// One client, two isolated provider surfaces.",
    "const aniLink = new AniLink({",
    "    anilist: { authToken: process.env.ANILIST_TOKEN },",
    "    mal:     { accessToken: process.env.MAL_TOKEN },",
    "});",
    "",
    "// AniList — typed GraphQL, no token needed for public reads.",
    "const anime = await aniLink.anilist.query.media({",
    "    id: 21,",
    '    type: "ANIME",',
    "});",
    'console.log(anime.media?.title?.romaji); // → "One Piece"',
    "",
    "// MyAnimeList — typed REST, public fields need no token.",
    "const mal = await aniLink.mal.anime.get(21, {",
    '    fields: ["id", "title", "main_picture"],',
    "});",
    "console.log(mal.title);",
].join("\n");

const highlightedHtml = ref("");

onMounted(() => {
    highlightTypeScript(codeSource)
        .then((html) => {
            highlightedHtml.value = html;
        })
        .catch(() => {
            // Highlighting is a progressive enhancement; keep the plain fallback.
        });
});
</script>

<template>
    <div class="home" :class="rootClass">
        <!-- ============================================================ -->
        <!-- HERO                                                          -->
        <!-- ============================================================ -->
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
                        A typed TypeScript client for the AniList GraphQL and MyAnimeList REST APIs.
                        One class, two isolated provider surfaces, normalized errors, retries,
                        pacing, and a generated operation reference.
                    </p>
                    <div class="home-hero-actions">
                        <a class="home-btn home-btn--solid" href="/getting-started">
                            <BookOpen :size="16" aria-hidden="true" /> Begin reading
                        </a>
                        <a class="home-btn" href="/operations/index">
                            <Library :size="16" aria-hidden="true" /> Operation reference
                        </a>
                        <a
                            class="home-btn home-btn--ghost"
                            href="https://github.com/RLAlpha49/AniLink"
                        >
                            GitHub <ArrowUpRight :size="14" aria-hidden="true" />
                        </a>
                    </div>
                </div>

                <aside class="home-hero-card" aria-label="At a glance">
                    <div class="home-hero-card-head">
                        <span class="home-hero-card-tag">v2.0.0</span>
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

        <!-- ============================================================ -->
        <!-- CODE SHOWCASE                                                 -->
        <!-- ============================================================ -->
        <section class="home-section home-code" aria-labelledby="home-code-title">
            <header class="home-section-head">
                <p class="home-section-kicker">
                    <Terminal :size="13" aria-hidden="true" /> One client, two surfaces
                </p>
                <h2 id="home-code-title" class="home-section-title">
                    Typed from install to response
                </h2>
                <p class="home-section-lede">
                    Construct once with per-provider credentials. Each surface is fully typed —
                    variables in, responses out — and they never share a transport credential.
                </p>
            </header>

            <div class="home-code-panel">
                <div class="home-code-toolbar">
                    <span class="home-code-dots" aria-hidden="true">
                        <span></span><span></span><span></span>
                    </span>
                    <span class="home-code-lang">typescript</span>
                    <span class="home-code-file">example.ts</span>
                </div>
                <div class="home-code-scroll">
                    <!--
                        Highlighted (client): Shiki dual-theme HTML. The global
                        .shiki rules in base.css map --shiki-light/--shiki-dark
                        token colors to the site palette. Line numbers come from
                        the CSS counter on each .line Shiki emits.
                    -->
                    <div
                        v-if="highlightedHtml"
                        class="home-code-highlight"
                        v-html="highlightedHtml"
                    ></div>
                    <!--
                        Fallback (SSR / before highlighter resolves): a plain
                        <pre> so the panel is never empty and copy still works.
                    -->
                    <pre v-else class="home-code-body"><code>{{ codeSource }}</code></pre>
                </div>
            </div>
        </section>

        <!-- ============================================================ -->
        <!-- FEATURES                                                      -->
        <!-- ============================================================ -->
        <section class="home-section home-features" aria-labelledby="home-features-title">
            <header class="home-section-head">
                <p class="home-section-kicker">
                    <Sparkles :size="13" aria-hidden="true" /> Why AniLink
                </p>
                <h2 id="home-features-title" class="home-section-title">The plumbing, done once</h2>
                <p class="home-section-lede">
                    Calling AniList or MAL directly means hand-rolling HTTP, GraphQL documents,
                    OAuth flows, retry logic, and rate-limit handling. AniLink does that once, with
                    types.
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

        <!-- ============================================================ -->
        <!-- PROVIDER COMPARISON                                           -->
        <!-- ============================================================ -->
        <section class="home-section home-compare" aria-labelledby="home-compare-title">
            <header class="home-section-head">
                <p class="home-section-kicker">
                    <Layers :size="13" aria-hidden="true" /> Two providers, one client
                </p>
                <h2 id="home-compare-title" class="home-section-title">AniList & MyAnimeList</h2>
                <p class="home-section-lede">
                    The two surfaces share a transport layer — timeouts, retries, pacing, the
                    circuit breaker, hooks, error normalization — but never share credentials.
                </p>
            </header>

            <div class="home-compare-table">
                <div class="home-compare-header">
                    <span class="home-compare-corner"></span>
                    <span class="home-compare-col home-compare-col--anilist">
                        <Disc :size="14" :stroke-width="2.5" aria-hidden="true" /> AniList
                        <span class="home-compare-col-sub">GraphQL</span>
                    </span>
                    <span class="home-compare-col home-compare-col--mal">
                        <Square :size="14" :stroke-width="2.5" aria-hidden="true" /> MyAnimeList
                        <span class="home-compare-col-sub">REST</span>
                    </span>
                </div>
                <div v-for="row in compareRows" :key="row.label" class="home-compare-row">
                    <span class="home-compare-label">{{ row.label }}</span>
                    <span class="home-compare-cell home-compare-cell--anilist">{{
                        row.anilist
                    }}</span>
                    <span class="home-compare-cell home-compare-cell--mal">{{ row.mal }}</span>
                </div>
            </div>
        </section>

        <!-- ============================================================ -->
        <!-- DOCUMENTATION INDEX                                           -->
        <!-- ============================================================ -->
        <section class="home-section home-docs" aria-labelledby="home-docs-title">
            <header class="home-section-head">
                <p class="home-section-kicker">
                    <BookOpen :size="13" aria-hidden="true" /> The documentation
                </p>
                <h2 id="home-docs-title" class="home-section-title">Where to start reading</h2>
                <p class="home-section-lede">
                    The docs are organized as a single reading path. Begin with the start guides,
                    move through the core transport concepts, then branch into provider-specific
                    guides and the generated operation reference.
                </p>
            </header>

            <div class="home-docs-grid">
                <section v-for="sec in docSections" :key="sec.title" class="home-docs-block">
                    <p class="home-docs-block-kicker">{{ sec.kicker }}</p>
                    <h3 class="home-docs-block-title">{{ sec.title }}</h3>
                    <ul class="home-docs-list">
                        <li v-for="p in sec.pages" :key="p.path">
                            <a :href="p.path" class="home-docs-link">
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
                            <a :href="p.path" class="home-docs-chip home-docs-chip--anilist">
                                {{ p.title }}
                            </a>
                        </li>
                    </ul>
                </section>
                <section class="home-docs-block home-docs-block--provider">
                    <p class="home-docs-block-kicker">
                        <Square :size="11" :stroke-width="2.5" aria-hidden="true" /> MyAnimeList ·
                        REST
                    </p>
                    <h3 class="home-docs-block-title">MAL guides</h3>
                    <ul class="home-docs-list home-docs-list--inline">
                        <li v-for="p in malGuidePages" :key="p.path">
                            <a :href="p.path" class="home-docs-chip home-docs-chip--mal">
                                {{ p.title }}
                            </a>
                        </li>
                    </ul>
                </section>
            </div>
        </section>

        <!-- ============================================================ -->
        <!-- CLOSING CTA                                                   -->
        <!-- ============================================================ -->
        <section class="home-cta" aria-labelledby="home-cta-title">
            <div class="home-cta-inner">
                <p class="home-cta-kicker" aria-hidden="true">始める</p>
                <h2 id="home-cta-title" class="home-cta-title">Ready to build?</h2>
                <p class="home-cta-lede">
                    Install the package and make your first typed call in under a minute.
                </p>
                <div class="home-cta-actions">
                    <a class="home-btn home-btn--solid" href="/getting-started">
                        <BookOpen :size="16" aria-hidden="true" /> Get started
                        <ArrowRight :size="15" aria-hidden="true" />
                    </a>
                    <a class="home-btn" href="/typedoc/classes/AniLink.AniLink.html" target="_self">
                        <Package :size="16" aria-hidden="true" /> API reference
                        <ArrowUpRight :size="13" aria-hidden="true" />
                    </a>
                </div>
            </div>
        </section>
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

.home-section-head {
    max-width: 46rem;
    margin-bottom: 2.5rem;
}

.home-section + .home-section {
    padding-top: var(--home-gap);
}

.home-section-kicker {
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

.home-section-title {
    font-family: "Zen Old Mincho", "Shippori Mincho", serif;
    font-size: clamp(1.7rem, 3.4vw, 2.3rem);
    font-weight: 900;
    line-height: 1.15;
    letter-spacing: 0.01em;
    margin: 0 0 0.9rem;
    color: var(--rd-text);
}

.home-section-lede {
    font-size: 1.02rem;
    line-height: 1.75;
    color: var(--rd-text-soft);
    margin: 0;
}

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
/* Buttons (home-scoped, mirror DocsLayout .docs-btn)                 */
/* ------------------------------------------------------------------ */

.home-btn {
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

.home-btn:hover {
    text-decoration: none;
    background: color-mix(in srgb, var(--rd-text) 6%, transparent);
}

.home-btn--solid {
    background: var(--rd-text);
    color: var(--rd-bg);
}

.home-btn--ghost {
    border-color: var(--rd-border);
    color: var(--rd-text-soft);
}

.home-btn--ghost:hover {
    border-color: var(--rd-text);
    color: var(--rd-text);
}

.theme-light .home .home-btn--solid:hover {
    background: #000;
}

.theme-dark .home .home-btn--solid {
    background: var(--rd-accent);
    color: var(--rd-bg);
    border-color: var(--rd-accent);
}

.theme-dark .home .home-btn--solid:hover {
    background: #e0bd84;
    border-color: #e0bd84;
}

/* ------------------------------------------------------------------ */
/* CODE SHOWCASE                                                      */
/* ------------------------------------------------------------------ */

.home-code-panel {
    border: 1px solid var(--rd-border);
    background: var(--rd-code-bg);
    overflow: hidden;
    box-shadow:
        0 1px 0 color-mix(in srgb, var(--rd-text) 4%, transparent),
        0 18px 40px -28px color-mix(in srgb, var(--rd-text) 30%, transparent);
}

.home-code-toolbar {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.55rem 1rem;
    border-bottom: 1px solid var(--rd-border);
    background: var(--rd-bg-soft);
}

.home-code-dots {
    display: inline-flex;
    gap: 0.4rem;
}

.home-code-dots span {
    width: 0.7rem;
    height: 0.7rem;
    border-radius: 50%;
    background: var(--rd-border);
}

.home-code-dots span:nth-child(1) {
    background: color-mix(in srgb, var(--rd-accent) 70%, var(--rd-border));
}

.home-code-lang {
    font-family: "JetBrains Mono", monospace;
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.09em;
    text-transform: uppercase;
    color: var(--rd-text-soft);
}

.home-code-file {
    margin-left: auto;
    font-family: "JetBrains Mono", monospace;
    font-size: 0.74rem;
    color: var(--rd-text-soft);
}

.home-code-scroll {
    overflow-x: auto;
}

.home-code-body {
    margin: 0;
    padding: 1.1rem 1.25rem 1.35rem;
    overflow-x: auto;
    font-family: "JetBrains Mono", monospace;
    font-size: 0.84rem;
    line-height: 1;
    background: transparent;
    color: var(--rd-text);
}

.home-code-highlight {
    padding: 1.1rem 1.25rem 1.35rem;
    font-family: "JetBrains Mono", monospace;
    font-size: 0.84rem;
    line-height: 1;
}

.home-code-highlight :deep(.shiki) {
    margin: 0;
    padding: 0;
    background: transparent !important;
    counter-reset: codeline;
}

.home-code-highlight :deep(.shiki code) {
    display: block;
    font-family: inherit;
    font-size: inherit;
    line-height: inherit;
}

.home-code-highlight :deep(.shiki .line) {
    display: block;
    counter-increment: codeline;
}

.home-code-highlight :deep(.shiki .line)::before {
    content: counter(codeline);
    display: inline-block;
    width: 1.8rem;
    margin-right: 1.2rem;
    text-align: right;
    /* Line numbers must not inherit the token color of the line content;
       the !important overrides Shiki's inline-style color on the .line. */
    color: var(--rd-text-soft) !important;
    opacity: 0.45;
    user-select: none;
}

/* Empty lines render as a zero-height .line; keep their number faint. */
.home-code-highlight :deep(.shiki .line:empty)::before {
    opacity: 0.25;
}

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
/* PROVIDER COMPARISON                                                */
/* ------------------------------------------------------------------ */

.home-compare-table {
    border: 1px solid var(--rd-border);
    background: color-mix(in srgb, var(--rd-bg) 50%, transparent);
    overflow: hidden;
}

.home-compare-header,
.home-compare-row {
    display: grid;
    grid-template-columns: 1fr 1.4fr 1.4fr;
    align-items: stretch;
}

.home-compare-header {
    border-bottom: 1px solid var(--rd-border);
    background: var(--rd-bg-soft);
}

.home-compare-corner {
    border-right: 1px solid var(--rd-border);
}

.home-compare-col {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 1rem 1.25rem;
    font-family: "Zen Old Mincho", "Shippori Mincho", serif;
    font-weight: 700;
    font-size: 0.95rem;
    color: var(--rd-text);
}

.home-compare-col--anilist {
    color: var(--rd-anilist);
    border-right: 1px solid var(--rd-border);
}

.home-compare-col--mal {
    color: var(--rd-mal);
}

.home-compare-col-sub {
    font-family: "JetBrains Mono", monospace;
    font-size: 0.68rem;
    font-weight: 500;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--rd-text-soft);
    margin-left: 0.4rem;
}

.home-compare-row {
    border-top: 1px solid var(--rd-border);
}

.home-compare-row:first-of-type {
    border-top: 0;
}

.home-compare-label {
    padding: 0.9rem 1.25rem;
    font-family: "Zen Old Mincho", "Shippori Mincho", serif;
    font-size: 0.82rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    color: var(--rd-text-soft);
    border-right: 1px solid var(--rd-border);
    background: color-mix(in srgb, var(--rd-bg-soft) 40%, transparent);
}

.home-compare-cell {
    padding: 0.9rem 1.25rem;
    font-family: "JetBrains Mono", monospace;
    font-size: 0.82rem;
    color: var(--rd-text);
}

.home-compare-cell--anilist {
    border-right: 1px solid var(--rd-border);
}

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

@media (max-width: 980px) {
    .home-feature-grid {
        grid-template-columns: repeat(2, 1fr);
    }

    .home-docs-grid {
        grid-template-columns: 1fr;
    }

    .home-hero-grid {
        grid-template-columns: 1fr;
    }

    .home-hero-card {
        width: 100%;
        max-width: 24rem;
    }
}

@media (max-width: 720px) {
    .home-section,
    .home-hero,
    .home-cta,
    .home-hero-rule {
        padding-left: 1.25rem;
        padding-right: 1.25rem;
    }

    .home-compare-header,
    .home-compare-row {
        grid-template-columns: 1fr;
    }

    .home-compare-corner {
        display: none;
    }

    .home-compare-col--anilist {
        border-right: 0;
        border-bottom: 1px solid var(--rd-border);
    }

    .home-compare-label {
        border-right: 0;
        border-bottom: 1px solid var(--rd-border);
    }

    .home-compare-cell--anilist {
        border-right: 0;
        border-bottom: 1px solid var(--rd-border);
    }

    .home-docs-providers {
        grid-template-columns: 1fr;
    }

    .home-feature-grid {
        grid-template-columns: 1fr;
    }

    .home-hero-title {
        font-size: clamp(2.8rem, 14vw, 3.6rem);
    }

    .home-hero-title-jp {
        display: none;
    }
}
</style>
