import { afterEach, describe, expect, test, vi } from "vitest";
import { AniLinkApiError, AniLinkError, AniLinkErrorCodes } from "../src/base/AniLinkError";
import { buildErrorContext, reportDiagnostic, reportFailure, safeInvoke } from "../src/base/hooks";
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
    allowPartialData: false,
    bypassResponseCache: false,
    diagnostics: "warn",
} satisfies Partial<ResolvedRequestOptions> as ResolvedRequestOptions;

afterEach(() => {
    vi.restoreAllMocks();
});

describe("safeInvoke", () => {
    test("does nothing when the hook is undefined", () => {
        const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
        expect(() => safeInvoke(undefined, "onError", undefined, "warn", 1, 2)).not.toThrow();
        expect(warn).not.toHaveBeenCalled();
    });

    test("forwards arguments verbatim to the hook", () => {
        const hook = vi.fn();
        safeInvoke(hook as never, "onResponse", undefined, "warn", "a", { b: 1 });
        expect(hook).toHaveBeenCalledWith("a", { b: 1 });
    });

    test("reports a throwing hook to onHookError with the hook name and a structured record", () => {
        const onHookError = vi.fn();
        const thrown = new Error("hook exploded");
        const hook = () => {
            throw thrown;
        };
        safeInvoke(hook as never, "onPace", onHookError, "warn");
        expect(onHookError).toHaveBeenCalledTimes(1);
        const [name, error] = onHookError.mock.calls[0];
        expect(name).toBe("onPace");
        expect(error).toBeInstanceOf(Error);
        // The raw thrown value rides behind the structured record as the
        // cause, so one observer contract covers every diagnostic.
        expect((error as Error).message).toBe(
            "The onPace hook threw and was ignored: hook exploded"
        );
        expect((error as Error).cause).toBe(thrown);
    });

    test("swallows an exception from onHookError itself", () => {
        const onHookError = () => {
            throw new Error("observer exploded");
        };
        const hook = () => {
            throw new Error("hook exploded");
        };
        expect(() => safeInvoke(hook as never, "onPace", onHookError, "warn")).not.toThrow();
    });

    test("warns a structured record on the console when no onHookError is set", () => {
        const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
        const hook = () => {
            throw new Error("telemetry exploded");
        };
        safeInvoke(hook as never, "onRequestStart", undefined, "warn");
        expect(warn).toHaveBeenCalledTimes(1);
        const record = JSON.parse(warn.mock.calls[0][0] as string);
        expect(record).toEqual({
            source: "anilink",
            kind: "hook-failure",
            hookName: "onRequestStart",
            message: "The onRequestStart hook threw and was ignored: telemetry exploded",
        });
    });

    test("includes the requestId in the structured record when the first argument carries one", () => {
        const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
        const hook = () => {
            throw new Error("boom");
        };
        safeInvoke(hook as never, "onResponse", undefined, "warn", { requestId: "req-42" });
        expect(warn).toHaveBeenCalledTimes(1);
        const record = JSON.parse(warn.mock.calls[0][0] as string);
        expect(record).toEqual({
            source: "anilink",
            kind: "hook-failure",
            hookName: "onResponse",
            requestId: "req-42",
            message: "The onResponse hook threw and was ignored: boom",
        });
    });

    test("omits the requestId correlation when the first argument has none", () => {
        const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
        const hook = () => {
            throw new Error("boom");
        };
        safeInvoke(hook as never, "onResponse", undefined, "warn", { requestId: 42 });
        expect(warn).toHaveBeenCalledTimes(1);
        const record = JSON.parse(warn.mock.calls[0][0] as string);
        expect(record.requestId).toBeUndefined();
        expect(record.hookName).toBe("onResponse");
    });

    test("stringifies a non-Error thrown value in the structured record", () => {
        const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
        const hook = () => {
            throw "plain string";
        };
        safeInvoke(hook as never, "onError", undefined, "warn");
        expect(warn).toHaveBeenCalledTimes(1);
        const record = JSON.parse(warn.mock.calls[0][0] as string);
        expect(record.message).toBe("The onError hook threw and was ignored: plain string");
    });

    test("stays silent in diagnostics mode silent with no observer", () => {
        const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
        const hook = () => {
            throw new Error("boom");
        };
        safeInvoke(hook as never, "onError", undefined, "silent");
        expect(warn).not.toHaveBeenCalled();
    });

    test("never touches the console in diagnostics mode hook with no observer", () => {
        const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
        const hook = () => {
            throw new Error("boom");
        };
        safeInvoke(hook as never, "onError", undefined, "hook");
        expect(warn).not.toHaveBeenCalled();
    });

    test("still routes to onHookError in diagnostics mode hook", () => {
        const onHookError = vi.fn();
        const thrown = new Error("hook exploded");
        const hook = () => {
            throw thrown;
        };
        safeInvoke(hook as never, "onPace", onHookError, "hook");
        expect(onHookError).toHaveBeenCalledTimes(1);
        const [name, error] = onHookError.mock.calls[0];
        expect(name).toBe("onPace");
        expect((error as Error).cause).toBe(thrown);
    });
});

