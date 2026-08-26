import { beforeEach, describe, expect, test, vi } from "vitest";
import { AniLinkApiError, AniLinkErrorCodes, AniLinkNetworkError } from "../src/base/AniLinkError";

const mocks = vi.hoisted(() => {
    const sendRequest = vi.fn();
    return { sendRequest };
});

// Replace the shared pipeline entirely: rejections from this mock reach
// AniListAuth's own error normalization untouched, which is exactly the
// defensive path under test here.
// The global setup stubs axios without the guards AniListAuth's own
// normalization uses, so provide them here.
vi.mock("axios", () => ({
    __esModule: true,
    default: Object.assign(() => undefined, {
        isCancel: (error: unknown) =>
            Boolean((error as { isCanceled?: boolean } | null)?.isCanceled),
        isAxiosError: (error: unknown) =>
            Boolean((error as { isAxiosError?: boolean } | null)?.isAxiosError),
    }),
}));

vi.mock("../src/base/RequestHandler", () => ({
    __esModule: true,
    sendRequest: mocks.sendRequest,
}));

import { getAccessToken, refreshAccessToken } from "../src/apis/graphql/anilist/auth";
import { AniLinkError } from "../src/base/AniLinkError";

beforeEach(() => {
    mocks.sendRequest.mockReset();
});

describe("token request normalization of raw transport failures", () => {
    test("maps a raw cancellation to the ABORTED code", async () => {
        mocks.sendRequest.mockRejectedValueOnce({ isCanceled: true });

        const error = await getAccessToken("client-id", "client-secret", "auth-code").catch(
            (caught: unknown) => caught
        );

        expect(error).toBeInstanceOf(AniLinkNetworkError);
        expect((error as AniLinkNetworkError).code).toBe(AniLinkErrorCodes.ABORTED);
        expect((error as AniLinkNetworkError).message).toContain("cancelled");
    });

    test("maps a raw axios HTTP failure to AniLinkApiError with a safe message", async () => {
        mocks.sendRequest.mockRejectedValueOnce({
            isAxiosError: true,
            response: { status: 403, data: { error: "forbidden" } },
        });

        const error = await refreshAccessToken("client-id", "client-secret", "refresh-token").catch(
            (caught: unknown) => caught
        );

        expect(error).toBeInstanceOf(AniLinkApiError);
        const apiError = error as AniLinkApiError;
        expect(apiError.status).toBe(403);
        expect(apiError.data).toEqual({ error: "forbidden" });
        expect(apiError.message).toContain("Token request failed with status 403");
    });

    test("maps a raw axios timeout code to the TIMEOUT code", async () => {
        mocks.sendRequest.mockRejectedValueOnce({
            isAxiosError: true,
            code: "ETIMEDOUT",
        });

        const error = await getAccessToken("client-id", "client-secret", "auth-code").catch(
            (caught: unknown) => caught
        );

        expect(error).toBeInstanceOf(AniLinkNetworkError);
        expect((error as AniLinkNetworkError).code).toBe(AniLinkErrorCodes.TIMEOUT);
    });

    test("maps a raw axios network failure to the NETWORK code", async () => {
        mocks.sendRequest.mockRejectedValueOnce({
            isAxiosError: true,
            code: "ECONNREFUSED",
        });

        const error = await getAccessToken("client-id", "client-secret", "auth-code").catch(
            (caught: unknown) => caught
        );

        expect(error).toBeInstanceOf(AniLinkNetworkError);
        expect((error as AniLinkNetworkError).code).toBe(AniLinkErrorCodes.NETWORK);
    });

    test("wraps a completely unknown raw rejection in a generic AniLinkError", async () => {
        mocks.sendRequest.mockRejectedValueOnce(new Error("something unexpected"));

        const error = await getAccessToken("client-id", "client-secret", "auth-code").catch(
            (caught: unknown) => caught
        );

        expect(error).toBeInstanceOf(AniLinkError);
        expect(error).not.toBeInstanceOf(AniLinkApiError);
        expect(error).not.toBeInstanceOf(AniLinkNetworkError);
        expect((error as AniLinkError).code).toBe(AniLinkErrorCodes.UNKNOWN);
        expect((error as AniLinkError).message).toContain("token request failed");
    });
});
