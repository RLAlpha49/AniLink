import type { AniListApi } from "../src/apis/graphql/anilist/facade";
import {
    createTestClient,
    getLastRequest,
    mockSendRequest,
    setMockResponse,
} from "./helpers/mockRequestHandler";
import { AniLinkValidationError } from "../src/base/AniLinkError";
import { ANILIST_OPERATION_REGISTRY } from "../src/apis/graphql/anilist/registry";
import { describe, expect, test } from "vitest";

/** Method names are validated against the public API surface at compile time. */
type MutationMethod = keyof AniListApi["mutation"];

describe("AniList mutations without remote side effects", () => {
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

test.each([
    ["anime", { animeOrder: [1] }],
    ["manga", { mangaOrder: [1] }],
    ["character", { characterOrder: [1] }],
    ["staff", { staffOrder: [1] }],
    ["studio", { studioOrder: [1] }],
])("rejects a %s order when its id array is missing", async (_name, variables) => {
    const client = createTestClient("validation-token");

    await expect(
        client.anilist.mutation.updateFavouriteOrder(variables as never)
    ).rejects.toBeInstanceOf(AniLinkValidationError);
    expect(mockSendRequest).not.toHaveBeenCalled();
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
        // Compare against the registry (the single source of truth) so adding
        // a shipped mutation without a contract row here actually fails.
        const registryMutationNames = ANILIST_OPERATION_REGISTRY.mutation.map(
            (entry) => entry.name
        );
        const contractMethodNames = transportContractCases.map((row) => row.method);

        expect(contractMethodNames).toHaveLength(registryMutationNames.length);
        expect([...contractMethodNames].sort()).toEqual([...registryMutationNames].sort());
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
            const rootFieldIndex = data?.query?.indexOf(rootField) ?? -1;
            expect(rootFieldIndex).toBeGreaterThanOrEqual(0);
            expect(data?.query?.slice(rootFieldIndex + rootField.length)).toMatch(/^\s*\(/);
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
