import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import type { AxiosResponse, AxiosStatic } from "axios";
import { AniLinkErrorCodes, AniLinkNetworkError } from "../src/base/AniLinkError";
import type { ResolvedRequestOptions } from "../src/base/requestOptions";
import type { RequestContext } from "../src/base/transportTypes";

/**
 * Direct tests for the rate-limit pacing helpers in `src/base/pacing.ts`.
 *
 * The request-handler suite exercises pacing only through full request
 * pipelines, which left the deadline bookkeeping, the `onPace` payload, and
 * the pacing-abort classification untested at the unit level.
 *
 * The global setup replaces `axios` with a network-blocking stub without
 * `isCancel`, so this suite installs an axios double with a working
 * `isCancel` before importing the module under test.
 */

const { axiosStub } = vi.hoisted(() => {
    const isCancel = (error: unknown): boolean =>
        Boolean((error as { isCanceled?: boolean } | null)?.isCanceled);
    const stub = Object.assign(vi.fn(), {
        create: vi.fn(),
        isAxiosError: (error: unknown) =>
            Boolean((error as { isAxiosError?: boolean } | null)?.isAxiosError),
        isCancel,
    });
    return { axiosStub: stub as unknown as AxiosStatic & { isCancel: (e: unknown) => boolean } };
});

vi.mock("axios", () => ({ __esModule: true, default: axiosStub }));

import {
    awaitPaceDeadline,
    isPacingAbort,
    paceAfterSuccess,
    recordPaceDeadline,
    rethrowIfPacingAbort,
} from "../src/base/pacing";

const hookContext: RequestContext = {
    requestId: "req-pace-1",
    url: "https://graphql.anilist.co",
    method: "POST",
    attempt: 1,
};

const resolvedBase = {
    timeout: 1000,
    exposeRawAxiosError: false,
    retry: null,
    paceWithRateLimit: true,
    rateLimitFloor: 90,
    httpAgent: {} as never,
    httpsAgent: {} as never,
    ignorePaceDeadline: false,
} satisfies Partial<ResolvedRequestOptions> as ResolvedRequestOptions;

const response = (headers: Record<string, string>) => ({ headers }) as unknown as AxiosResponse;

beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
});

afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
});

describe("recordPaceDeadline", () => {
    test("stores a future deadline for the owner and host", async () => {
        const owner = {};
        recordPaceDeadline(owner, "graphql.anilist.co", Date.now() + 5000);
        const onPace = vi.fn();
        const wait = awaitPaceDeadline(
            owner,
            "graphql.anilist.co",
            { ...resolvedBase, onPace },
            hookContext
        );
        // The wait is still pending; onPace already fired with the delay.
        expect(onPace).toHaveBeenCalledTimes(1);
        expect(onPace.mock.calls[0][0].delayMs).toBe(5000);
        expect(onPace.mock.calls[0][0].requestId).toBe("req-pace-1");
        vi.advanceTimersByTime(5000);
        await expect(wait).resolves.toBeUndefined();
    });

    test("clears the deadline when the reset time is now or in the past", async () => {
        const owner = {};
        recordPaceDeadline(owner, "graphql.anilist.co", Date.now() - 1000);
        const onPace = vi.fn();
        await awaitPaceDeadline(
            owner,
            "graphql.anilist.co",
            { ...resolvedBase, onPace },
            hookContext
        );
        expect(onPace).not.toHaveBeenCalled();
    });

    test("keeps the later of two deadlines for the same owner and host", async () => {
        const owner = {};
        recordPaceDeadline(owner, "graphql.anilist.co", Date.now() + 1000);
        recordPaceDeadline(owner, "graphql.anilist.co", Date.now() + 8000);
        const onPace = vi.fn();
        const wait = awaitPaceDeadline(
            owner,
            "graphql.anilist.co",
            { ...resolvedBase, onPace },
            hookContext
        );
        expect(onPace.mock.calls[0][0].delayMs).toBe(8000);
        vi.advanceTimersByTime(8000);
        await expect(wait).resolves.toBeUndefined();
    });

    test("does not replace a later deadline with an earlier one", async () => {
        const owner = {};
        recordPaceDeadline(owner, "graphql.anilist.co", Date.now() + 9000);
        recordPaceDeadline(owner, "graphql.anilist.co", Date.now() + 1000);
        const onPace = vi.fn();
        const wait = awaitPaceDeadline(
            owner,
            "graphql.anilist.co",
            { ...resolvedBase, onPace },
            hookContext
        );
        expect(onPace.mock.calls[0][0].delayMs).toBe(9000);
        vi.advanceTimersByTime(9000);
        await expect(wait).resolves.toBeUndefined();
    });

    test("scopes deadlines per host under one owner", async () => {
        const owner = {};
        recordPaceDeadline(owner, "graphql.anilist.co", Date.now() + 5000);
        const onPace = vi.fn();
        await awaitPaceDeadline(
            owner,
            "api.myanimelist.net",
            { ...resolvedBase, onPace },
            hookContext
        );
        expect(onPace).not.toHaveBeenCalled();
    });
});

