import { describe, expect, test, vi } from "vitest";
import { AniLinkApiError, AniLinkNetworkError, AniLinkErrorCodes } from "../src/base/AniLinkError";
import { preflightCredentials } from "./integration/preflight";

/**
 * Unit tests for the credential preflight contract.
 *
 * The live integration suite is skipped entirely when `ANILIST_TOKEN` is
 * unset, so the `preflightCredentials` helper — which collapses a
 * present-but-invalid token into a single diagnostic — would otherwise go
 * untested in every environment without the secret. These tests exercise the
 * contract against a stubbed client so the diagnostic message and the
 * pass-through behavior are verified without a live token.
 */

/** Builds a minimal stub of the `AniLink` client surface the preflight uses. */
const stubClient = (viewer: () => Promise<unknown>): unknown => ({
    anilist: { query: { viewer } },
});

describe("preflightCredentials", () => {
    test("passes through silently when the viewer query succeeds", async () => {
        const viewer = vi.fn().mockResolvedValue({ id: 1, name: "ok" });
        const client = stubClient(viewer) as never;

        await expect(preflightCredentials(client)).resolves.toBeUndefined();
        expect(viewer).toHaveBeenCalledTimes(1);
    });

    test("throws a diagnostic naming the env var when the token is rejected with 401", async () => {
        const viewer = vi
            .fn()
            .mockRejectedValue(new AniLinkApiError(401, { error: "unauthorized" }));
        const client = stubClient(viewer) as never;

        const outcome = preflightCredentials(client).then(
            () => null,
            (error: unknown) => error
        );
        const error = await outcome;

        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain("[integration] ANILIST_TOKEN was rejected");
        expect((error as Error).message).toContain("HTTP 401");
        expect((error as Error).message).toContain("expired, revoked");
    });

    test("throws a diagnostic when the token is rejected with 403", async () => {
        const viewer = vi.fn().mockRejectedValue(new AniLinkApiError(403, { error: "forbidden" }));
        const client = stubClient(viewer) as never;

        const error = await preflightCredentials(client).catch((caught: unknown) => caught);

        expect((error as Error).message).toContain("HTTP 403");
    });

    test("re-throws non-auth errors unchanged so transport failures are not masked", async () => {
        const networkError = new AniLinkNetworkError(
            AniLinkErrorCodes.NETWORK,
            "The request failed due to a network error."
        );
        const viewer = vi.fn().mockRejectedValue(networkError);
        const client = stubClient(viewer) as never;

        const error = await preflightCredentials(client).catch((caught: unknown) => caught);

        expect(error).toBe(networkError);
    });

    test("re-throws a generic AniLinkApiError with a non-auth status unchanged", async () => {
        const serverError = new AniLinkApiError(500, { error: "internal" });
        const viewer = vi.fn().mockRejectedValue(serverError);
        const client = stubClient(viewer) as never;

        const error = await preflightCredentials(client).catch((caught: unknown) => caught);

        expect(error).toBe(serverError);
        expect((error as AniLinkApiError).message).not.toContain("[integration]");
    });
});
