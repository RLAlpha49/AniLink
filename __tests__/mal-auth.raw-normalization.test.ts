import { beforeEach, describe, expect, test, vi } from "vitest";
import { AniLinkApiError, AniLinkErrorCodes, AniLinkNetworkError } from "../src/base/AniLinkError";

const mocks = vi.hoisted(() => {
    const sendRequest = vi.fn();
    return { sendRequest };
});

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

import { getMalAccessToken, refreshMalAccessToken } from "../src/apis/rest/mal/auth";
import { AniLinkError } from "../src/base/AniLinkError";

beforeEach(() => {
    mocks.sendRequest.mockReset();
});

describe("MAL token request normalization of raw transport failures", () => {
    test("maps a raw cancellation to the ABORTED code", async () => {
        mocks.sendRequest.mockRejectedValueOnce({ isCanceled: true });

        const error = await getMalAccessToken({
            clientId: "client-id",
            code: "auth-code",
            codeVerifier: "verifier",
        }).catch((caught: unknown) => caught);

        expect(error).toBeInstanceOf(AniLinkNetworkError);
        expect((error as AniLinkNetworkError).code).toBe(AniLinkErrorCodes.ABORTED);
        expect((error as AniLinkNetworkError).message).toContain("cancelled");
        expect((error as AniLinkNetworkError).rawAxiosError).toBeUndefined();
    });

    test("maps a raw axios HTTP failure to AniLinkApiError with a safe message", async () => {
        mocks.sendRequest.mockRejectedValueOnce({
            isAxiosError: true,
            response: { status: 400, data: { error: "invalid_grant" } },
        });

        const error = await refreshMalAccessToken({
            clientId: "client-id",
            refreshToken: "refresh-token",
        }).catch((caught: unknown) => caught);

        expect(error).toBeInstanceOf(AniLinkApiError);
        const apiError = error as AniLinkApiError;
        expect(apiError.status).toBe(400);
        expect(apiError.data).toEqual({ error: "invalid_grant" });
        expect(apiError.message).toContain("MAL token request failed with status 400");
        expect(apiError.rawAxiosError).toBeUndefined();
    });

    test("maps a raw axios timeout code to the TIMEOUT code", async () => {
        mocks.sendRequest.mockRejectedValueOnce({
            isAxiosError: true,
            code: "ECONNABORTED",
        });

        const error = await getMalAccessToken({
            clientId: "client-id",
            code: "auth-code",
            codeVerifier: "verifier",
        }).catch((caught: unknown) => caught);

        expect(error).toBeInstanceOf(AniLinkNetworkError);
        expect((error as AniLinkNetworkError).code).toBe(AniLinkErrorCodes.TIMEOUT);
        expect((error as AniLinkNetworkError).rawAxiosError).toBeUndefined();
    });

    test("maps a raw axios ETIMEDOUT code to the TIMEOUT code", async () => {
        mocks.sendRequest.mockRejectedValueOnce({
            isAxiosError: true,
            code: "ETIMEDOUT",
        });

        const error = await getMalAccessToken({
            clientId: "client-id",
            code: "auth-code",
            codeVerifier: "verifier",
        }).catch((caught: unknown) => caught);

        expect(error).toBeInstanceOf(AniLinkNetworkError);
        expect((error as AniLinkNetworkError).code).toBe(AniLinkErrorCodes.TIMEOUT);
    });

    test("maps a raw axios network failure with no response to the NETWORK code", async () => {
        mocks.sendRequest.mockRejectedValueOnce({
            isAxiosError: true,
            code: "ECONNREFUSED",
        });

        const error = await getMalAccessToken({
            clientId: "client-id",
            code: "auth-code",
            codeVerifier: "verifier",
        }).catch((caught: unknown) => caught);

        expect(error).toBeInstanceOf(AniLinkNetworkError);
        expect((error as AniLinkNetworkError).code).toBe(AniLinkErrorCodes.NETWORK);
        expect((error as AniLinkNetworkError).rawAxiosError).toBeUndefined();
    });

    test("wraps a completely unknown raw rejection in a generic AniLinkError", async () => {
        mocks.sendRequest.mockRejectedValueOnce(new Error("something unexpected"));

        const error = await getMalAccessToken({
            clientId: "client-id",
            code: "auth-code",
            codeVerifier: "verifier",
        }).catch((caught: unknown) => caught);

        expect(error).toBeInstanceOf(AniLinkError);
        expect(error).not.toBeInstanceOf(AniLinkApiError);
        expect(error).not.toBeInstanceOf(AniLinkNetworkError);
        expect((error as AniLinkError).code).toBe(AniLinkErrorCodes.UNKNOWN);
        expect((error as AniLinkError).message).toContain("MAL token request failed");
        expect((error as AniLinkError).rawAxiosError).toBeUndefined();
    });

    test("passes through an already-normalized AniLinkNetworkError unchanged", async () => {
        const normalized = new AniLinkNetworkError(
            AniLinkErrorCodes.NETWORK,
            "The request failed due to a network error."
        );
        mocks.sendRequest.mockRejectedValueOnce(normalized);

        const error = await getMalAccessToken({
            clientId: "client-id",
            code: "auth-code",
            codeVerifier: "verifier",
        }).catch((caught: unknown) => caught);

        expect(error).toBe(normalized);
    });
});

describe("MAL token request never exposes the raw Axios error (SEC-001/TEST-005)", () => {
    test("forces exposeRawAxiosError: false even when the caller enables it", async () => {
        mocks.sendRequest.mockRejectedValueOnce(new Error("boom"));

        await getMalAccessToken({
            clientId: "client-id",
            code: "auth-code",
            codeVerifier: "verifier",
            options: { exposeRawAxiosError: true, retry: false },
        }).catch(() => {});

        const forwarded = mocks.sendRequest.mock.calls.at(-1)?.[4] as
            { options?: { exposeRawAxiosError?: boolean } } | undefined;
        expect(forwarded?.options?.exposeRawAxiosError).toBe(false);
    });

    test("forces exposeRawAxiosError: false on refreshAccessToken", async () => {
        mocks.sendRequest.mockRejectedValueOnce(new Error("boom"));

        await refreshMalAccessToken({
            clientId: "client-id",
            refreshToken: "refresh-token",
            options: { exposeRawAxiosError: true, retry: false },
        }).catch(() => {});

        const forwarded = mocks.sendRequest.mock.calls.at(-1)?.[4] as
            { options?: { exposeRawAxiosError?: boolean } } | undefined;
        expect(forwarded?.options?.exposeRawAxiosError).toBe(false);
    });
});
