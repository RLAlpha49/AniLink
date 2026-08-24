import type { AniListApi } from "../src/apis/anilist/facade";
import {
    createTestClient,
    getLastRequest,
    mockSendRequest,
    setMockResponse,
} from "./helpers/mockRequestHandler";
import { AniLinkErrorCodes, AniLinkValidationError } from "../src/base/AniLinkError";
import { describe, expect, test } from "vitest";

/** Method names are validated against the public API surface at compile time. */
type QueryMethod = keyof AniListApi["query"];

const queryCases: Array<[string, QueryMethod, object | undefined, string]> = [
    ["user", "user", { id: 542244, asHtml: true }, "User"],
    ["media", "media", { id: 1, type: "ANIME" }, "Media"],
    ["media trend", "mediaTrend", { mediaId: 1 }, "MediaTrend"],
    ["airing schedule", "airingSchedule", { mediaId: 130590 }, "AiringSchedule"],
    ["character", "character", { search: "Rimuru Tempest", asHtml: true }, "Character"],
    ["staff", "staff", { id: 132186, asHtml: true }, "Staff"],
    ["media list", "mediaList", { userId: 6503722 }, "MediaList"],
    [
        "media list collection",
        "mediaListCollection",
        { userId: 542244, type: "ANIME", status: "COMPLETED", chunk: 1, perChunk: 100 },
        "MediaListCollection",
    ],
    ["genre collection", "genreCollection", undefined, "GenreCollection"],
    ["media tag collection", "mediaTagCollection", undefined, "MediaTagCollection"],
    ["viewer", "viewer", { asHtml: true }, "Viewer"],
    ["notification", "notification", { asHtml: true }, "Notification"],
    ["studio", "studio", { id: 561, asHtml: true }, "Studio"],
    ["review", "review", { id: 8008, asHtml: true }, "Review"],
    ["activity", "activity", { userId: 542244, asHtml: true }, "Activity"],
    ["activity reply", "activityReply", { id: 12191046, asHtml: true }, "ActivityReply"],
    ["following", "following", { userId: 542244, asHtml: true }, "Following"],
    ["follower", "follower", { userId: 542244, asHtml: true }, "Follower"],
    ["thread", "thread", { id: 71881, asHtml: true }, "Thread"],
    ["thread comment", "threadComment", { id: 2555166, asHtml: true }, "ThreadComment"],
    ["recommendation", "recommendation", { mediaId: 156822, asHtml: true }, "Recommendation"],
    ["markdown", "markdown", { markdown: "Hello" }, "Markdown"],
    ["AniChart user", "aniChartUser", undefined, "AniChartUser"],
    ["site statistics", "siteStatistics", undefined, "SiteStatistics"],
    [
        "external link source collection",
        "externalLinkSourceCollection",
        undefined,
        "ExternalLinkSourceCollection",
    ],
];

describe("AniList single-resource queries", () => {
    test.each(queryCases)(
        "%s is handled without network access",
        async (_name, method, variables, operation) => {
            const client = createTestClient("query-token");
            const call = client.anilist.query[method] as (variables?: object) => Promise<unknown>;
            let result;

            if (variables === undefined) {
                result = await call();
            } else {
                result = await call(variables);
            }

            expect(mockSendRequest).toHaveBeenCalledTimes(1);
            expect(getLastRequest()).toEqual(
                expect.objectContaining({
                    url: "https://graphql.anilist.co",
                    method: "POST",
                    token: "query-token",
                    data: expect.objectContaining({ query: expect.stringContaining(operation) }),
                })
            );

            if (variables !== undefined) {
                expect(getLastRequest()?.data).toEqual(expect.objectContaining({ variables }));
            }

            expect(result).toEqual({ __typename: "MockResponse" });
        }
    );
});

