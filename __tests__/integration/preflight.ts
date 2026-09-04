import { AniLinkApiError } from "../../src/base/AniLinkError";
import type { AniLink } from "../../src/AniLink";

/**
 * Credential preflight: one lightweight authenticated call before any
 * integration test runs.
 *
 * A present-but-invalid token (expired, revoked, or belonging to the wrong
 * account) would otherwise fail roughly forty tests individually with auth
 * errors; this collapses that into a single diagnostic naming the env var
 * and the likely causes.
 *
 * Extracted into a shared module so the preflight contract is unit-tested
 * even when the live integration suite is skipped (no `ANILIST_TOKEN`).
 *
 * @param client - A client built with the token under test.
 * @throws When the viewer query fails with an auth-classified API error.
 */
export const preflightCredentials = async (client: AniLink): Promise<void> => {
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
