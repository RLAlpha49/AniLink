/**
 * Proactive rate-limit pacing.
 *
 * Owns the module-level `paceDeadlines` `WeakMap` keyed by a stable per-client
 * owner and then by upstream host, the deadline recorder, the pre-dispatch
 * deadline awaiter, the post-success pacing wait, and the pacing-abort
 * detection helpers. When a successful response reports the remaining quota
 * below the configured floor, the reset deadline is recorded so independently
 * dispatched requests to the same host wait for it *before* they are sent
 * rather than only pacing the response that observed the low quota.
 */
import axios, { type AxiosResponse } from "axios";
import { AniLinkErrorCodes, AniLinkNetworkError, type RateLimitInfo } from "./AniLinkError";
import type { RequestContext } from "./transportTypes";
import type { ResolvedRequestOptions } from "./requestOptions";
import { safeInvoke } from "./hooks";
import { getRateLimitInfo, stampRequestId } from "./errors";
import { sleep } from "./sleep";

/**
 * Shared rate-limit pacing deadlines, keyed like {@link circuitStates} by a
 * stable per-client owner and then by upstream host. When a successful
 * response reports the remaining quota below {@link ResolvedRequestOptions.rateLimitFloor},
 * the reset deadline is recorded here so independently dispatched requests
 * to the same host wait for the window to reset *before* they are sent
 * rather than only pacing the response that observed the low quota. This
 * gates concurrent/sequential requests that do not share one
 * {@link executeWithRetry} call, which the post-response pacing wait alone
 * cannot reach.
 */
const paceDeadlines = new WeakMap<object, Map<string, number>>();

/**
 * Maximum pacing wait in milliseconds. Hostile or malformed `reset` values
 * cannot create unbounded waits.
 */
const MAX_PACE_WAIT_MS = 5 * 60 * 1000;

/**
 * Sleeps for the given delay, classifying an abort during the wait as a
 * pacing abort so it neither counts as an attempt failure nor re-fires
 * `onResponse`.
 *
 * @param delayMs - The duration to sleep in milliseconds.
 * @param resolved - The resolved request options carrying the abort signal.
 * @param hookContext - The attempt's request context, used for request-ID stamping.
 */
const sleepForPacing = async (
    delayMs: number,
    resolved: ResolvedRequestOptions,
    hookContext: RequestContext
): Promise<void> => {
    try {
        await sleep(delayMs, resolved.signal, hookContext.requestId);
    } catch (error: unknown) {
        if (
            error instanceof AniLinkNetworkError &&
            error.code === AniLinkErrorCodes.ABORTED &&
            !axios.isCancel(error)
        ) {
            const pacingError = new AniLinkNetworkError(
                AniLinkErrorCodes.ABORTED,
                "The request was cancelled while waiting for the rate-limit window to reset.",
                undefined,
                { abortedDuringPacing: true }
            );
            stampRequestId(pacingError, hookContext.requestId);
            throw pacingError;
        }
        throw error;
    }
};

/**
 * Records the rate-limit reset deadline for the caller's owner and host so
 * the next dispatch through {@link awaitPaceDeadline} waits for it. A
 * deadline further in the future replaces an earlier one; a deadline at or
 * before now is cleared so a healthy window does not stall subsequent
 * requests.
 *
 * @param owner - The caller's stable transport-settings object.
 * @param host - The upstream host the deadline applies to.
 * @param deadlineMs - The epoch millisecond at which the window resets.
 */
export const recordPaceDeadline = (owner: object, host: string, deadlineMs: number): void => {
    let scopes = paceDeadlines.get(owner);
    if (scopes === undefined) {
        scopes = new Map();
        paceDeadlines.set(owner, scopes);
    }
    if (deadlineMs <= Date.now()) {
        scopes.delete(host);
        return;
    }
    const existing = scopes.get(host);
    if (existing !== undefined && deadlineMs <= existing) {
        return;
    }
    scopes.set(host, deadlineMs);
};

/**
 * Awaits the recorded rate-limit reset deadline for the caller's owner and
 * host, when one is still in the future, before the caller dispatches its
 * request. Emits `onPace` once for the wait so an intentional rate-limit wait
 * stays distinguishable from a hung request in hook-based metrics. An abort
 * during the wait surfaces as a pacing abort (matching the post-success
 * pacing behavior) so it neither counts as an attempt failure nor re-fires
 * `onResponse`.
 *
 * @param owner - The caller's stable transport-settings object, when known.
 * @param host - The upstream host the request is dispatched to.
 * @param resolved - The resolved request options carrying the pacing flag and hooks.
 * @param hookContext - The attempt's request context, reused for the `onPace` emission.
 */
