import { describe, expect, test, vi } from "vitest";
import {
    AniLinkApiError,
    AniLinkError,
    AniLinkErrorCodes,
    AniLinkNetworkError,
    AniLinkRestError,
} from "../src/base/AniLinkError";
import { sanitizeTokenError } from "../src/base/tokenError";

/**
 * Direct parity tests for the shared `sanitizeTokenError` helper.
 *
 * Both provider auth modules delegate token-request error normalization to
 * this helper, so it owns the credential-leak-prevention invariant: the
 * returned error must never carry the raw Axios error (which contains
 * `client_secret`, `code`, `refresh_token`, and the `Authorization` header).
 * These tests cover every branch directly so a regression in one branch
 * cannot hide behind a provider's integration test.
 */

// `sanitizeTokenError` uses `axios.isCancel` and `axios.isAxiosError` to
// classify raw transport rejections, so provide a minimal axios double.
vi.mock("axios", () => ({
    __esModule: true,
    default: Object.assign(() => undefined, {
        isCancel: (error: unknown) =>
            Boolean((error as { isCanceled?: boolean } | null)?.isCanceled),
        isAxiosError: (error: unknown) =>
            Boolean((error as { isAxiosError?: boolean } | null)?.isAxiosError),
    }),
}));

const LABEL = "AniList token request";

describe("sanitizeTokenError", () => {
    test("relabeled AniLinkRestError keeps status, data, rateLimit, and contentType", () => {
        const rateLimit = { limit: 90, remaining: 0, reset: 1_000 };
        const original = new AniLinkRestError(
            429,
            { message: "too many requests" },
            { isAxiosError: true, config: { headers: { authorization: "Bearer secret" } } },
            { rateLimit, contentType: "text/html" }
        );

        const result = sanitizeTokenError(original, LABEL);

        expect(result).toBeInstanceOf(AniLinkRestError);
        const relabeled = result as AniLinkRestError;
        expect(relabeled.status).toBe(429);
        expect(relabeled.data).toEqual({ message: "too many requests" });
        expect(relabeled.rateLimit).toEqual(rateLimit);
        expect(relabeled.contentType).toBe("text/html");
        expect(relabeled.message).toContain(`${LABEL} failed with status 429`);
    });

    test("relabeled AniLinkRestError never carries the raw Axios error", () => {
        const original = new AniLinkRestError(
            500,
            {},
            {
                isAxiosError: true,
                config: { headers: { authorization: "Bearer secret" } },
            }
        );

        const result = sanitizeTokenError(original, LABEL) as AniLinkRestError;

        expect(result.rawAxiosError).toBeUndefined();
    });

    test("relabeled AniLinkApiError keeps status, data, rateLimit, and contentType", () => {
        const rateLimit = { limit: 90, remaining: 0, reset: 1_000 };
        const original = new AniLinkApiError(
            403,
            { error: "forbidden" },
            { isAxiosError: true, config: { headers: { authorization: "Bearer secret" } } },
            { rateLimit, contentType: "application/json" }
        );

        const result = sanitizeTokenError(original, LABEL);

        expect(result).toBeInstanceOf(AniLinkApiError);
        const relabeled = result as AniLinkApiError;
        expect(relabeled.status).toBe(403);
        expect(relabeled.data).toEqual({ error: "forbidden" });
        expect(relabeled.rateLimit).toEqual(rateLimit);
        expect(relabeled.contentType).toBe("application/json");
        expect(relabeled.message).toContain(`${LABEL} failed with status 403`);
    });

    test("relabeled AniLinkApiError never carries the raw Axios error", () => {
        const original = new AniLinkApiError(
            500,
            {},
            {
                isAxiosError: true,
                config: { headers: { authorization: "Bearer secret" } },
            }
        );

        const result = sanitizeTokenError(original, LABEL) as AniLinkApiError;

        expect(result.rawAxiosError).toBeUndefined();
    });

    test("forwards requestId from a relabeled AniLinkApiError", () => {
        const original = new AniLinkApiError(500, {}, undefined, { requestId: "req-123" });

        const result = sanitizeTokenError(original, LABEL) as AniLinkApiError;

        expect(result.requestId).toBe("req-123");
    });

    test("forwards requestId from a relabeled AniLinkRestError", () => {
        const original = new AniLinkRestError(500, {}, undefined, { requestId: "req-456" });

        const result = sanitizeTokenError(original, LABEL) as AniLinkRestError;

        expect(result.requestId).toBe("req-456");
    });

    test("passes through an already-normalized AniLinkError unchanged", () => {
        const original = new AniLinkError("custom failure", AniLinkErrorCodes.UNKNOWN);

        const result = sanitizeTokenError(original, LABEL);

        expect(result).toBe(original);
    });

    test("maps a raw cancellation to the ABORTED code with the label", () => {
        const result = sanitizeTokenError({ isCanceled: true }, LABEL);

        expect(result).toBeInstanceOf(AniLinkNetworkError);
        expect((result as AniLinkNetworkError).code).toBe(AniLinkErrorCodes.ABORTED);
        expect((result as AniLinkNetworkError).message).toContain(LABEL);
        expect((result as AniLinkNetworkError).message).toContain("cancelled");
        expect((result as AniLinkNetworkError).rawAxiosError).toBeUndefined();
    });

    test("maps a raw axios HTTP failure to AniLinkApiError with a safe message", () => {
        const result = sanitizeTokenError(
            {
                isAxiosError: true,
                response: { status: 403, data: { error: "forbidden" } },
            },
            LABEL
        );

        expect(result).toBeInstanceOf(AniLinkApiError);
        const apiError = result as AniLinkApiError;
        expect(apiError.status).toBe(403);
        expect(apiError.data).toEqual({ error: "forbidden" });
        expect(apiError.message).toContain(`${LABEL} failed with status 403`);
        expect(apiError.rawAxiosError).toBeUndefined();
    });

    test("maps a raw axios timeout code to the TIMEOUT code", () => {
        const result = sanitizeTokenError({ isAxiosError: true, code: "ETIMEDOUT" }, LABEL);

        expect(result).toBeInstanceOf(AniLinkNetworkError);
        expect((result as AniLinkNetworkError).code).toBe(AniLinkErrorCodes.TIMEOUT);
        expect((result as AniLinkNetworkError).message).toContain(LABEL);
        expect((result as AniLinkNetworkError).rawAxiosError).toBeUndefined();
    });

    test("maps a raw axios network failure to the NETWORK code", () => {
        const result = sanitizeTokenError({ isAxiosError: true, code: "ECONNREFUSED" }, LABEL);

        expect(result).toBeInstanceOf(AniLinkNetworkError);
        expect((result as AniLinkNetworkError).code).toBe(AniLinkErrorCodes.NETWORK);
        expect((result as AniLinkNetworkError).rawAxiosError).toBeUndefined();
    });

    test("wraps a completely unknown rejection in a generic AniLinkError", () => {
        const result = sanitizeTokenError(new Error("something unexpected"), LABEL);

        expect(result).toBeInstanceOf(AniLinkError);
        expect(result).not.toBeInstanceOf(AniLinkApiError);
        expect(result).not.toBeInstanceOf(AniLinkNetworkError);
        expect((result as AniLinkError).code).toBe(AniLinkErrorCodes.UNKNOWN);
        expect((result as AniLinkError).message).toContain(LABEL);
        expect((result as AniLinkError).rawAxiosError).toBeUndefined();
    });
});
