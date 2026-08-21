import type { AniListApi } from "../src/apis/anilist/facade";
import {
    createTestClient,
    getLastRequest,
    mockSendRequest,
    setMockResponse,
} from "./helpers/mockRequestHandler";
import { describe, expect, test } from "vitest";

/** Method names are validated against the public API surface at compile time. */
type PageMethod = keyof AniListApi["query"]["page"];

const pageCases: Array<[string, object, PageMethod, string]> = [
    ["users", { asHtml: true }, "users", "Page"],
    ["medias", { id: 1, type: "ANIME" }, "medias", "Page"],
    ["characters", { id: 1, asHtml: true }, "characters", "Page"],
    ["staffs", { id: 132186, asHtml: true }, "staffs", "Page"],
    ["studios", { asHtml: true }, "studios", "Page"],
    ["media lists", { userId: 542244 }, "mediaLists", "Page"],
    ["airing schedules", { type: "ANIME" }, "airingSchedules", "Page"],
    ["media trends", { type: "ANIME" }, "mediaTrends", "Page"],
    ["notifications", { asHtml: true }, "notifications", "Page"],
    ["followers", { userId: 542244, asHtml: true }, "followers", "Page"],
    ["following", { userId: 542244, asHtml: true }, "following", "Page"],
    ["activities", { id: 723235883, asHtml: true }, "activities", "Page"],
    ["activity replies", { id: 12191046, asHtml: true }, "activityReplies", "Page"],
    ["threads", { id: 71881, asHtml: true }, "threads", "Page"],
    ["thread comments", { threadId: 71881, asHtml: true }, "threadComments", "Page"],
    ["reviews", { id: 8008, asHtml: true }, "reviews", "Page"],
    ["recommendations", { mediaId: 156822, asHtml: true }, "recommendations", "Page"],
    ["likes", { likeableId: 723422275, type: "ACTIVITY", asHtml: true }, "likes", "Page"],
];

describe("AniList page queries", () => {
    test.each(pageCases)(
        "%s is handled without network access",
        async (_name, variables, method, operation) => {
            const client = createTestClient("page-query-token");
            const call = client.anilist.query.page[method] as (
                variables: object
            ) => Promise<unknown>;

            await call(variables);

            expect(mockSendRequest).toHaveBeenCalledTimes(1);
            expect(getLastRequest()).toEqual(
                expect.objectContaining({
                    url: "https://graphql.anilist.co",
                    method: "POST",
                    token: "page-query-token",
                    data: expect.objectContaining({
                        query: expect.stringContaining(operation),
                        variables,
                    }),
                })
            );
        }
    );
});

test("paginate helper iterates pages through the facade with a maxPages guard", async () => {
    const client = createTestClient("paginate-token");

    let callCount = 0;
    mockSendRequest.mockImplementation(async () => {
        callCount += 1;
        const hasNextPage = callCount < 2;
        return {
            pageInfo: {
                total: 100,
                perPage: 50,
                currentPage: callCount,
                lastPage: 2,
                hasNextPage,
            },
            media: [{ id: callCount }],
        };
    });

    const result = await client.anilist.paginate(
        (page, perPage) =>
            client.anilist.query.page.medias({ page, perPage, type: "ANIME" } as never),
        "media",
        { maxPages: 5 }
    );

    expect(mockSendRequest).toHaveBeenCalledTimes(2);
    expect(result.pageCount).toBe(2);
    expect(result.truncated).toBe(false);
    expect(result.items).toEqual([{ id: 1 }, { id: 2 }]);
});

test("paginate helper truncates at the maxPages guard", async () => {
    const client = createTestClient("paginate-token");

    mockSendRequest.mockImplementation(async () => ({
        pageInfo: {
            total: 1000,
            perPage: 50,
            currentPage: 1,
            lastPage: 20,
            hasNextPage: true,
        },
        media: [{ id: 1 }],
    }));

    const result = await client.anilist.paginate(
        (page, perPage) =>
            client.anilist.query.page.medias({ page, perPage, type: "ANIME" } as never),
        "media",
        { maxPages: 3 }
    );

    expect(mockSendRequest).toHaveBeenCalledTimes(3);
    expect(result.pageCount).toBe(3);
    expect(result.truncated).toBe(true);
});

test("passes an error-only response through a page operation unchanged", async () => {
    setMockResponse({ errors: [{ message: "Not Found" }] });
    const client = createTestClient("shape-page-token");

    const result = await client.anilist.query.page.medias({ page: 1, perPage: 10 });

    expect(result).toEqual({ errors: [{ message: "Not Found" }] });
});
