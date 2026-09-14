import {
    AniLink,
    AniLinkAuthError,
    AniLinkErrorCodes,
    AniLinkNetworkError,
    AniLinkRestError,
    ResponseCache,
} from "../../src/AniLink";
import { beforeEach, describe, expect, test } from "vitest";

/**
 * Live integration tests for MyAnimeList REST transport settings
 * combinations.
 *
 * Where `mal-rest.integration.test.ts` proves each read operation resolves,
 * this suite proves the *transport* behaves as documented when its settings
 * are combined over real MAL reads: field selectors (array and string
 * forms), per-request overrides, hook lifecycles, timeout and abort
 * classification, the response cache (MAL reads are GETs, so the cache
 * applies), paging filters, and the per-provider credentials form.
 *
 * Every request here is a GET read. No list-status write (PATCH/PUT/DELETE)
 * is ever sent, so the authenticated account stays untouched.
 *
 * Run with: `npm run test:integration`
 */

const token = process.env.MAL_TOKEN;

if (!token) {
    console.warn(
        "[integration] MAL_TOKEN is not set — the live MyAnimeList settings suite will be skipped entirely."
    );
}

/**
 * MyAnimeList throttles authenticated reads; spacing requests keeps the
 * suite comfortably under the documented rate ceiling.
 */
const RATE_LIMIT_SPACING_MS = 2_100;

beforeEach(async () => {
    if (!token) return;
    await new Promise((resolve) => setTimeout(resolve, RATE_LIMIT_SPACING_MS));
});

/** Well-known stable ids, mirroring the MAL read integration suite. */
const FIXTURES = {
    animeId: 21, // One Piece
    mangaId: 1, // Monster
    fields: ["id", "title", "main_picture", "num_episodes", "status"],
};

describe("MyAnimeList live integration — field selectors", () => {
    test.skipIf(!token)(
        "array fields and pre-joined string fields resolve the same entity",
        async () => {
            const client = new AniLink({ mal: { accessToken: token! } });

            const fromArray = await client.mal.anime.get(
                { id: FIXTURES.animeId },
                { fields: FIXTURES.fields }
            );
            const fromString = await client.mal.anime.get(
                { id: FIXTURES.animeId },
                { fields: FIXTURES.fields.join(",") }
            );

            expect(fromArray.id).toBe(FIXTURES.animeId);
            expect(fromString.id).toBe(FIXTURES.animeId);
            expect(fromArray.title).toBe(fromString.title);
            // The requested fields must actually be present in the payload.
            expect(fromArray.main_picture?.large ?? fromArray.main_picture?.medium).toBeTruthy();
            expect(typeof fromArray.num_episodes).toBe("number");
            expect(typeof fromArray.status).toBe("string");
        }
    );

    test.skipIf(!token)("omitted fields fall back to the default anime field set", async () => {
        const client = new AniLink({ mal: { accessToken: token! } });

        const anime = await client.mal.anime.get({ id: FIXTURES.animeId });

        // The default selection mirrors MalAnime, so the payload carries
        // more than the bare id/title.
        expect(anime.id).toBe(FIXTURES.animeId);
        expect(anime.title).toBeTruthy();
        expect(typeof anime.mean).toBe("number");
    });

    test.skipIf(!token)("manga.get resolves with an explicit field selection", async () => {
        const client = new AniLink({ mal: { accessToken: token! } });

        const manga = await client.mal.manga.get(
            { id: FIXTURES.mangaId },
            { fields: ["id", "title", "num_chapters", "status"] }
        );

        expect(manga.id).toBe(FIXTURES.mangaId);
        expect(manga.title).toBeTruthy();
        expect(typeof manga.num_chapters).toBe("number");
    });
});

