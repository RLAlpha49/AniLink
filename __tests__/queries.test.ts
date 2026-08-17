import { createTestClient, getLastRequest, mockSendRequest } from "./helpers/mockRequestHandler";
import { describe, expect, test } from "vitest";

const queryCases: Array<[string, string, object | undefined, string]> = [
    ["user", "user", { id: 542244, isHTML: true }, "User"],
    ["media", "media", { id: 1, type: "ANIME" }, "Media"],
    ["media trend", "mediaTrend", { mediaId: 1, type: "ANIME" }, "MediaTrend"],
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
    ["viewer", "viewer", { isHTML: true }, "Viewer"],
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
            const call = (client.anilist.query as any)[method];

            if (variables === undefined) {
                await call();
            } else {
                await call(variables);
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
