<script setup lang="ts">
/**
 * Code sample: a representative typed call, syntax-highlighted with the
 * site's shared Shiki highlighter. This component is one section of the Home page.
 *
 * The highlighter emits dual-theme HTML (light/dark). The global .shiki rules
 * in base.css map its token colors to the site palette. The component
 * populates the highlighted HTML on mount (client-side). A plain `<pre>`
 * fallback covers the SSR/initial paint so the panel is never empty.
 */
import { onBeforeUnmount, onMounted, ref } from "vue";
import { Terminal } from "@lucide/vue";
import { highlightTypeScript } from "../../useShikiHighlighter";

const codeSource = [
    'import { AniLink } from "anilink-api-wrapper";',
    "",
    "// One client, two isolated providers.",
    "const aniLink = new AniLink({",
    "    anilist: { authToken: process.env.ANILIST_TOKEN },",
    "    mal:     { accessToken: process.env.MAL_TOKEN },",
    "});",
    "",
    "// AniList: typed GraphQL, no token needed for public reads.",
    "const anime = await aniLink.anilist.query.media({",
    "    id: 21,",
    '    type: "ANIME",',
    "});",
    'console.log(anime.media?.title?.romaji); // prints "One Piece"',
    "",
    "// MyAnimeList: typed REST, public fields need no token.",
    "const mal = await aniLink.mal.anime.get({ id: 21 }, {",
    '    fields: ["id", "title", "main_picture"],',
    "});",
    "console.log(mal.title);",
].join("\n");

const highlightedHtml = ref("");
const copied = ref(false);
const copyFailed = ref(false);
let resetTimer: ReturnType<typeof setTimeout> | undefined;

async function copyCode(): Promise<void> {
    copyFailed.value = false;
    try {
        await navigator.clipboard.writeText(codeSource);
        copied.value = true;
        clearTimeout(resetTimer);
        resetTimer = setTimeout(() => {
            copied.value = false;
        }, 1600);
    } catch {
        copyFailed.value = true;
    }
}

onBeforeUnmount(() => clearTimeout(resetTimer));

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
    <section class="home-section home-code" aria-labelledby="home-code-title">
        <header class="home-section-head">
            <p class="home-section-kicker">
                <Terminal :size="13" aria-hidden="true" /> One client, two providers
            </p>
            <h2 id="home-code-title" class="home-section-title">Typed from install to response</h2>
            <p class="home-section-lede">
                Construct once with per-provider credentials. Each API is fully typed, from the
                variables you send to the responses you get back. The two providers never share a
                transport credential.
            </p>
        </header>

        <div class="home-code-panel">
            <div class="home-code-toolbar">
                <span class="home-code-dots" aria-hidden="true">
                    <span></span><span></span><span></span>
                </span>
                <span class="home-code-lang">typescript</span>
                <span class="home-code-file">example.ts</span>
                <button
                    type="button"
                    class="al-code-copy"
                    :aria-label="copied ? 'Code copied' : 'Copy code'"
                    :title="copied ? 'Copied' : copyFailed ? 'Copy failed' : 'Copy code'"
                    @click="copyCode"
                >
                    <span class="al-code-copy-icon" aria-hidden="true">
                        {{ copied ? "✓" : "⧉" }}
                    </span>
                    <span>{{ copied ? "Copied" : "Copy" }}</span>
                </button>
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
                    <pre> so the panel is never empty while highlighting loads.
                -->
                <pre v-else class="home-code-body"><code>{{ codeSource }}</code></pre>
            </div>
        </div>
    </section>
</template>

<style scoped>
/* ------------------------------------------------------------------ */
/* CODE SAMPLE                                                        */
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
</style>
