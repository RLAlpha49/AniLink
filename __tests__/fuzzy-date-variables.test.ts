import { AniLinkErrorCodes, AniLinkValidationError } from "../src/base/AniLinkError";
import {
    createTestClient,
    getLastRequest,
    mockSendRequest,
    setMockResponse,
} from "./helpers/mockRequestHandler";
import { AniLink } from "../src/AniLink";
import { describe, expect, test } from "vitest";

/**
 * Fuzzy-date variable contracts for the AniList query surface.
 *
 * AniList's schema types every query-side fuzzy-date argument as the
 * `FuzzyDateInt` scalar — an integer in YYYYMMDD form — while the
 * list-entry mutations take the `FuzzyDateInput` object. These tests pin
 * that split: query variables accept (and forward) the integer form, the
 * validator rejects the object form on queries, and the mutation surface
 * keeps the object form.
 */

/** A well-formed FuzzyDateInt: April 1st, 1998. */
const DATE_INT = 19980401;

/** The object form mutations accept and queries must reject. */
const DATE_OBJECT = { year: 1998, month: 4, day: 1 };

describe("fuzzy-date query variables accept the FuzzyDateInt number form", () => {
    test("query.media forwards startDate as an integer variable", async () => {
        const client = createTestClient("fuzzy-int-token");
        setMockResponse({ data: { Media: { id: 1 } } });

        await client.anilist.query.media({ id: 1, type: "ANIME", startDate: DATE_INT });

        expect(mockSendRequest).toHaveBeenCalledTimes(1);
        expect(getLastRequest()?.data).toEqual(
            expect.objectContaining({
                variables: expect.objectContaining({ startDate: DATE_INT }),
            })
        );
    });

    test("query.mediaListCollection forwards startedAt as an integer variable", async () => {
        const client = createTestClient("fuzzy-int-token");
        setMockResponse({ data: { MediaListCollection: { lists: [] } } });

        await client.anilist.query.mediaListCollection({
            userId: 542244,
            type: "ANIME",
            startedAt: DATE_INT,
        });

        expect(getLastRequest()?.data).toEqual(
            expect.objectContaining({
                variables: expect.objectContaining({ startedAt: DATE_INT }),
            })
        );
    });

    test("query.mediaList forwards startedAt_greater as an integer variable", async () => {
        const client = createTestClient("fuzzy-int-token");
        setMockResponse({ data: { MediaList: { id: 1 } } });

        await client.anilist.query.mediaList({ mediaId: 1, startedAt_greater: DATE_INT });

        expect(getLastRequest()?.data).toEqual(
            expect.objectContaining({
                variables: expect.objectContaining({ startedAt_greater: DATE_INT }),
            })
        );
    });

    test("page.medias forwards startDate as an integer variable", async () => {
        const client = createTestClient("fuzzy-int-token");
        setMockResponse({ data: { Page: { pageInfo: {}, media: [] } } });

        await client.anilist.query.page.medias({ page: 1, perPage: 3, startDate: DATE_INT });

        expect(getLastRequest()?.data).toEqual(
            expect.objectContaining({
                variables: expect.objectContaining({ startDate: DATE_INT }),
            })
        );
    });

    test("page.mediaLists forwards completedAt_lesser as an integer variable", async () => {
        const client = createTestClient("fuzzy-int-token");
        setMockResponse({ data: { Page: { pageInfo: {}, mediaList: [] } } });

        await client.anilist.query.page.mediaLists({
            userId: 542244,
            completedAt_lesser: DATE_INT,
        });

        expect(getLastRequest()?.data).toEqual(
            expect.objectContaining({
                variables: expect.objectContaining({ completedAt_lesser: DATE_INT }),
            })
        );
    });
});