test("sends custom query text and variables through the mocked transport", async () => {
    const client = createTestClient("custom-token");
    await client.anilist.custom("query ($id: Int) { Media (id: $id) { id } }", { id: 1 });

    expect(getLastRequest()).toEqual(
        expect.objectContaining({
            token: "custom-token",
            data: { query: expect.stringContaining("Media"), variables: { id: 1 } },
        })
    );
});

test("passes the resolved payload through a query operation unchanged", async () => {
    // The mocked transport stands in for the real one, so it resolves with
    // what `sendRequest` would return after unwrapping the GraphQL envelope.
    setMockResponse({ id: 1, title: { romaji: "Cowboy Bebop" } });
    const client = createTestClient("shape-query-token");

    const result = await client.anilist.query.media({ id: 1, type: "ANIME" });

    expect(result).toEqual({ id: 1, title: { romaji: "Cowboy Bebop" } });
});

test("custom() defaults omitted variables to an empty object", async () => {
    const client = createTestClient("default-vars-token");

    await client.anilist.custom("query { Viewer { id } }");

    expect(getLastRequest()?.data).toEqual({
        query: expect.stringContaining("Viewer"),
        variables: {},
    });
});

describe("custom() local input guards", () => {
    const rejectedInputs: Array<[string, unknown]> = [
        ["an empty string", ""],
        ["a whitespace-only string", "   \n\t  "],
        ["a number instead of a document", 42],
        ["null instead of a document", null],
        ["a document without a query or mutation keyword", "{ Viewer { id } }"],
    ];

    test.each(rejectedInputs)(
        "%s is rejected locally with a validation error",
        async (_name, input) => {
            const client = createTestClient("guard-token");

            const outcome = await client.anilist.custom(input as string).then(
                () => "resolved",
                (error: unknown) => error
            );

            expect(outcome).toBeInstanceOf(AniLinkValidationError);
            expect((outcome as AniLinkValidationError).code).toBe(AniLinkErrorCodes.VALIDATION);
            expect(mockSendRequest).not.toHaveBeenCalled();
            expect(getLastRequest()).toBeUndefined();
        }
    );

    test("a valid mutation document passes the guard and reaches the transport", async () => {
        const client = createTestClient("guarded-mutation-token");

        await client.anilist.custom('mutation { UpdateUser (about: "ok") { id } }');

        expect(mockSendRequest).toHaveBeenCalledTimes(1);
        expect(getLastRequest()?.data).toEqual(
            expect.objectContaining({
                query: expect.stringContaining("UpdateUser"),
            })
        );
    });
});

test("fuzzyDate helper builds a FuzzyDateInput from the facade", () => {
    const client = createTestClient("fuzzy-token");
    const result = client.anilist.fuzzyDate({ year: 2024, month: 4, day: 15 });
    expect(result).toEqual({ year: 2024, month: 4, day: 15 });
});

test("flattenMediaListCollection helper flattens list groups from the facade", () => {
    const client = createTestClient("flatten-token");
    const collection = {
        lists: [
            {
                entries: [
                    {
                        id: 1,
                        userId: 5,
                        mediaId: 100,
                        status: "COMPLETED",
                        score: 8,
                        progress: 12,
                        progressVolumes: 0,
                        repeat: 0,
                        priority: 0,
                        private: false,
                        notes: "",
                        hiddenFromStatusLists: false,
                        customLists: [],
                        advancedScores: [],
                        startedAt: { year: 0, month: 0, day: 0 },
                        completedAt: { year: 0, month: 0, day: 0 },
                        updatedAt: 0,
                        createdAt: 0,
                        media: {},
                    },
                ],
                name: "Completed",
                isCustomList: false,
                isSplitCompletedList: false,
                status: "COMPLETED",
            },
        ],
        hasNextChunk: false,
    };
    const entries = client.anilist.flattenMediaListCollection(collection);
    expect(entries).toHaveLength(1);
    expect(entries[0].listNames).toEqual(["Completed"]);
    expect(entries[0].mediaId).toBe(100);
});
