import { AniLink, AniLinkApiError } from "../../src/AniLink";
import { beforeEach, describe, expect, test } from "vitest";

/**
 * Live integration tests for the MyAnimeList REST read surface.
 *
 * These tests run real requests against https://api.myanimelist.net/v2 and are
 * therefore skipped unless `MAL_TOKEN` is set in `.env`. Only reads are
 * exercised — never list-status writes — so the authenticated account stays
 * untouched, mirroring the read-only contract of the AniList integration
 * suite.
 *
 * Run with: `npm run test:integration`
 */

const token = process.env.MAL_TOKEN;

if (!token) {
    console.warn(
        "[integration] MAL_TOKEN is not set — the live MyAnimeList suite will be skipped entirely."
    );
}

/**
 * MyAnimeList throttles authenticated reads; spacing requests keeps the
 * suite comfortably under the documented rate ceiling.
 */
const RATE_LIMIT_SPACING_MS = 2_100;

/** Shared client; only created when a token is present. */
const client = () => new AniLink({ mal: { accessToken: token! } });

beforeEach(async () => {
    if (!token) return;
    await new Promise((resolve) => setTimeout(resolve, RATE_LIMIT_SPACING_MS));
});

/** Well-known public ids that are stable in the MyAnimeList database. */
const FIXTURES = {
    animeId: 21, // One Piece (also used by the unit-suite examples)
    fields: ["id", "title", "main_picture", "num_episodes", "status"],
};

describe("MyAnimeList live integration — reads only", () => {
    test.skipIf(!token)("anime.get resolves a well-known anime with field selection", async () => {
        const anime = await client().mal.anime.get(FIXTURES.animeId, {
            fields: FIXTURES.fields,
        });

        expect(anime.id).toBe(FIXTURES.animeId);
        expect(anime.title).toBeTruthy();
    });

    test.skipIf(!token)("anime.get accepts a pre-joined fields string", async () => {
        const anime = await client().mal.anime.get(FIXTURES.animeId, {
            fields: FIXTURES.fields.join(","),
        });

        expect(anime.id).toBe(FIXTURES.animeId);
    });

    test.skipIf(!token)("user.me resolves the authenticated user", async () => {
        const user = await client().mal.user.me();

        expect(user.id).toBeGreaterThan(0);
        expect(user.name).toBeTruthy();
    });

    test.skipIf(!token)("anime.get surfaces a 404 as a normalized API error", async () => {
        // An id far beyond the MyAnimeList id space, so the lookup misses.
        await expect(client().mal.anime.get(999_999_999, { retry: false })).rejects.toSatisfy(
            (error: unknown) => error instanceof AniLinkApiError && error.status === 404
        );
    });
});