describe("fuzzy-date query variables reject the FuzzyDateInput object form", () => {
    test("query.media rejects an object startDate with a validation error", async () => {
        const client = createTestClient("fuzzy-int-token");

        await expect(
            client.anilist.query.media({
                id: 1,
                type: "ANIME",
                // The object form belongs to the mutation surface; the query
                // arguments are FuzzyDateInt scalars, so the validator must
                // reject it before any request is dispatched.
                startDate: DATE_OBJECT as never,
            })
        ).rejects.toMatchObject({ code: AniLinkErrorCodes.VALIDATION });
        expect(mockSendRequest).not.toHaveBeenCalled();
    });

    test("query.mediaListCollection rejects an object startedAt with a validation error", async () => {
        const client = createTestClient("fuzzy-int-token");

        await expect(
            client.anilist.query.mediaListCollection({
                userId: 542244,
                type: "ANIME",
                startedAt: DATE_OBJECT as never,
            })
        ).rejects.toBeInstanceOf(AniLinkValidationError);
        expect(mockSendRequest).not.toHaveBeenCalled();
    });

    test("page.medias rejects an object startDate with a validation error", async () => {
        const client = createTestClient("fuzzy-int-token");

        await expect(
            client.anilist.query.page.medias({
                page: 1,
                perPage: 3,
                startDate: DATE_OBJECT as never,
            })
        ).rejects.toBeInstanceOf(AniLinkValidationError);
        expect(mockSendRequest).not.toHaveBeenCalled();
    });
});

describe("fuzzyDateInt helper builds the query-surface integer form", () => {
    test("builds YYYYMMDD from full parts", () => {
        const client = new AniLink("fuzzy-int-token");
        expect(client.anilist.fuzzyDateInt({ year: 1998, month: 4, day: 1 })).toBe(19980401);
    });

    test("fills omitted parts with zero, matching the fuzzy-date convention", () => {
        const client = new AniLink("fuzzy-int-token");
        expect(client.anilist.fuzzyDateInt({ year: 1998 })).toBe(19980000);
        expect(client.anilist.fuzzyDateInt({ year: 1998, month: 4 })).toBe(19980400);
    });

    test("an empty call produces the all-zero date", () => {
        const client = new AniLink("fuzzy-int-token");
        expect(client.anilist.fuzzyDateInt()).toBe(0);
    });

    test("composes with a real query call through the facade", async () => {
        const client = createTestClient("fuzzy-int-token");
        setMockResponse({ data: { Page: { pageInfo: {}, media: [] } } });

        const startDate = client.anilist.fuzzyDateInt({ year: 1998, month: 4, day: 1 });
        await client.anilist.query.page.medias({ page: 1, perPage: 3, startDate });

        expect(getLastRequest()?.data).toEqual(
            expect.objectContaining({
                variables: expect.objectContaining({ startDate: 19980401 }),
            })
        );
    });
});

describe("mutation fuzzy-date variables keep the FuzzyDateInput object form", () => {
    test("saveMediaListEntry forwards startedAt as an object variable", async () => {
        const client = createTestClient("fuzzy-int-token");
        setMockResponse({ data: { SaveMediaListEntry: { id: 1 } } });

        await client.anilist.mutation.saveMediaListEntry({
            mediaId: 1,
            status: "COMPLETED",
            startedAt: DATE_OBJECT,
        });

        expect(getLastRequest()?.data).toEqual(
            expect.objectContaining({
                variables: expect.objectContaining({ startedAt: DATE_OBJECT }),
            })
        );
    });

    test("saveMediaListEntry rejects the integer form on the mutation surface", async () => {
        const client = createTestClient("fuzzy-int-token");

        await expect(
            client.anilist.mutation.saveMediaListEntry({
                mediaId: 1,
                status: "COMPLETED",
                // The integer form belongs to the query surface; the mutation
                // arguments are FuzzyDateInput objects.
                startedAt: DATE_INT as never,
            })
        ).rejects.toBeInstanceOf(AniLinkValidationError);
        expect(mockSendRequest).not.toHaveBeenCalled();
    });
});