describe("awaitPaceDeadline", () => {
    test("does nothing when no owner is provided", async () => {
        const onPace = vi.fn();
        await awaitPaceDeadline(
            undefined,
            "graphql.anilist.co",
            { ...resolvedBase, onPace },
            hookContext
        );
        expect(onPace).not.toHaveBeenCalled();
    });

    test("does nothing when pacing is disabled", async () => {
        const owner = {};
        recordPaceDeadline(owner, "graphql.anilist.co", Date.now() + 5000);
        const onPace = vi.fn();
        await awaitPaceDeadline(
            owner,
            "graphql.anilist.co",
            { ...resolvedBase, onPace, paceWithRateLimit: false },
            hookContext
        );
        expect(onPace).not.toHaveBeenCalled();
    });

    test("does nothing when ignorePaceDeadline is set", async () => {
        const owner = {};
        recordPaceDeadline(owner, "graphql.anilist.co", Date.now() + 5000);
        const onPace = vi.fn();
        await awaitPaceDeadline(
            owner,
            "graphql.anilist.co",
            { ...resolvedBase, onPace, ignorePaceDeadline: true },
            hookContext
        );
        expect(onPace).not.toHaveBeenCalled();
    });

    test("clears a stale deadline that has already passed and dispatches immediately", async () => {
        const owner = {};
        recordPaceDeadline(owner, "graphql.anilist.co", Date.now() + 1000);
        vi.advanceTimersByTime(1500);
        const onPace = vi.fn();
        await awaitPaceDeadline(
            owner,
            "graphql.anilist.co",
            { ...resolvedBase, onPace },
            hookContext
        );
        expect(onPace).not.toHaveBeenCalled();
        // A second await must also not pace: the stale entry was removed.
        await awaitPaceDeadline(
            owner,
            "graphql.anilist.co",
            { ...resolvedBase, onPace },
            hookContext
        );
        expect(onPace).not.toHaveBeenCalled();
    });

    test("classifies an abort during the wait as a pacing abort", async () => {
        const owner = {};
        recordPaceDeadline(owner, "graphql.anilist.co", Date.now() + 5000);
        const controller = new AbortController();
        const wait = awaitPaceDeadline(
            owner,
            "graphql.anilist.co",
            { ...resolvedBase, signal: controller.signal },
            hookContext
        );
        controller.abort();
        await expect(wait).rejects.toMatchObject({
            code: AniLinkErrorCodes.ABORTED,
        });
    });
});

