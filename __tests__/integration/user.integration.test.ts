import { AniLink } from "../../src/AniLink";
import { describe, expect, test } from "vitest";

const token = process.env.ANILIST_TOKEN;

describe("AniList live integration", () => {
    test.skipIf(!token)("can query the authenticated AniList viewer", async () => {
        const client = new AniLink(token!);
        const result = await client.anilist.query.viewer();

        expect(result).toBeDefined();
        expect(result.id).toBeGreaterThan(0);
        expect(result.name).toBeTruthy();
    });
});