export const awaitPaceDeadline = async (
    owner: object | undefined,
    host: string,
    resolved: ResolvedRequestOptions,
    hookContext: RequestContext
): Promise<void> => {
    if (owner === undefined || !resolved.paceWithRateLimit || resolved.ignorePaceDeadline) {
        return;
    }
    const deadlineMs = paceDeadlines.get(owner)?.get(host);
    if (deadlineMs === undefined) {
        return;
    }
    const delayMs = deadlineMs - Date.now();
    if (delayMs <= 0) {
        // The window already reset; clear the stale deadline and dispatch.
        paceDeadlines.get(owner)?.delete(host);
        return;
    }
    safeInvoke(resolved.onPace, "onPace", resolved.onHookError, { ...hookContext, delayMs });
    await sleepForPacing(delayMs, resolved, hookContext);
};

/**
 * Applies opt-in rate-limit pacing after a successful response: when the
 * reported remaining quota drops below the configured floor, records the
 * reset deadline (so independently dispatched requests to the same host wait
 * for it before they are sent via {@link awaitPaceDeadline}), emits the
 * `onPace` signal, waits until the window resets before the caller proceeds,
 * and classifies an abort during that wait as a post-success pacing abort.
 *
 * @param response - The successful response carrying the rate-limit headers.
 * @param resolved - The resolved request options.
 * @param hookContext - The attempt's request context, reused for the `onPace` emission.
 * @param rateLimit - The rate-limit info already parsed from the response headers, when present.
 * @param owner - The caller's stable transport-settings object, when known, used to key the shared deadline.
 * @param host - The upstream host the deadline is recorded for.
 */
export const paceAfterSuccess = async (
    response: AxiosResponse,
    resolved: ResolvedRequestOptions,
    hookContext: RequestContext,
    rateLimit: RateLimitInfo | undefined,
    owner?: object,
    host?: string
): Promise<void> => {
    if (!resolved.paceWithRateLimit) {
        return;
    }
    const info = rateLimit ?? getRateLimitInfo(response.headers as Record<string, unknown>);
    if (info !== undefined && info.remaining < resolved.rateLimitFloor) {
        const rawDeadlineMs = info.reset * 1000;
        const now = Date.now();
        const deadlineMs = Math.min(rawDeadlineMs, now + MAX_PACE_WAIT_MS);
        const delayMs = Math.max(0, deadlineMs - now);
        if (owner !== undefined && host !== undefined) {
            recordPaceDeadline(owner, host, deadlineMs);
        }
        safeInvoke(resolved.onPace, "onPace", resolved.onHookError, { ...hookContext, delayMs });
        await sleepForPacing(delayMs, resolved, hookContext);
    }
};

/**
 * Detects an abort raised by the post-success pacing wait rather than by the
 * request attempt itself. Such an abort happens outside the retry loop's
 * failure accounting: the attempt already succeeded, so rethrowing it keeps
 * `onResponse` from firing twice for one attempt and keeps the circuit-breaker
 * streak free of phantom failures.
 *
 * @param resolved - The resolved request options carrying the pacing flag.
 * @param error - The value caught after a successful attempt.
 * @returns Whether the error is a pacing-wait cancellation.
 */
export const isPacingAbort = (resolved: ResolvedRequestOptions, error: unknown): boolean =>
    resolved.paceWithRateLimit &&
    error instanceof AniLinkNetworkError &&
    error.code === AniLinkErrorCodes.ABORTED &&
    !axios.isCancel(error);

/**
 * Rethrows a pacing-wait cancellation so it escapes the retry loop's failure
 * accounting. Kept as a throwing helper so the retry loop itself stays free
 * of extra branching.
 *
 * @param resolved - The resolved request options carrying the pacing flag.
 * @param error - The value caught after a successful attempt.
 */
export const rethrowIfPacingAbort = (resolved: ResolvedRequestOptions, error: unknown): void => {
    if (isPacingAbort(resolved, error)) {
        throw error;
    }
};
