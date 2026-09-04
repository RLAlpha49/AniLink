import type { AniListApi } from "../src/apis/graphql/anilist/facade";
import type { ActivitiesPageResponse } from "../src/apis/graphql/anilist/interfaces/responses/page/Activities";
import type { ActivityRepliesPageResponse } from "../src/apis/graphql/anilist/interfaces/responses/page/ActivityReplies";
import type { LikesPageResponse } from "../src/apis/graphql/anilist/interfaces/responses/page/Likes";
import type { TextActivity } from "../src/apis/graphql/anilist/interfaces/Activity";
import type { BasicUser } from "../src/apis/graphql/anilist/interfaces/Basic";
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
    ["airing schedules", { id: 1 }, "airingSchedules", "Page"],
    ["media trends", { mediaId: 1 }, "mediaTrends", "Page"],
    ["notifications", { asHtml: true }, "notifications", "Page"],
    ["followers", { userId: 542244, asHtml: true }, "followers", "Page"],
    ["following", { userId: 542244, asHtml: true }, "following", "Page"],
    ["activities", { id: 723235883, asHtml: true }, "activities", "Page"],
    ["activity replies", { id: 12191046, asHtml: true }, "activityReplies", "Page"],
    ["threads", { id: 71881, asHtml: true }, "threads", "Page"],
    ["thread comments", { threadId: 71881, asHtml: true }, "threadComments", "Page"],
    ["reviews", { id: 8008, asHtml: true }, "reviews", "Page"],
    ["recommendations", { mediaId: 156822, asHtml: true }, "recommendations", "Page"],
    ["likes", { likeableId: 723422275, type: "ACTIVITY" }, "likes", "Page"],
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
        { maxPages: 5, concurrency: 1 }
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

/** Build a {@link PageInfo} object for page-response tests. */
function testPageInfo(): ActivitiesPageResponse["pageInfo"] {
    return { total: 1, perPage: 50, currentPage: 1, lastPage: 1, hasNextPage: false };
}

function testBasicUser(id: number, name: string): BasicUser {
    return { id, name, avatar: { large: `https://img.example/${name}.jpg` } };
}

function testTextActivity(id: number): TextActivity {
    return {
        id,
        userId: id,
        type: "TEXT",
        replyCount: 0,
        text: "hello",
        siteUrl: `https://anilist.co/activity/${id}`,
        isLocked: false,
        isSubscribed: false,
        likeCount: 0,
        isLiked: false,
        isPinned: false,
        createdAt: 1_700_000_000,
        user: testBasicUser(id, "poster"),
        replies: [],
        likes: [],
    };
}

describe("page operations return paginated envelopes", () => {
    test("activities resolves to { pageInfo, activities } with discriminated members", async () => {
        const client = createTestClient("shape-token");
        setMockResponse({ pageInfo: testPageInfo(), activities: [testTextActivity(1)] });

        const result: ActivitiesPageResponse = await client.anilist.query.page.activities({
            id: 723235883,
            asHtml: true,
        });

        expect(result.pageInfo).toEqual(testPageInfo());
        expect(result.activities.map((item) => item.id)).toEqual([1]);

        const [first] = result.activities;
        if (first?.type === "TEXT") {
            // Narrowing on the literal `type` field proves the discriminated
            // union flows through the declared page response.
            expect(first.text).toBe("hello");
        } else {
            throw new Error("expected a TextActivity member");
        }
    });

    test("activityReplies resolves to { pageInfo, activityReplies }", async () => {
        const client = createTestClient("shape-token");
        setMockResponse({
            pageInfo: testPageInfo(),
            activityReplies: [
                {
                    id: 9,
                    userId: 1,
                    activityId: 723235883,
                    text: "nice",
                    likeCount: 0,
                    isLiked: false,
                    createdAt: 1_700_000_000,
                    user: testBasicUser(2, "replier"),
                    likes: [],
                },
            ],
        });

        const result: ActivityRepliesPageResponse = await client.anilist.query.page.activityReplies(
            { activityId: 723235883 }
        );

        expect(result.activityReplies.map((item) => item.id)).toEqual([9]);
        expect(result.activityReplies[0]?.user.name).toBe("replier");
    });

    test("likes resolves to { pageInfo, likes }", async () => {
        const client = createTestClient("shape-token");
        setMockResponse({
            pageInfo: testPageInfo(),
            likes: [testBasicUser(3, "liker")],
        });

        const result: LikesPageResponse = await client.anilist.query.page.likes({
            likeableId: 723422275,
            type: "ACTIVITY",
        });

        expect(result.likes.map((user) => user.name)).toEqual(["liker"]);
    });
});
