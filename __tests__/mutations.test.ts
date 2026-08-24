import type { AniListApi } from "../src/apis/anilist/facade";
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
