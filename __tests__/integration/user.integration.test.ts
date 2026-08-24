import { AniLink } from "../../src/AniLink";
import { AniLinkApiError } from "../../src/base/AniLinkError";
import { describe, expect, test } from "vitest";

const token = process.env.ANILIST_TOKEN;

if (!token) {
    console.warn(
        "[integration] ANILIST_TOKEN is not set — the live integration suite will be skipped entirely."
    );
}

/**
 * Credential preflight: one lightweight authenticated call before any test
 * runs. A present-but-invalid token (expired, revoked, or belonging to the
 * wrong account) would otherwise fail every live test individually with auth
 * errors; this collapses that into a single diagnostic naming the env var and
 * the likely causes.
 *
 * @param client - A client built with the token under test.
 * @throws When the viewer query fails with an auth-classified API error.
 */
const preflightCredentials = async (client: AniLink): Promise<void> => {
    try {
        await client.anilist.query.viewer();
    } catch (error: unknown) {
        if (error instanceof AniLinkApiError && [401, 403].includes(error.status)) {
            throw new Error(
                `[integration] ANILIST_TOKEN was rejected by AniList (HTTP ${error.status}). ` +
                    "The token is likely expired, revoked, or belongs to a different account. " +
                    "Rotate the credential and re-run; skipping per-test failures will not help."
            );
        }
        throw error;
    }
};

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
