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
    mangaId: 2, // Berserk — the canonical match for the "berserk" keyword
    forumTopicId: 23744, // A stable topic that carries a poll
    fields: ["id", "title", "main_picture", "num_episodes", "status"],
};

describe("MyAnimeList live integration — reads only", () => {
    test.skipIf(!token)("anime.get resolves a well-known anime with field selection", async () => {
        const anime = await client().mal.anime.get(
            { id: FIXTURES.animeId },
            {
                fields: FIXTURES.fields,
            }
        );

        expect(anime.id).toBe(FIXTURES.animeId);
        expect(anime.title).toBeTruthy();
    });

    test.skipIf(!token)("anime.get accepts a pre-joined fields string", async () => {
        const anime = await client().mal.anime.get(
            { id: FIXTURES.animeId },
            {
                fields: FIXTURES.fields.join(","),
            }
        );

        expect(anime.id).toBe(FIXTURES.animeId);
    });

    test.skipIf(!token)("anime.search resolves keyword matches with paging", async () => {
        const results = await client().mal.anime.search(
            { q: "one piece", limit: 5 },
            { fields: ["id", "title"] }
        );

        expect(results.data.length).toBeGreaterThan(0);
        // One Piece is the canonical match for the keyword, so it places
        // within the first page of results.
        expect(results.data.some((entry) => entry.node.id === FIXTURES.animeId)).toBe(true);
        // The keyword has far more than five matches, so the next-page link
        // is present.
        expect(typeof results.paging?.next).toBe("string");
    });

    test.skipIf(!token)("manga.search resolves keyword matches", async () => {
        const results = await client().mal.manga.search(
            { q: "berserk", limit: 5 },
            { fields: ["id", "title"] }
        );

        expect(results.data.length).toBeGreaterThan(0);
        // Berserk is the canonical match for the keyword, so it places
        // within the first page of results.
        expect(results.data.some((entry) => entry.node.id === FIXTURES.mangaId)).toBe(true);
    });

    test.skipIf(!token)("manga.ranking resolves a ranking list with rank positions", async () => {
        const top = await client().mal.manga.ranking(
            { rankingType: "manga" },
            { fields: ["id", "title", "mean"] }
        );

        expect(top.data.length).toBeGreaterThan(0);
        expect(top.data[0].ranking.rank).toBe(1);
        expect(top.data[0].node.title).toBeTruthy();
    });

    test.skipIf(!token)("user.me resolves the authenticated user", async () => {
        const user = await client().mal.user.me();

        expect(user.id).toBeGreaterThan(0);
        expect(user.name).toBeTruthy();
    });

    test.skipIf(!token)("user.get resolves the authenticated user via @me", async () => {
        const user = await client().mal.user.get({ username: "@me" }, { fields: ["id", "name"] });

        expect(user.id).toBeGreaterThan(0);
        expect(user.name).toBeTruthy();
    });

    test.skipIf(!token)("user.animeList resolves the authenticated user's anime list", async () => {
        const list = await client().mal.user.animeList(
            { username: "@me", limit: 5 },
            { fields: ["id", "title", "list_status"] }
        );

        expect(Array.isArray(list.data)).toBe(true);
        expect(
            list.paging === undefined ||
                typeof list.paging.next === "string" ||
                typeof list.paging.previous === "string" ||
                (list.paging.next === undefined && list.paging.previous === undefined)
        ).toBe(true);
    });

    test.skipIf(!token)("user.mangaList resolves the authenticated user's manga list", async () => {
        const list = await client().mal.user.mangaList(
            { username: "@me", limit: 5 },
            { fields: ["id", "title", "list_status"] }
        );

        expect(Array.isArray(list.data)).toBe(true);
    });

    test.skipIf(!token)("forum.boards resolves the board tree", async () => {
        const boards = await client().mal.forum.boards();

        expect(boards.categories.length).toBeGreaterThan(0);
        expect(boards.categories[0].title).toBeTruthy();
        const board = boards.categories[0].boards[0];
        expect(board?.id).toBeGreaterThan(0);
        expect(board?.title).toBeTruthy();
    });

    test.skipIf(!token)("forum.topics resolves the topic list with a keyword filter", async () => {
        const topics = await client().mal.forum.topics({ q: "one piece", limit: 5 });

        expect(topics.data.length).toBeGreaterThan(0);
        expect(topics.data[0].id).toBeGreaterThan(0);
        expect(topics.data[0].title).toBeTruthy();
    });

    test.skipIf(!token)("forum.topic resolves one topic with its posts and poll", async () => {
        const topic = await client().mal.forum.topic({
            id: FIXTURES.forumTopicId,
            limit: 5,
        });

        expect(topic.data.title).toBeTruthy();
        expect(topic.data.posts.length).toBeGreaterThan(0);
        expect(typeof topic.data.posts[0].body).toBe("string");
        // The poll is a single object with `closed` — the upstream quirk the
        // vendored spec gets wrong — so pin its live shape on this topic.
        const poll = topic.data.poll;
        expect(poll?.question).toBeTruthy();
        expect(Array.isArray(poll?.options)).toBe(true);
        expect(typeof poll?.closed).toBe("boolean");
    });

    test.skipIf(!token)("anime.get surfaces a 404 as a normalized API error", async () => {
        // An id far beyond the MyAnimeList id space, so the lookup misses.
        await expect(
            client().mal.anime.get({ id: 999_999_999 }, { retry: false })
        ).rejects.toSatisfy(
            (error: unknown) => error instanceof AniLinkApiError && error.status === 404
        );
    });
});
