import { unwrapGraphQLResponse } from "../../src/base/RequestHandler";
import {
    createTestClient,
    createTestClientWithOptions,
    createTestClientWithoutToken,
    getLastRequest,
    mockConfigureRequestOptions,
    mockSendRequest,
} from "./mockRequestHandler";
import { expect, test } from "vitest";

test("configures transport options from the AniLink constructor", () => {
    const signal = new AbortController().signal;

    createTestClientWithOptions({ timeout: 1_000, signal });

    expect(mockConfigureRequestOptions).toHaveBeenCalledWith({ timeout: 1_000, signal });
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

test("passes through a response with no root data as-is", () => {
    const envelope = { errors: [{ message: "boom" }] };

    const result = unwrapGraphQLResponse(envelope);

    expect(result).toEqual(envelope);
});
