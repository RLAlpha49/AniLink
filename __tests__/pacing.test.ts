import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import type { AxiosResponse, AxiosStatic } from "axios";
import { AniLinkErrorCodes } from "../src/base/AniLinkError";
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

import { awaitPaceDeadline, paceAfterSuccess, recordPaceDeadline } from "../src/base/pacing";

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
    allowPartialData: false,
    diagnostics: "warn",
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
        // The wait is still pending; onPace has not fired yet — it fires
        // after the wait completes so an aborted wait never emits a
        // full-delay event.
        expect(onPace).not.toHaveBeenCalled();
        vi.advanceTimersByTime(5000);
        await expect(wait).resolves.toBeUndefined();
        expect(onPace).toHaveBeenCalledTimes(1);
        expect(onPace.mock.calls[0][0].delayMs).toBe(5000);
        expect(onPace.mock.calls[0][0].requestId).toBe("req-pace-1");
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
        vi.advanceTimersByTime(8000);
        await expect(wait).resolves.toBeUndefined();
        expect(onPace.mock.calls[0][0].delayMs).toBe(8000);
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
        vi.advanceTimersByTime(9000);
        await expect(wait).resolves.toBeUndefined();
        expect(onPace.mock.calls[0][0].delayMs).toBe(9000);
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
            abortedDuringPacing: true,
        });
    });
});

describe("paceAfterSuccess", () => {
    test("records the deadline without waiting: the response returns immediately", async () => {
        const owner = {};
        const reset = Math.ceil((Date.now() + 3000) / 1000);
        // Synchronous call — no await, no timer advance: the successful
        // response is never held for the window reset.
        paceAfterSuccess(
            response({
                "x-ratelimit-limit": "90",
                "x-ratelimit-remaining": "5",
                "x-ratelimit-reset": String(reset),
            }),
            resolvedBase,
            undefined,
            owner,
            "graphql.anilist.co"
        );
        // The deadline is already recorded: a subsequently dispatched request
        // to the same host waits for it, and onPace fires only from that
        // pre-dispatch wait.
        const onPace = vi.fn();
        const wait = awaitPaceDeadline(
            owner,
            "graphql.anilist.co",
            { ...resolvedBase, onPace },
            hookContext
        );
        expect(onPace).not.toHaveBeenCalled();
        vi.advanceTimersByTime(3000);
        await expect(wait).resolves.toBeUndefined();
        expect(onPace).toHaveBeenCalledTimes(1);
        expect(onPace.mock.calls[0][0].delayMs).toBe(3000);
    });

    test("does not record a deadline when the remaining quota is at or above the floor", async () => {
        const owner = {};
        paceAfterSuccess(
            response({
                "x-ratelimit-limit": "90",
                "x-ratelimit-remaining": "90",
                "x-ratelimit-reset": String(Math.ceil((Date.now() + 3000) / 1000)),
            }),
            resolvedBase,
            undefined,
            owner,
            "graphql.anilist.co"
        );
        const onPace = vi.fn();
        await awaitPaceDeadline(
            owner,
            "graphql.anilist.co",
            { ...resolvedBase, onPace },
            hookContext
        );
        expect(onPace).not.toHaveBeenCalled();
    });

    test("does not record a deadline when pacing is disabled", async () => {
        const owner = {};
        paceAfterSuccess(
            response({
                "x-ratelimit-limit": "90",
                "x-ratelimit-remaining": "5",
                "x-ratelimit-reset": String(Math.ceil((Date.now() + 3000) / 1000)),
            }),
            { ...resolvedBase, paceWithRateLimit: false },
            undefined,
            owner,
            "graphql.anilist.co"
        );
        const onPace = vi.fn();
        await awaitPaceDeadline(
            owner,
            "graphql.anilist.co",
            { ...resolvedBase, onPace },
            hookContext
        );
        expect(onPace).not.toHaveBeenCalled();
    });

    test("does not record a deadline when the rate-limit headers are incomplete", async () => {
        const owner = {};
        paceAfterSuccess(
            response({ "x-ratelimit-remaining": "5" }),
            resolvedBase,
            undefined,
            owner,
            "graphql.anilist.co"
        );
        const onPace = vi.fn();
        await awaitPaceDeadline(
            owner,
            "graphql.anilist.co",
            { ...resolvedBase, onPace },
            hookContext
        );
        expect(onPace).not.toHaveBeenCalled();
    });

    test("prefers the provided rateLimit info over the response headers", async () => {
        const owner = {};
        const reset = Math.ceil((Date.now() + 3000) / 1000);
        paceAfterSuccess(
            response({
                "x-ratelimit-limit": "90",
                "x-ratelimit-remaining": "90",
                "x-ratelimit-reset": String(reset),
            }),
            resolvedBase,
            { limit: 90, remaining: 5, reset },
            owner,
            "graphql.anilist.co"
        );
        const onPace = vi.fn();
        const wait = awaitPaceDeadline(
            owner,
            "graphql.anilist.co",
            { ...resolvedBase, onPace },
            hookContext
        );
        expect(onPace).not.toHaveBeenCalled();
        vi.advanceTimersByTime(3000);
        await expect(wait).resolves.toBeUndefined();
        expect(onPace).toHaveBeenCalledTimes(1);
    });

    test("caps the recorded deadline at the maximum pacing window", async () => {
        const owner = {};
        const farFutureReset = Math.ceil((Date.now() + 60 * 60 * 1000) / 1000);
        paceAfterSuccess(
            response({
                "x-ratelimit-limit": "90",
                "x-ratelimit-remaining": "5",
                "x-ratelimit-reset": String(farFutureReset),
            }),
            resolvedBase,
            undefined,
            owner,
            "graphql.anilist.co"
        );
        const onPace = vi.fn();
        const wait = awaitPaceDeadline(
            owner,
            "graphql.anilist.co",
            { ...resolvedBase, onPace },
            hookContext
        );
        expect(onPace).not.toHaveBeenCalled();
        // The cap is 5 minutes; advance past it so the wait settles.
        vi.advanceTimersByTime(5 * 60 * 1000);
        await expect(wait).resolves.toBeUndefined();
        const delay = onPace.mock.calls[0][0].delayMs;
        expect(delay).toBeGreaterThan(0);
        expect(delay).toBeLessThan(60 * 60 * 1000);
    });
});
