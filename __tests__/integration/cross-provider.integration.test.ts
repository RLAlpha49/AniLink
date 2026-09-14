import { AniLink, AniLinkApiError } from "../../src/AniLink";
import { beforeEach, describe, expect, test } from "vitest";

/**
 * Live integration tests for realistic cross-provider read workflows.
 *
 * These tests exercise the library the way a real consumer would: one
 * client holding both provider credentials, AniList searches feeding the
 * crossLink helper, MAL lookups resolving the mapped ids, pagination
 * traversals feeding flattenMediaListCollection, and the fuzzyDate helper
 * building variables for real queries.
 *
 * Every request here is a read on either provider. No mutation document and
 * no list-status write is ever sent, so both authenticated accounts stay
 * untouched.
 *
 * Run with: `npm run test:integration`
 */

const anilistToken = process.env.ANILIST_TOKEN;
const malToken = process.env.MAL_TOKEN;

/** Both providers must be configured for the cross-provider workflows. */
const ready = anilistToken !== undefined && malToken !== undefined;

if (!ready) {
    console.warn(
        "[integration] ANILIST_TOKEN and/or MAL_TOKEN not set — the cross-provider suite will be skipped entirely."
    );
}

/**
 * Both providers rate-limit; spacing keeps the suite under both ceilings.
 */
const RATE_LIMIT_SPACING_MS = 2_100;

beforeEach(async () => {
    if (!ready) return;
    await new Promise((resolve) => setTimeout(resolve, RATE_LIMIT_SPACING_MS));
});

/** One client holding both provider credentials, like a real consumer. */
const client = () =>
    new AniLink({
        anilist: { authToken: anilistToken! },
        mal: { accessToken: malToken! },
    });

/** Well-known stable fixtures across both providers. */
const FIXTURES = {
    anilistMediaId: 1, // Cowboy Bebop — AniList id 1 maps to MAL id 1 (Cowboy Bebop)
    anilistUserId: 542244, // Alpha49
    malAnimeId: 1, // Cowboy Bebop on MAL
    animeType: "ANIME" as const,
};

describe("cross-provider live integration — id mapping workflows", () => {
    test.skipIf(!ready)(
        "crossLink builds bidirectional maps from a real page.medias response",
        async () => {
            const aniLink = client();

            const page = await aniLink.anilist.query.page.medias({
                page: 1,
                perPage: 10,
                type: FIXTURES.animeType,
                sort: ["POPULARITY_DESC"],
            });

            expect(page.media.length).toBeGreaterThan(0);

            const { anilistToMal, malToAnilist, unmapped } = aniLink.anilist.crossLink(page.media);

            // Popular anime virtually always carry a MAL id, so the maps are
            // non-empty and consistent with each other.
            expect(anilistToMal.size).toBeGreaterThan(0);
            expect(malToAnilist.size).toBe(anilistToMal.size);

            // Round-trip: every mapped AniList id resolves back through the
            // reverse map to the same entry.
            for (const [anilistId, malId] of anilistToMal) {
                expect(malToAnilist.get(malId)).toBe(anilistId);
            }

            // Entries without a MAL id are collected, never silently dropped.
            expect(unmapped.length).toBe(page.media.length - anilistToMal.size);
        }
    );

    test.skipIf(!ready)(
        "a mapped AniList entry resolves on MAL through the lookup map",
        async () => {
            const aniLink = client();

            // One well-known media whose MAL id is stable: AniList 1 -> MAL 1.
            const bebop = await aniLink.anilist.query.media({
                id: FIXTURES.anilistMediaId,
                type: FIXTURES.animeType,
            });
            expect(bebop.idMal).toBe(FIXTURES.malAnimeId);

            const { anilistToMal } = aniLink.anilist.crossLink([bebop]);
            const malId = anilistToMal.get(FIXTURES.anilistMediaId);
            expect(malId).toBe(FIXTURES.malAnimeId);

            // The mapped id resolves the same show on MAL through the second
            // provider on the same client.
            const malAnime = await aniLink.mal.anime.get(
                { id: malId! },
                { fields: ["id", "title", "mean"] }
            );
            expect(malAnime.id).toBe(FIXTURES.malAnimeId);
            expect(malAnime.title).toBeTruthy();
        }
    );

    test.skipIf(!ready)(
        "entries without a MAL id land in unmapped instead of the maps",
        async () => {
            const aniLink = client();

            // Query a media known to have no MAL id: AniList originals /
            // entries MAL does not track. Search for a niche original.
            const page = await aniLink.anilist.query.page.medias({
                page: 1,
                perPage: 50,
                type: FIXTURES.animeType,
                search: "original",
            });

            // Whatever the mix, every entry is accounted for exactly once:
            // mapped entries in the maps, unmapped ones in unmapped.
            const { anilistToMal, unmapped } = aniLink.anilist.crossLink(page.media);
            expect(anilistToMal.size + unmapped.length).toBe(page.media.length);
            for (const entry of unmapped) {
                expect(typeof entry.idMal).not.toBe("number");
            }
        },
        60_000
    );
});

