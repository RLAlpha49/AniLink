import type { AniListApi } from "../src/apis/graphql/anilist/facade";
import {
    createTestClient,
    getLastRequest,
    mockSendRequest,
    setMockResponse,
} from "./helpers/mockRequestHandler";
import { describe, expect, test } from "vitest";

/** Method names are validated against the public API surface at compile time. */
type MutationMethod = keyof AniListApi["mutation"];

const mutationCases: Array<[string, MutationMethod, object, string]> = [
    ["update user", "updateUser", { about: "test", titleLanguage: "ENGLISH" }, "UpdateUser"],
    [
        "save media list entry",
        "saveMediaListEntry",
        { mediaId: 143271, status: "CURRENT", progress: 3 },
        "SaveMediaListEntry",
    ],
    [
        "update media list entries",
        "updateMediaListEntries",
        { status: "CURRENT", score: 8.5, progress: 3, ids: [143271, 156822] },
        "UpdateMediaListEntries",
    ],
    ["delete media list entry", "deleteMediaListEntry", { id: 12345 }, "DeleteMediaListEntry"],
    [
        "delete custom list",
        "deleteCustomList",
        { customList: "test", type: "ANIME" },
        "DeleteCustomList",
    ],
    [
        "save text activity",
        "saveTextActivity",
        { id: 725254160, text: "testing", asHtml: true },
        "SaveTextActivity",
    ],
    [
        "save message activity",
        "saveMessageActivity",
        { recipientId: 542244, message: "testing", private: true, asMod: false },
        "SaveMessageActivity",
    ],
    ["delete activity", "deleteActivity", { id: 725254160 }, "DeleteActivity"],
    [
        "toggle activity subscription",
        "toggleActivitySubscription",
        { activityId: 725674043, subscribe: true },
        "ToggleActivitySubscription",
    ],
    [
        "save activity reply",
        "saveActivityReply",
        { activityId: 725674043, text: "testing" },
        "SaveActivityReply",
    ],
    ["delete activity reply", "deleteActivityReply", { id: 12345 }, "DeleteActivityReply"],
    ["toggle like", "toggleLike", { id: 725674043, type: "ACTIVITY" }, "ToggleLike"],
    ["toggle like v2", "toggleLikeV2", { id: 725674043, type: "ACTIVITY" }, "ToggleLike"],
    ["rate review", "rateReview", { reviewId: 8008, rating: "UP_VOTE" }, "RateReview"],
    ["toggle follow", "toggleFollow", { userId: 542244 }, "ToggleFollow"],
    ["toggle favourite", "toggleFavourite", { studioId: 561 }, "ToggleFavourite"],
    [
        "update favourite order",
        "updateFavouriteOrder",
        { studioIds: [561], studioOrder: [561] },
        "UpdateFavouriteOrder",
    ],
    [
        "toggle thread subscription",
        "toggleThreadSubscription",
        { threadId: 71881, subscribe: true },
        "ToggleThreadSubscription",
    ],
    [
        "update AniChart settings",
        "updateAniChartSettings",
        { titleLanguage: "romaji", outgoingLinkProvider: "anilist", theme: "dark", sort: "title" },
        "UpdateAniChartSettings",
    ],
];