describe("reportDiagnostic", () => {
    test("passes a structured record as the error cause to the observer", () => {
        const onHookError = vi.fn();
        reportDiagnostic({
            kind: "state-owner",
            hookName: "stateOwner",
            message: "state keyed by per-request options",
            requestId: "req-1",
            onHookError,
            diagnostics: "warn",
        });
        expect(onHookError).toHaveBeenCalledTimes(1);
        const [name, error] = onHookError.mock.calls[0];
        expect(name).toBe("stateOwner");
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).cause).toEqual({
            source: "anilink",
            kind: "state-owner",
            hookName: "stateOwner",
            requestId: "req-1",
            message: "state keyed by per-request options",
        });
    });

    test("prefers the raw error as the cause when one is provided", () => {
        const onHookError = vi.fn();
        const thrown = new Error("hook exploded");
        reportDiagnostic({
            kind: "hook-failure",
            hookName: "onPace",
            message: "The onPace hook threw and was ignored: hook exploded",
            onHookError,
            diagnostics: "warn",
            rawError: thrown,
        });
        expect(onHookError).toHaveBeenCalledTimes(1);
        const [name, error] = onHookError.mock.calls[0];
        expect(name).toBe("onPace");
        expect((error as Error).cause).toBe(thrown);
    });

    test("emits the serialized record to console.warn in mode warn with no observer", () => {
        const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
        reportDiagnostic({
            kind: "hook-failure",
            hookName: "onPace",
            message: "hook threw",
            diagnostics: "warn",
        });
        expect(warn).toHaveBeenCalledTimes(1);
        const record = JSON.parse(warn.mock.calls[0][0] as string);
        expect(record).toEqual({
            source: "anilink",
            kind: "hook-failure",
            hookName: "onPace",
            message: "hook threw",
        });
    });

    test("emits nothing in mode silent", () => {
        const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
        const onHookError = vi.fn();
        reportDiagnostic({
            kind: "hook-failure",
            hookName: "onPace",
            message: "hook threw",
            onHookError,
            diagnostics: "silent",
        });
        expect(warn).not.toHaveBeenCalled();
        expect(onHookError).not.toHaveBeenCalled();
    });

    test("emits nothing to the console in mode hook with no observer", () => {
        const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
        reportDiagnostic({
            kind: "hook-failure",
            hookName: "onPace",
            message: "hook threw",
            diagnostics: "hook",
        });
        expect(warn).not.toHaveBeenCalled();
    });

    test("swallows a throwing observer", () => {
        const onHookError = () => {
            throw new Error("observer exploded");
        };
        expect(() =>
            reportDiagnostic({
                kind: "state-owner",
                hookName: "stateOwner",
                message: "msg",
                onHookError,
                diagnostics: "warn",
            })
        ).not.toThrow();
    });

    test("reports whether an emission actually happened", () => {
        // The boolean return is the one-shot contract: warnOptionsKeyedState
        // keys on it instead of re-deriving the routing, so the gate can
        // never drift from the emit logic.
        const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
        const onHookError = vi.fn();

        // Observer invoked: emitted.
        expect(
            reportDiagnostic({
                kind: "state-owner",
                hookName: "stateOwner",
                message: "msg",
                onHookError,
                diagnostics: "warn",
            })
        ).toBe(true);

        // Console fallback: emitted.
        expect(
            reportDiagnostic({
                kind: "state-owner",
                hookName: "stateOwner",
                message: "msg",
                diagnostics: "warn",
            })
        ).toBe(true);

        // Silent mode with an observer: the state-owner record is
        // unsolicited, so the observer is gated — nothing emitted.
        expect(
            reportDiagnostic({
                kind: "state-owner",
                hookName: "stateOwner",
                message: "msg",
                onHookError,
                diagnostics: "silent",
            })
        ).toBe(false);

        // Hook mode with no observer: nothing to route to.
        expect(
            reportDiagnostic({
                kind: "state-owner",
                hookName: "stateOwner",
                message: "msg",
                diagnostics: "hook",
            })
        ).toBe(false);

        // A rethrown failure skips the console fallback: the caller
        // receives it once, as the rejection.
        expect(
            reportDiagnostic({
                kind: "token-refresh",
                hookName: "malTokenRefresh",
                message: "msg",
                diagnostics: "warn",
                rethrown: true,
            })
        ).toBe(false);

        // Only the second call reached the console: the first went to the
        // observer, and the rethrown one skips the fallback by design.
        expect(warn).toHaveBeenCalledTimes(1);
        warn.mockRestore();
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
        const withDelay = buildErrorContext("req-1", "https://api.test", method, 1, normalized, {
            nextDelayMs: 750,
        });
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
            { nextDelayMs: 500 }
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
            { nextDelayMs: 500 }
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