describe("cross-provider live integration — list workflows", () => {
    test.skipIf(!ready)(
        "mediaListCollection feeds flattenMediaListCollection with list memberships",
        async () => {
            const aniLink = client();

            const collection = await aniLink.anilist.query.mediaListCollection({
                userId: FIXTURES.anilistUserId,
                type: FIXTURES.animeType,
                chunk: 1,
                perChunk: 500,
            });

            expect(Array.isArray(collection.lists)).toBe(true);

            const entries = aniLink.anilist.flattenMediaListCollection(collection);

            // A public list with entries flattens to a non-empty deduped
            // array where every entry carries its list memberships.
            expect(entries.length).toBeGreaterThan(0);
            const ids = new Set(entries.map((entry) => entry.id));
            expect(ids.size).toBe(entries.length);
            for (const entry of entries) {
                expect(entry.mediaId).toBeGreaterThan(0);
                expect(entry.listNames.length).toBeGreaterThan(0);
                expect(typeof entry.inCustomList).toBe("boolean");
            }
        },
        60_000
    );

    test.skipIf(!ready)(
        "paginateChunks collects a user's whole list across chunks and flattens it",
        async () => {
            const aniLink = client();

            const result = await aniLink.anilist.paginateChunks(
                (chunk, perChunk) =>
                    aniLink.anilist.query.mediaListCollection({
                        userId: FIXTURES.anilistUserId,
                        type: FIXTURES.animeType,
                        chunk,
                        perChunk,
                    }),
                "lists",
                { perChunk: 500, maxChunks: 2 }
            );

            expect(result.chunkCount).toBeGreaterThanOrEqual(1);

            // The chunked snapshots compose into a collection-shaped object
            // the flatten helper accepts: lists from every chunk concatenated.
            // The flatten helper only reads `lists`, so the composed object is
            // cast once at the boundary instead of fabricating the rest of
            // the collection shape.
            const composed = {
                lists: result.chunks.flatMap((chunk) => chunk.items),
            } as unknown as Parameters<typeof aniLink.anilist.flattenMediaListCollection>[0];
            const entries = aniLink.anilist.flattenMediaListCollection(composed);
            expect(entries.length).toBeGreaterThan(0);
        },
        60_000
    );
});

describe("cross-provider live integration — helper-driven queries", () => {
    test.skipIf(!ready)("fuzzyDate builds the zero-value FuzzyDateInput contract", async () => {
        const aniLink = client();

        // fuzzyDate fills omitted parts with the zero-value contract
        // AniList's FuzzyDateInput expects.
        const full = aniLink.anilist.fuzzyDate({ year: 1998, month: 4, day: 1 });
        const yearOnly = aniLink.anilist.fuzzyDate({ year: 1998 });
        expect(full).toEqual({ year: 1998, month: 4, day: 1 });
        expect(yearOnly).toEqual({ year: 1998, month: 0, day: 0 });

        // The same window queried through the plain season filters a
        // real query accepts: season + seasonYear are the documented
        // way to scope a broadcast window.
        const page = await aniLink.anilist.query.page.medias({
            page: 1,
            perPage: 3,
            type: FIXTURES.animeType,
            season: "SPRING",
            seasonYear: 1998,
        });

        expect(page.media.length).toBeGreaterThan(0);
        for (const media of page.media) {
            expect(media.startDate.year).toBe(1998);
        }
    });

    test.skipIf(!ready)(
        "a search-driven workflow chains AniList search into a MAL lookup",
        async () => {
            const aniLink = client();

            // Search AniList for a well-known show, map it, resolve it on MAL.
            const found = await aniLink.anilist.query.media({
                search: "Cowboy Bebop",
                type: FIXTURES.animeType,
            });
            expect(found.id).toBe(FIXTURES.anilistMediaId);

            const { anilistToMal } = aniLink.anilist.crossLink([found]);
            const malId = anilistToMal.get(found.id);
            expect(malId).toBeDefined();

            const onMal = await aniLink.mal.anime.get(
                { id: malId! },
                { fields: ["id", "title", "mean", "num_episodes"] }
            );
            expect(onMal.id).toBe(malId);
            expect(onMal.title.toLowerCase()).toContain("cowboy bebop");
            expect(onMal.num_episodes).toBe(26);
        }
    );
});

describe("cross-provider live integration — combined settings on one client", () => {
    test.skipIf(!ready)(
        "one client serves both providers with per-slot hooks and settings",
        async () => {
            const urls: string[] = [];
            const aniLink = new AniLink({
                anilist: {
                    authToken: anilistToken!,
                    timeout: 30_000,
                    onRequestStart: ({ url }) => urls.push(url),
                },
                mal: {
                    accessToken: malToken!,
                    timeout: 30_000,
                    onRequestStart: ({ url }) => urls.push(url),
                },
            });

            const genres = await aniLink.anilist.query.genreCollection();
            const anime = await aniLink.mal.anime.get(
                { id: FIXTURES.malAnimeId },
                { fields: ["id", "title"] }
            );

            expect(genres.length).toBeGreaterThan(0);
            expect(anime.id).toBe(FIXTURES.malAnimeId);
            // Both providers' requests fired through their own slots' hooks.
            expect(urls).toContain("https://graphql.anilist.co");
            expect(urls.some((url) => url.includes("api.myanimelist.net"))).toBe(true);
        }
    );

    test.skipIf(!ready)(
        "a failing provider does not contaminate the other on the same client",
        async () => {
            const aniLink = client();

            // The AniList read misses; the MAL read on the same client must
            // still succeed — errors never leak across provider slots.
            await expect(
                aniLink.anilist.query.media({ id: 999_999_999, type: FIXTURES.animeType })
            ).rejects.toThrowError(AniLinkApiError);

            const anime = await aniLink.mal.anime.get(
                { id: FIXTURES.malAnimeId },
                { fields: ["id", "title"] }
            );
            expect(anime.id).toBe(FIXTURES.malAnimeId);
        }
    );
});
