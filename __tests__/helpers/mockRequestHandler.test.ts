import { unwrapGraphQLResponse } from "../../src/base/RequestHandler";
import { AniLinkGraphQLError } from "../../src/base/AniLinkError";
import {
    createTestClient,
    createTestClientWithOptions,
    createTestClientWithoutToken,
    getLastRequest,
    mockSendRequest,
} from "./mockRequestHandler";
import { expect, test } from "vitest";

test("forwards transport options from the AniLink constructor into sendRequest", async () => {
    const signal = new AbortController().signal;
    const client = createTestClientWithOptions({ timeout: 1_000, signal });

    await client.anilist.query.media({ id: 1, type: "ANIME" });

    // Options now travel inside the named trailing options object.
    const call = mockSendRequest.mock.calls.at(-1) as unknown[] | undefined;
    const sendOptions = call?.[4] as
        { options?: { timeout: number; signal: AbortSignal } } | undefined;
    expect(sendOptions?.options).toEqual({ timeout: 1_000, signal });
});

test("keeps no-token construction valid", () => {
    expect(createTestClientWithoutToken()).toBeDefined();
});

test("routes AniLink requests through the mocked transport", async () => {
    const client = createTestClient("fake-token");

    await client.anilist.query.media({ id: 1, type: "ANIME" });

    expect(mockSendRequest).toHaveBeenCalledTimes(1);
    expect(getLastRequest()).toEqual(
        expect.objectContaining({
            url: "https://graphql.anilist.co",
            method: "POST",
            token: "fake-token",
            data: expect.objectContaining({
                variables: { id: 1, type: "ANIME" },
            }),
        })
    );
});

test("marks authenticated operations as requiring a token", async () => {
    const client = createTestClient("fake-token");

    await client.anilist.query.viewer({ asHtml: true });

    expect(getLastRequest()).toEqual(expect.objectContaining({ requiresAuth: true }));
});

test("does not require a token for public operations", async () => {
    const client = createTestClient("fake-token");

    await client.anilist.query.media({ id: 1, type: "ANIME" });

    expect(getLastRequest()).toEqual(expect.objectContaining({ requiresAuth: undefined }));
});

test("unwraps a single-root-field response to the bare object", () => {
    const envelope = {
        data: {
            Media: { id: 1, title: { romaji: "Cowboy Bebop" } },
        },
    };

    const result = unwrapGraphQLResponse(envelope);

    expect(result).toEqual({ id: 1, title: { romaji: "Cowboy Bebop" } });
    expect(result).not.toHaveProperty("data");
});

test("keeps the full envelope when the response has multiple root fields", () => {
    const envelope = {
        data: {
            User: { id: 1, name: "alpha" },
            Viewer: { id: 1, name: "alpha" },
        },
    };

    const result = unwrapGraphQLResponse(envelope);

    expect(result).toEqual(envelope);
});

test("throws AniLinkGraphQLError for a response with no root data", () => {
    const envelope = { errors: [{ message: "boom" }] };

    expect(() => unwrapGraphQLResponse(envelope)).toThrow(AniLinkGraphQLError);
    try {
        unwrapGraphQLResponse(envelope);
    } catch (error: unknown) {
        expect((error as AniLinkGraphQLError).graphqlErrors).toEqual(envelope.errors);
        expect((error as Error).message).toContain("boom");
    }
});