describe("AniList mutations without remote side effects", () => {
    test.each(mutationCases)(
        "%s only builds a mocked request",
        async (_name, method, variables, operation) => {
            const client = createTestClient("mutation-token");
            const call = client.anilist.mutation[method] as (variables: object) => Promise<unknown>;

            const result = await call(variables);

            expect(mockSendRequest).toHaveBeenCalledTimes(1);
            expect(getLastRequest()).toEqual(
                expect.objectContaining({
                    url: "https://graphql.anilist.co",
                    method: "POST",
                    token: "mutation-token",
                    data: expect.objectContaining({
                        query: expect.stringContaining(operation),
                        variables,
                    }),
                })
            );
            expect(result).toEqual({ __typename: "MockResponse" });
        }
    );

    test("passes a multi-root-field envelope through a mutation operation", async () => {
        setMockResponse({
            data: {
                SaveMediaListEntry: { id: 9, mediaId: 143271 },
                UpdateUser: { id: 542244 },
            },
        });
        const client = createTestClient("shape-mutation-token");

        const result = await client.anilist.mutation.saveMediaListEntry({
            mediaId: 143271,
            status: "CURRENT",
            progress: 3,
        });

        expect(result).toEqual({
            data: {
                SaveMediaListEntry: { id: 9, mediaId: 143271 },
                UpdateUser: { id: 542244 },
            },
        });
    });

    test("sends custom mutations through the mocked transport", async () => {
        const client = createTestClient("custom-mutation-token");
        await client.anilist.custom(
            "mutation ($about: String) { UpdateUser (about: $about) { id } }",
            { about: "test" }
        );

        expect(getLastRequest()).toEqual(
            expect.objectContaining({
                token: "custom-mutation-token",
                data: {
                    query: expect.stringContaining("UpdateUser"),
                    variables: { about: "test" },
                },
            })
        );
    });
});

const transportContractCases: Array<{
    /** Human-readable row label shown by the test runner. */
    name: string;
    /** The bound facade method under `client.anilist.mutation`. */
    method: MutationMethod;
    /** Variables valid for the operation; forwarded verbatim to the transport. */
    variables: object;
    /** The root mutation field the shipped document must select. */
    rootField: string;
}> = [
    {
        name: "deleteActivity",
        method: "deleteActivity",
        variables: { id: 725254160 },
        rootField: "DeleteActivity",
    },
    {
        name: "deleteActivityReply",
        method: "deleteActivityReply",
        variables: { id: 12345 },
        rootField: "DeleteActivityReply",
    },
    {
        name: "deleteCustomList",
        method: "deleteCustomList",
        variables: { customList: "Watched", type: "ANIME" },
        rootField: "DeleteCustomList",
    },
    {
        name: "deleteMediaListEntry",
        method: "deleteMediaListEntry",
        variables: { id: 56431875 },
        rootField: "DeleteMediaListEntry",
    },
    {
        name: "deleteReview",
        method: "deleteReview",
        variables: { id: 17 },
        rootField: "DeleteReview",
    },
    {
        name: "deleteThread",
        method: "deleteThread",
        variables: { id: 71881 },
        rootField: "DeleteThread",
    },
    {
        name: "deleteThreadComment",
        method: "deleteThreadComment",
        variables: { id: 4242 },
        rootField: "DeleteThreadComment",
    },
    {
        name: "rateReview",
        method: "rateReview",
        variables: { reviewId: 8008, rating: "UP_VOTE" },
        rootField: "RateReview",
    },
    {
        name: "saveActivityReply (edit of an existing reply)",
        method: "saveActivityReply",
        variables: { id: 9, text: "edited" },
        rootField: "SaveActivityReply",
    },
    {
        name: "saveListActivity",
        method: "saveListActivity",
        variables: { id: 143271, locked: false, asHtml: true },
        rootField: "SaveListActivity",
    },
    {
        name: "saveMediaListEntry",
        method: "saveMediaListEntry",
        variables: { mediaId: 143271, status: "CURRENT", progress: 3 },
        rootField: "SaveMediaListEntry",
    },
    {
        name: "saveMessageActivity (new message)",
        method: "saveMessageActivity",
        variables: { recipientId: 542244, message: "hello", private: true, asMod: false },
        rootField: "SaveMessageActivity",
    },
    {
        name: "saveRecommendation",
        method: "saveRecommendation",
        variables: { mediaId: 1, mediaRecommendationId: 30, rating: "RATE_UP" },
        rootField: "SaveRecommendation",
    },
    {
        name: "saveReview (create)",
        method: "saveReview",
        variables: { mediaId: 1, body: "body", summary: "summary", score: 9 },
        rootField: "SaveReview",
    },
    {
        name: "saveTextActivity (new post)",
        method: "saveTextActivity",
        variables: { text: "testing", asHtml: true },
        rootField: "SaveTextActivity",
    },
    {
        name: "saveThread (create)",
        method: "saveThread",
        variables: { title: "t", body: "b", categories: [1, 2], mediaCategories: [] },
        rootField: "SaveThread",
    },
    {
        name: "saveThreadComment (create)",
        method: "saveThreadComment",
        variables: { threadId: 71881, comment: "nice" },
        rootField: "SaveThreadComment",
    },
    {
        name: "toggleActivityPin",
        method: "toggleActivityPin",
        variables: { id: 725674043, pinned: true },
        rootField: "ToggleActivityPin",
    },
    {
        name: "toggleActivitySubscription",
        method: "toggleActivitySubscription",
        variables: { activityId: 725674043, subscribe: true },
        rootField: "ToggleActivitySubscription",
    },
    {
        name: "toggleFavourite (anime)",
        method: "toggleFavourite",
        variables: { animeId: 1 },
        rootField: "ToggleFavourite",
    },
    {
        name: "toggleFollow",
        method: "toggleFollow",
        variables: { userId: 542244 },
        rootField: "ToggleFollow",
    },
    {
        name: "toggleLike",
        method: "toggleLike",
        variables: { id: 725674043, type: "ACTIVITY" },
        rootField: "ToggleLike",
    },
    {
        name: "toggleLikeV2",
        method: "toggleLikeV2",
        variables: { id: 725674043, type: "THREAD" },
        rootField: "ToggleLikeV2",
    },
    {
        name: "toggleThreadSubscription",
        method: "toggleThreadSubscription",
        variables: { threadId: 71881, subscribe: true },
        rootField: "ToggleThreadSubscription",
    },
    {
        name: "updateAniChartHighlights",
        method: "updateAniChartHighlights",
        variables: { highlights: [{ mediaId: 143271, highlight: true }] },
        rootField: "UpdateAniChartHighlights",
    },
    {
        name: "updateAniChartSettings",
        method: "updateAniChartSettings",
        variables: {
            titleLanguage: "romaji",
            outgoingLinkProvider: "anilist",
            theme: "dark",
            sort: "title",
        },
        rootField: "UpdateAniChartSettings",
    },
    {
        name: "updateFavouriteOrder",
        method: "updateFavouriteOrder",
        variables: { studioIds: [561], studioOrder: [561] },
        rootField: "UpdateFavouriteOrder",
    },
    {
        name: "updateMediaListEntries",
        method: "updateMediaListEntries",
        variables: { ids: [143271, 156822], status: "CURRENT", score: 8.5, progress: 3 },
        rootField: "UpdateMediaListEntries",
    },
    {
        name: "updateUser",
        method: "updateUser",
        variables: { about: "test", titleLanguage: "ENGLISH" },
        rootField: "UpdateUser",
    },
];

