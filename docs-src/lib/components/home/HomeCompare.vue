<script setup lang="ts">
/**
 * Provider comparison: AniList vs MyAnimeList capability table. Section
 * component of the Home composition; owns the comparison data and scoped
 * styles.
 */
import { Disc, Layers, Square } from "@lucide/vue";

interface CompareRow {
    label: string;
    anilist: string;
    mal: string;
}

const compareRows: CompareRow[] = [
    { label: "Protocol", anilist: "GraphQL", mal: "REST" },
    { label: "Namespace", anilist: "aniLink.anilist", mal: "aniLink.mal" },
    {
        label: "Operations",
        anilist: "Queries · Page · Mutations · custom()",
        mal: "anime.get · seasonal · ranking · user.animeList · user.mangaList · user.me",
    },
    { label: "Auth", anilist: "OAuth bearer token", mal: "PKCE OAuth2 access token" },
    { label: "Credential slot", anilist: "anilist.authToken", mal: "mal.accessToken" },
];
</script>

<template>
    <section class="home-section home-compare" aria-labelledby="home-compare-title">
        <header class="home-section-head">
            <p class="home-section-kicker">
                <Layers :size="13" aria-hidden="true" /> Two providers, one client
            </p>
            <h2 id="home-compare-title" class="home-section-title">AniList & MyAnimeList</h2>
            <p class="home-section-lede">
                Both providers share a transport layer: timeouts, retries, pacing, the circuit
                breaker, hooks, and error normalization. They never share credentials.
            </p>
        </header>

        <table class="home-compare-table">
            <thead>
                <tr class="home-compare-header">
                    <th class="home-compare-corner" scope="col"></th>
                    <th class="home-compare-col home-compare-col--anilist" scope="col">
                        <Disc :size="14" :stroke-width="2.5" aria-hidden="true" /> AniList
                        <span class="home-compare-col-sub">GraphQL</span>
                    </th>
                    <th class="home-compare-col home-compare-col--mal" scope="col">
                        <Square :size="14" :stroke-width="2.5" aria-hidden="true" /> MyAnimeList
                        <span class="home-compare-col-sub">REST</span>
                    </th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="row in compareRows" :key="row.label" class="home-compare-row">
                    <th class="home-compare-label" scope="row">{{ row.label }}</th>
                    <td class="home-compare-cell home-compare-cell--anilist">{{ row.anilist }}</td>
                    <td class="home-compare-cell home-compare-cell--mal">{{ row.mal }}</td>
                </tr>
            </tbody>
        </table>
    </section>
</template>

<style scoped>
/* ------------------------------------------------------------------ */
/* PROVIDER COMPARISON                                                */
/* ------------------------------------------------------------------ */

.home-compare-table {
    display: block;
    margin: 0;
    border: 1px solid var(--rd-border);
    background: color-mix(in srgb, var(--rd-bg) 50%, transparent);
    overflow: hidden;
}

.home-compare-table thead,
.home-compare-table tbody {
    display: block;
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
    padding: 0;
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
/* RESPONSIVE                                                         */
/* ------------------------------------------------------------------ */

@media (max-width: 720px) {
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
}
</style>