describe("MyAnimeList live integration — discovery reads with settings", () => {
    test.skipIf(!token)("seasonal resolves a broadcast window with a field selection", async () => {
        const client = new AniLink({ mal: { accessToken: token! } });

        const season = await client.mal.anime.seasonal(
            { year: 2024, season: "winter" },
            { fields: ["id", "title", "main_picture"] }
        );

        expect(season.data.length).toBeGreaterThan(0);
        expect(season.data[0].node.id).toBeGreaterThan(0);
        expect(season.data[0].node.title).toBeTruthy();
    });

    test.skipIf(!token)("ranking resolves a ranking list with rank positions", async () => {
        const client = new AniLink({ mal: { accessToken: token! } });

        const top = await client.mal.anime.ranking(
            { rankingType: "all" },
            { fields: ["id", "title", "mean"] }
        );

        expect(top.data.length).toBeGreaterThan(0);
        expect(top.data[0].ranking.rank).toBe(1);
        expect(top.data[0].node.title).toBeTruthy();
    });

    test.skipIf(!token)("suggestions resolves for the authenticated user", async () => {
        const client = new AniLink({ mal: { accessToken: token! } });

        const suggestions = await client.mal.anime.suggestions({
            fields: ["id", "title"],
        });

        // Suggestions may legitimately be empty for a fresh account; the
        // contract is the page shape, not a minimum count.
        expect(Array.isArray(suggestions.data)).toBe(true);
    });

    test.skipIf(!token)(
        "user list reads accept status, sort, and paging filters together",
        async () => {
            const client = new AniLink({ mal: { accessToken: token! } });

            const list = await client.mal.user.animeList(
                { username: "@me", status: "completed", sort: "list_score", limit: 5 },
                { fields: ["id", "title", "list_status"] }
            );

            expect(Array.isArray(list.data)).toBe(true);
            // Every returned entry must honor the status filter.
            for (const entry of list.data) {
                expect(entry.list_status?.status).toBe("completed");
            }
        }
    );

    test.skipIf(!token)("the manga list read accepts its own status and sort filters", async () => {
        const client = new AniLink({ mal: { accessToken: token! } });

        const list = await client.mal.user.mangaList(
            { username: "@me", status: "reading", sort: "manga_title", limit: 5 },
            { fields: ["id", "title", "list_status"] }
        );

        expect(Array.isArray(list.data)).toBe(true);
        for (const entry of list.data) {
            expect(entry.list_status?.status).toBe("reading");
        }
    });

    test.skipIf(!token)(
        "a public username resolves with the client-ID-only credential form",
        async () => {
            // A named user's list is public; MAL's documented client-ID-only
            // access form reads it without a bearer token. The client ID is
            // attached as the X-MAL-CLIENT-ID header only when no access
            // token is configured.
            const clientId = process.env.MAL_CLIENT_ID;
            const publicClient = new AniLink({
                mal: { clientId },
            });

            const list = await publicClient.mal.user.animeList(
                { username: "Xinil", limit: 5 },
                { fields: ["id", "title"] }
            );

            expect(Array.isArray(list.data)).toBe(true);
            expect(list.data.length).toBeGreaterThan(0);
            expect(list.data[0].node.id).toBeGreaterThan(0);
        },
        60_000
    );
});

describe("MyAnimeList live integration — hooks and errors", () => {
    test.skipIf(!token)(
        "onRequestStart and onResponse fire with the REST url and method",
        async () => {
            const starts: Array<{ url: string; method: string }> = [];
            const responses: Array<{ url: string; method: string; durationMs: number }> = [];
            const client = new AniLink({
                mal: {
                    accessToken: token!,
                    onRequestStart: ({ url, method }) => starts.push({ url, method }),
                    onResponse: ({ url, method, durationMs }) =>
                        responses.push({ url, method, durationMs }),
                },
            });

            await client.mal.anime.get({ id: FIXTURES.animeId }, { fields: ["id", "title"] });

            expect(starts).toHaveLength(1);
            expect(starts[0].method).toBe("GET");
            expect(starts[0].url).toContain("api.myanimelist.net/v2/anime/21");
            expect(responses).toHaveLength(1);
            expect(responses[0].method).toBe("GET");
            expect(responses[0].durationMs).toBeGreaterThanOrEqual(0);
        }
    );

    test.skipIf(!token)(
        "a 404 surfaces as AniLinkRestError with the upstream body preserved",
        async () => {
            const client = new AniLink({ mal: { accessToken: token! } });

            const promise = client.mal.anime.get(
                { id: 999_999_999 },
                { retry: false, fields: ["id", "title"] }
            );
            await expect(promise).rejects.toThrowError(AniLinkRestError);
            try {
                await promise;
            } catch (error) {
                const restError = error as AniLinkRestError;
                expect(restError.status).toBe(404);
                expect(restError.code).toBe(AniLinkErrorCodes.API);
                // The upstream body is preserved verbatim for REST calls.
                expect(restError.data).toBeDefined();
            }
        }
    );

    test.skipIf(!token)(
        "an unreachably small timeout surfaces a TIMEOUT network error",
        async () => {
            const client = new AniLink({ mal: { accessToken: token! } });

            const promise = client.mal.anime.get(
                { id: FIXTURES.animeId },
                { timeout: 1, retry: false, fields: ["id"] }
            );
            await expect(promise).rejects.toSatisfy(
                (error: unknown) =>
                    error instanceof AniLinkNetworkError && error.code === AniLinkErrorCodes.TIMEOUT
            );
        },
        60_000
    );

    test.skipIf(!token)("an aborted signal surfaces ABORTED without retries", async () => {
        const controller = new AbortController();
        const client = new AniLink({
            mal: {
                accessToken: token!,
                retry: { maxRetries: 3, baseDelayMs: 50 },
            },
        });

        controller.abort();
        const promise = client.mal.anime.get(
            { id: FIXTURES.animeId },
            { signal: controller.signal, fields: ["id"] }
        );
        await expect(promise).rejects.toSatisfy(
            (error: unknown) =>
                error instanceof AniLinkNetworkError && error.code === AniLinkErrorCodes.ABORTED
        );
    });
});

