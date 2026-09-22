/**
 * `customPage` tests over the mocked transport.
 *
 * The traversal itself runs on the shared pagination engine (covered by
 * the pagination suites); these tests pin the escape hatch's local
 * validation contract and the per-page request shape.
 */
import { describe, expect, test } from "vitest";
import {
    createTestClient,
    getLastRequest,
    mockSendRequest,
    setMockResponse,
    type RecordedRequest,
} from "./helpers/mockRequestHandler";
import { AniLinkValidationError } from "../src/base/AniLinkError";

/** A valid `Page` document shaped for `customPage`. */
const VALID_DOCUMENT = `query ($page: Int, $perPage: Int) {
    Page(page: $page, perPage: $perPage) {
        pageInfo { total currentPage lastPage hasNextPage }
        media(type: ANIME, sort: POPULARITY_DESC) { id title { romaji } }
    }
}`;

/** The stubbed `Page` selection's response shape. */
interface StubPage {
    pageInfo: {
        total: number;
        perPage: number;
        currentPage: number;
        lastPage: number;
        hasNextPage: boolean;
    };
    media: Array<{ id: number; title: { romaji: string } }>;
}

/** Builds a stubbed `Page` response page. */
const pageResponse = (ids: number[], hasNextPage: boolean): StubPage => ({
    pageInfo: {
        total: ids.length,
        perPage: 50,
        currentPage: 1,
        lastPage: 1,
        hasNextPage,
    },
    media: ids.map((id) => ({ id, title: { romaji: `media-${id}` } })),
});

describe("customPage", () => {
    test("traverses a valid Page document and collects the items", async () => {
        const client = createTestClient();
        setMockResponse((_request: RecordedRequest) => pageResponse([1, 2], false));
        const result = await client.anilist.customPage<StubPage, "media">(
            VALID_DOCUMENT,
            "media",
            {},
            { perPage: 50, maxPages: 3 }
        );
        expect(result.items).toHaveLength(2);
        expect(result.truncated).toBe(false);
        const request = getLastRequest();
        expect(request?.data).toMatchObject({
            query: VALID_DOCUMENT,
            variables: { page: 1, perPage: 50 },
        });
    });

    test("merges page/perPage over caller variables on every request", async () => {
        const client = createTestClient();
        setMockResponse((_request: RecordedRequest) => pageResponse([1], false));
        await client.anilist.customPage<StubPage, "media">(
            VALID_DOCUMENT,
            "media",
            { page: 999, perPage: 999, type: "ANIME" },
            {}
        );
        const request = getLastRequest();
        // The engine's page/perPage win over the caller's copies; the
        // caller's other variables are forwarded verbatim.
        expect(request?.data).toMatchObject({
            variables: { page: 1, perPage: 50, type: "ANIME" },
        });
    });

    test("rejects a mutation document locally", async () => {
        const client = createTestClient();
        await expect(
            client.anilist.customPage(
                `mutation ($page: Int, $perPage: Int) {
                    Page(page: $page, perPage: $perPage) { pageInfo { hasNextPage } }
                }`,
                "media"
            )
        ).rejects.toThrow(AniLinkValidationError);
        expect(mockSendRequest).not.toHaveBeenCalled();
    });

    test("rejects a document whose root field is not Page", async () => {
        const client = createTestClient();
        await expect(
            client.anilist.customPage(
                `query ($page: Int, $perPage: Int) {
                    Viewer { id }
                }`,
                "media"
            )
        ).rejects.toThrow(AniLinkValidationError);
        expect(mockSendRequest).not.toHaveBeenCalled();
    });

    test("rejects a multi-root document instead of failing at runtime", async () => {
        // A document selecting `Page` plus a second root field passes the
        // regex guards but breaks the single-root unwrap assumption; the
        // fail-closed root-field extraction must reject it locally with a
        // clear validation error rather than a misleading missing-key
        // error from the engine.
        const client = createTestClient();
        await expect(
            client.anilist.customPage(
                `query ($page: Int, $perPage: Int) {
                    Page(page: $page, perPage: $perPage) { pageInfo { hasNextPage } media { id } }
                    Viewer { id }
                }`,
                "media"
            )
        ).rejects.toThrow(AniLinkValidationError);
        expect(mockSendRequest).not.toHaveBeenCalled();
    });

    test("rejects a document missing the $page/$perPage variables", async () => {
        const client = createTestClient();
        await expect(
            client.anilist.customPage(
                `query {
                    Page(page: 1, perPage: 50) { pageInfo { hasNextPage } media { id } }
                }`,
                "media"
            )
        ).rejects.toThrow(AniLinkValidationError);
        expect(mockSendRequest).not.toHaveBeenCalled();
    });

    test("throws a validation error when a page response has no itemsKey", async () => {
        const client = createTestClient();
        setMockResponse(() => ({
            pageInfo: { total: 0, perPage: 50, currentPage: 1, lastPage: 1, hasNextPage: false },
        }));
        await expect(
            client.anilist.customPage<StubPage, "media">(VALID_DOCUMENT, "media")
        ).rejects.toThrow(AniLinkValidationError);
    });
});
