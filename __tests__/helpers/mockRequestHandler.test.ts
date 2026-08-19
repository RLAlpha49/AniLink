import { unwrapGraphQLResponse } from "../../src/base/RequestHandler";
import { createTestClient, getLastRequest, mockSendRequest } from "./mockRequestHandler";
import { expect, test } from "vitest";

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