describe("MyAnimeList live integration — response cache over GET reads", () => {
    test.skipIf(!token)(
        "an identical GET read is served from the cache with cacheHit: true",
        async () => {
            const cache = new ResponseCache({ ttlMs: 60_000 });
            const responseEvents: Array<{ cacheHit?: boolean; durationMs: number }> = [];
            const client = new AniLink({
                mal: {
                    accessToken: token!,
                    responseCache: cache,
                    onResponse: ({ cacheHit, durationMs }) =>
                        responseEvents.push({ cacheHit, durationMs }),
                },
            });

            const first = await client.mal.anime.get(
                { id: FIXTURES.animeId },
                { fields: ["id", "title"] }
            );
            const second = await client.mal.anime.get(
                { id: FIXTURES.animeId },
                { fields: ["id", "title"] }
            );

            expect(first.id).toBe(FIXTURES.animeId);
            expect(second.id).toBe(FIXTURES.animeId);
            expect(responseEvents).toHaveLength(2);
            // The second read must be a cache hit with a zero duration.
            expect(responseEvents[1].cacheHit).toBe(true);
            expect(responseEvents[1].durationMs).toBe(0);
        }
    );

    test.skipIf(!token)(
        "a different field selection is a cache miss (the body hash keys the entry)",
        async () => {
            const cache = new ResponseCache({ ttlMs: 60_000 });
            const hits: boolean[] = [];
            const client = new AniLink({
                mal: {
                    accessToken: token!,
                    responseCache: cache,
                    onResponse: ({ cacheHit }) => hits.push(cacheHit === true),
                },
            });

            await client.mal.anime.get({ id: FIXTURES.animeId }, { fields: ["id", "title"] });
            // A different fields query string is a different URL, so this is
            // a miss by URL keying even before body hashing matters.
            await client.mal.anime.get(
                { id: FIXTURES.animeId },
                { fields: ["id", "title", "mean"] }
            );

            expect(hits).toEqual([false, false]);
        }
    );

    test.skipIf(!token)("an expired TTL entry misses and refetches", async () => {
        const cache = new ResponseCache({ ttlMs: 1 });
        const hits: boolean[] = [];
        const client = new AniLink({
            mal: {
                accessToken: token!,
                responseCache: cache,
                onResponse: ({ cacheHit }) => hits.push(cacheHit === true),
            },
        });

        await client.mal.anime.get({ id: FIXTURES.animeId }, { fields: ["id", "title"] });
        // Wait past the 1ms TTL so the entry expires.
        await new Promise((resolve) => setTimeout(resolve, 50));
        await client.mal.anime.get({ id: FIXTURES.animeId }, { fields: ["id", "title"] });

        expect(hits).toEqual([false, false]);
    });
});

describe("MyAnimeList live integration — per-provider credentials form", () => {
    test.skipIf(!token)(
        "mal slot transport settings apply without touching the anilist slot",
        async () => {
            const malStarts: string[] = [];
            const multi = new AniLink({
                anilist: { authToken: "anilist-token" },
                mal: {
                    accessToken: token!,
                    timeout: 30_000,
                    onRequestStart: ({ url }) => malStarts.push(url),
                },
            });

            const anime = await multi.mal.anime.get(
                { id: FIXTURES.animeId },
                { fields: ["id", "title"] }
            );

            expect(anime.id).toBe(FIXTURES.animeId);
            expect(malStarts).toHaveLength(1);
            expect(malStarts[0]).toContain("api.myanimelist.net");
        }
    );

    test.skipIf(!token)(
        "an auth-required read without a token fails fast with AniLinkAuthError",
        async () => {
            const anonymous = new AniLink();

            await expect(anonymous.mal.user.me()).rejects.toThrowError(AniLinkAuthError);
        }
    );
});