describe("mutation transport contracts", () => {
    test("every shipped mutation module has a contract row", () => {
        expect(transportContractCases).toHaveLength(29);
    });

    test.each(transportContractCases)(
        "$name sends its document, forwards variables verbatim, and requires auth",
        async ({ method, variables, rootField }) => {
            const client = createTestClient("contract-token");
            const call = client.anilist.mutation[method] as (
                variables: object,
                options?: object
            ) => Promise<unknown>;

            const result = await call(variables);

            expect(result).toEqual({ __typename: "MockResponse" });
            expect(mockSendRequest).toHaveBeenCalledTimes(1);

            const request = getLastRequest();
            expect(request?.url).toBe("https://graphql.anilist.co");
            expect(request?.method).toBe("POST");
            expect(request?.token).toBe("contract-token");
            expect(request?.requiresAuth).toBe(true);

            const data = request?.data as { query?: string; variables?: unknown } | undefined;
            expect(data?.query).toContain("mutation");
            expect(data?.query).toMatch(new RegExp(`${rootField}\\s*\\(`));
            expect(data?.variables).toEqual(variables);
        }
    );

    test("optional-variable omission: saveTextActivity edit sends only the provided keys", async () => {
        const client = createTestClient("omission-token");

        await client.anilist.mutation.saveTextActivity({ id: 725254160, text: "edited" });

        const request = getLastRequest();
        expect(request?.data).toEqual(
            expect.objectContaining({
                variables: { id: 725254160, text: "edited" },
            })
        );
    });
});
