import { AniLink } from "../../src/AniLink";
import { describe, expect, test } from "vitest";
import { preflightCredentials } from "./preflight";

const token = process.env.ANILIST_TOKEN;

if (!token) {
    console.warn(
        "[integration] ANILIST_TOKEN is not set — the live integration suite will be skipped entirely."
    );
}

describe("AniList live integration", () => {
    test.skipIf(!token)("passes the credential preflight before running live queries", async () => {
        await preflightCredentials(new AniLink(token!));
    });

    test.skipIf(!token)("can query the authenticated AniList viewer", async () => {
        const client = new AniLink(token!);
        const result = await client.anilist.query.viewer();

        expect(result).toBeDefined();
        expect(result.id).toBeGreaterThan(0);
        expect(result.name).toBeTruthy();
    });
});