describe("paceAfterSuccess", () => {
    test("paces when the remaining quota is below the floor", async () => {
        const onPace = vi.fn();
        const reset = Math.ceil((Date.now() + 3000) / 1000);
        const wait = paceAfterSuccess(
            response({
                "x-ratelimit-limit": "90",
                "x-ratelimit-remaining": "5",
                "x-ratelimit-reset": String(reset),
            }),
            { ...resolvedBase, onPace },
            hookContext,
            undefined
        );
        expect(onPace).toHaveBeenCalledTimes(1);
        expect(onPace.mock.calls[0][0].delayMs).toBe(3000);
        vi.advanceTimersByTime(3000);
        await expect(wait).resolves.toBeUndefined();
    });

    test("does not pace when the remaining quota is at or above the floor", async () => {
        const onPace = vi.fn();
        await paceAfterSuccess(
            response({
                "x-ratelimit-limit": "90",
                "x-ratelimit-remaining": "90",
                "x-ratelimit-reset": String(Math.ceil((Date.now() + 3000) / 1000)),
            }),
            { ...resolvedBase, onPace },
            hookContext,
            undefined
        );
        expect(onPace).not.toHaveBeenCalled();
    });

    test("does not pace when pacing is disabled", async () => {
        const onPace = vi.fn();
        await paceAfterSuccess(
            response({
                "x-ratelimit-limit": "90",
                "x-ratelimit-remaining": "5",
                "x-ratelimit-reset": String(Math.ceil((Date.now() + 3000) / 1000)),
            }),
            { ...resolvedBase, onPace, paceWithRateLimit: false },
            hookContext,
            undefined
        );
        expect(onPace).not.toHaveBeenCalled();
    });

    test("does not pace when the rate-limit headers are incomplete", async () => {
        const onPace = vi.fn();
        await paceAfterSuccess(
            response({ "x-ratelimit-remaining": "5" }),
            { ...resolvedBase, onPace },
            hookContext,
            undefined
        );
        expect(onPace).not.toHaveBeenCalled();
    });

    test("prefers the provided rateLimit info over the response headers", async () => {
        const onPace = vi.fn();
        const reset = Math.ceil((Date.now() + 3000) / 1000);
        const wait = paceAfterSuccess(
            response({
                "x-ratelimit-limit": "90",
                "x-ratelimit-remaining": "90",
                "x-ratelimit-reset": String(reset),
            }),
            { ...resolvedBase, onPace },
            hookContext,
            { limit: 90, remaining: 5, reset }
        );
        expect(onPace).toHaveBeenCalledTimes(1);
        vi.advanceTimersByTime(3000);
        await expect(wait).resolves.toBeUndefined();
    });

    test("records the deadline for the owner and host when both are given", async () => {
        const owner = {};
        const reset = Math.ceil((Date.now() + 3000) / 1000);
        const wait = paceAfterSuccess(
            response({
                "x-ratelimit-limit": "90",
                "x-ratelimit-remaining": "5",
                "x-ratelimit-reset": String(reset),
            }),
            resolvedBase,
            hookContext,
            undefined,
            owner,
            "graphql.anilist.co"
        );
        // While the post-success wait is still pending, the deadline is already
        // recorded: a concurrently dispatched request to the same host must see it.
        const onPace = vi.fn();
        const second = awaitPaceDeadline(
            owner,
            "graphql.anilist.co",
            { ...resolvedBase, onPace },
            hookContext
        );
        expect(onPace).toHaveBeenCalledTimes(1);
        expect(onPace.mock.calls[0][0].delayMs).toBeGreaterThan(0);
        vi.advanceTimersByTime(3000);
        await expect(wait).resolves.toBeUndefined();
        await expect(second).resolves.toBeUndefined();
    });

    test("caps the wait at the maximum pacing window", async () => {
        const onPace = vi.fn();
        const farFutureReset = Math.ceil((Date.now() + 60 * 60 * 1000) / 1000);
        const wait = paceAfterSuccess(
            response({
                "x-ratelimit-limit": "90",
                "x-ratelimit-remaining": "5",
                "x-ratelimit-reset": String(farFutureReset),
            }),
            { ...resolvedBase, onPace },
            hookContext,
            undefined
        );
        const delay = onPace.mock.calls[0][0].delayMs;
        expect(delay).toBeGreaterThan(0);
        expect(delay).toBeLessThan(60 * 60 * 1000);
        vi.advanceTimersByTime(delay);
        await expect(wait).resolves.toBeUndefined();
    });
});

describe("isPacingAbort and rethrowIfPacingAbort", () => {
    const pacingError = () =>
        new AniLinkNetworkError(AniLinkErrorCodes.ABORTED, "cancelled while pacing", undefined, {
            abortedDuringPacing: true,
        });

    test("recognizes a network abort raised while pacing is enabled", () => {
        expect(isPacingAbort(resolvedBase, pacingError())).toBe(true);
    });

    test("rejects an abort when pacing is disabled", () => {
        expect(isPacingAbort({ ...resolvedBase, paceWithRateLimit: false }, pacingError())).toBe(
            false
        );
    });

    test("rejects a non-network error", () => {
        expect(isPacingAbort(resolvedBase, new Error("unrelated"))).toBe(false);
    });

    test("rejects a network error with a different code", () => {
        const timeout = new AniLinkNetworkError(AniLinkErrorCodes.TIMEOUT, "timed out");
        expect(isPacingAbort(resolvedBase, timeout)).toBe(false);
    });

    test("rejects an axios cancellation", () => {
        const cancel = { isCanceled: true, message: "cancelled" };
        expect(isPacingAbort(resolvedBase, cancel)).toBe(false);
    });

    test("rethrowIfPacingAbort rethrows a pacing abort", () => {
        const error = pacingError();
        expect(() => rethrowIfPacingAbort(resolvedBase, error)).toThrow(error);
    });

    test("rethrowIfPacingAbort swallows unrelated errors", () => {
        expect(() => rethrowIfPacingAbort(resolvedBase, new Error("unrelated"))).not.toThrow();
    });
});
