import { afterEach, describe, expect, test, vi } from "vitest";
import { AniLinkApiError, AniLinkError, AniLinkErrorCodes } from "../src/base/AniLinkError";
import { buildErrorContext, reportFailure, safeInvoke } from "../src/base/hooks";
import type { ResolvedRequestOptions } from "../src/base/requestOptions";
import type { HttpMethod } from "../src/base/transportTypes";

/**
 * Direct tests for the hook utilities in `src/base/hooks.ts`.
 *
 * The request-handler suite exercises these only indirectly, which let
 * mutants in the fallback wiring, the error-context shape, and the
 * console-warning format survive earlier mutation runs.
 */

const baseOptions = {
    timeout: 1000,
    exposeRawAxiosError: false,
    retry: null,
    paceWithRateLimit: false,
    rateLimitFloor: 90,
    httpAgent: {} as never,
    httpsAgent: {} as never,
    ignorePaceDeadline: false,
} satisfies Partial<ResolvedRequestOptions> as ResolvedRequestOptions;

afterEach(() => {
    vi.restoreAllMocks();
});

describe("safeInvoke", () => {
    test("does nothing when the hook is undefined", () => {
        const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
        expect(() => safeInvoke(undefined, "onError", undefined, 1, 2)).not.toThrow();
        expect(warn).not.toHaveBeenCalled();
    });

    test("forwards arguments verbatim to the hook", () => {
        const hook = vi.fn();
        safeInvoke(hook as never, "onResponse", undefined, "a", { b: 1 });
        expect(hook).toHaveBeenCalledWith("a", { b: 1 });
    });

    test("reports a throwing hook to onHookError with the hook name and error", () => {
        const onHookError = vi.fn();
        const thrown = new Error("hook exploded");
        const hook = () => {
            throw thrown;
        };
        safeInvoke(hook as never, "onPace", onHookError);
        expect(onHookError).toHaveBeenCalledWith("onPace", thrown);
    });

    test("swallows an exception from onHookError itself", () => {
        const onHookError = () => {
            throw new Error("observer exploded");
        };
        const hook = () => {
            throw new Error("hook exploded");
        };
        expect(() => safeInvoke(hook as never, "onPace", onHookError)).not.toThrow();
    });

    test("warns on the console with the hook name and message when no onHookError is set", () => {
        const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
        const hook = () => {
            throw new Error("telemetry exploded");
        };
        safeInvoke(hook as never, "onRequestStart", undefined);
        expect(warn).toHaveBeenCalledWith(
            "[AniLink] onRequestStart hook threw and was ignored:",
            "telemetry exploded"
        );
    });

    test("includes the requestId in the console warning when the first argument carries one", () => {
        const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
        const hook = () => {
            throw new Error("boom");
        };
        safeInvoke(hook as never, "onResponse", undefined, { requestId: "req-42" });
        expect(warn).toHaveBeenCalledWith(
            "[AniLink] onResponse hook threw and was ignored (requestId: req-42):",
            "boom"
        );
    });

    test("omits the requestId correlation when the first argument has none", () => {
        const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
        const hook = () => {
            throw new Error("boom");
        };
        safeInvoke(hook as never, "onResponse", undefined, { requestId: 42 });
        expect(warn).toHaveBeenCalledWith(
            "[AniLink] onResponse hook threw and was ignored:",
            "boom"
        );
    });

    test("stringifies a non-Error thrown value in the console warning", () => {
        const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
        const hook = () => {
            throw "plain string";
        };
        safeInvoke(hook as never, "onError", undefined);
        expect(warn).toHaveBeenCalledWith(
            "[AniLink] onError hook threw and was ignored:",
            "plain string"
        );
    });
});

describe("buildErrorContext", () => {
    const method: HttpMethod = "POST";

    test("carries the request identity, attempt, and error code", () => {
        const normalized = new AniLinkError("failed", AniLinkErrorCodes.UNKNOWN);
        const context = buildErrorContext("req-1", "https://api.test", method, 2, normalized);
        expect(context).toEqual({
            requestId: "req-1",
            url: "https://api.test",
            method,
            attempt: 2,
            code: AniLinkErrorCodes.UNKNOWN,
        });
    });

    test("adds status only for AniLinkApiError failures", () => {
        const apiError = new AniLinkApiError(429, { ok: false });
        const context = buildErrorContext("req-1", "https://api.test", method, 1, apiError);
        expect(context.status).toBe(429);
    });

    test("adds rateLimit only when the API error carries rate-limit headers", () => {
        const withLimit = new AniLinkApiError(429, {}, undefined, {
            rateLimit: { limit: 90, remaining: 5, reset: 1234 },
        });
        const withoutLimit = new AniLinkApiError(429, {});
        const withContext = buildErrorContext("req-1", "https://api.test", method, 1, withLimit);
        const withoutContext = buildErrorContext(
            "req-1",
            "https://api.test",
            method,
            1,
            withoutLimit
        );
        expect(withContext.rateLimit).toEqual({ limit: 90, remaining: 5, reset: 1234 });
        expect("rateLimit" in withoutContext).toBe(false);
    });

    test("adds nextDelayMs only when a retry is scheduled", () => {
        const normalized = new AniLinkError("failed", AniLinkErrorCodes.UNKNOWN);
        const withDelay = buildErrorContext(
            "req-1",
            "https://api.test",
            method,
            1,
            normalized,
            750
        );
        const withoutDelay = buildErrorContext("req-1", "https://api.test", method, 1, normalized);
        expect(withDelay.nextDelayMs).toBe(750);
        expect("nextDelayMs" in withoutDelay).toBe(false);
    });
});

describe("reportFailure", () => {
    const method: HttpMethod = "POST";
    const normalized = new AniLinkError("failed", AniLinkErrorCodes.UNKNOWN);

    test("routes a retryable failure to onRetry with the scheduled delay", () => {
        const onRetry = vi.fn();
        const onError = vi.fn();
        reportFailure(
            "req-1",
            "https://api.test",
            method,
            1,
            normalized,
            {
                ...baseOptions,
                onRetry,
                onError,
            },
            500
        );
        expect(onRetry).toHaveBeenCalledTimes(1);
        expect(onError).not.toHaveBeenCalled();
        const context = onRetry.mock.calls[0][1];
        expect(context.nextDelayMs).toBe(500);
        expect(context.attempt).toBe(1);
    });

    test("falls back to onError for a retryable failure when onRetry is not configured", () => {
        const onError = vi.fn();
        reportFailure(
            "req-1",
            "https://api.test",
            method,
            1,
            normalized,
            {
                ...baseOptions,
                onError,
            },
            500
        );
        expect(onError).toHaveBeenCalledTimes(1);
        const context = onError.mock.calls[0][1];
        expect(context.nextDelayMs).toBe(500);
    });

    test("routes a terminal failure to onError only", () => {
        const onRetry = vi.fn();
        const onError = vi.fn();
        reportFailure("req-1", "https://api.test", method, 3, normalized, {
            ...baseOptions,
            onRetry,
            onError,
        });
        expect(onError).toHaveBeenCalledTimes(1);
        expect(onRetry).not.toHaveBeenCalled();
        const context = onError.mock.calls[0][1];
        expect("nextDelayMs" in context).toBe(false);
        expect(context.attempt).toBe(3);
    });

    test("keeps a throwing onError from escaping the pipeline", () => {
        const onError = () => {
            throw new Error("hook exploded");
        };
        expect(() =>
            reportFailure("req-1", "https://api.test", method, 1, normalized, {
                ...baseOptions,
                onError,
            })
        ).not.toThrow();
    });
});
