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
