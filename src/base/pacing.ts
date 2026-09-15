/**
 * Proactive rate-limit pacing.
 *
 * Owns the module-level `paceDeadlines` `WeakMap` keyed by a stable per-client
 * owner and then by upstream host, the deadline recorder, the pre-dispatch
 * deadline awaiter, and the post-success deadline recording. When a
 * successful response reports the remaining quota below the configured
 * floor, the reset deadline is recorded — the response itself returns
 * immediately — so every subsequently dispatched request to the same host
 * waits for it *before* it is sent.
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
 * stable per-client owner (the shared object threaded through the provider
 * wiring, so deadlines gate every operation of one client) and then by
 * upstream host. When a successful response reports the remaining quota
 * below {@link ResolvedRequestOptions.rateLimitFloor}, the reset deadline is
 * recorded here so every subsequently dispatched request to the same host
 * waits for the window to reset *before* it is sent. This is the only
 * pacing mechanism: it gates concurrent/sequential requests that do not
 * share one {@link executeWithRetry} call too, not just the response that
 * observed the low quota.
 */
const paceDeadlines = new WeakMap<object, Map<string, number>>();

/**
 * Maximum pacing wait in milliseconds. Hostile or malformed `reset` values
 * cannot create unbounded waits.
 */
const MAX_PACE_WAIT_MS = 5 * 60 * 1000;

/**
 * Sleeps for the given delay, classifying an abort during the wait as a
 * pacing abort (`abortedDuringPacing`) so a cancelled rate-limit wait stays
 * distinguishable from a cancelled in-flight request.
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
 * request. Emits `onPace` once for the wait — the only `onPace` emission
 * point, so the wait is reported exactly where it happens — so an
 * intentional rate-limit wait stays distinguishable from a hung request in
 * hook-based metrics. An abort during the wait surfaces as a pacing abort
 * (`abortedDuringPacing`) so it stays distinguishable from a cancelled
 * in-flight request.
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
    await sleepForPacing(delayMs, resolved, hookContext);
    // Emitted after the wait completes so an observer never receives a
    // full-delay event for a wait that was aborted partway through —
    // pacing-time metrics would otherwise over-count aborted waits.
    safeInvoke(resolved.onPace, "onPace", resolved.onHookError, { ...hookContext, delayMs });
};

/**
 * Records the rate-limit reset deadline after a successful response when
 * the reported remaining quota drops below the configured floor. The
 * successful response itself returns immediately — its data is never held
 * for the window reset — and the recorded deadline paces the next request
 * to the same host via {@link awaitPaceDeadline}.
 *
 * @param response - The successful response carrying the rate-limit headers.
 * @param resolved - The resolved request options.
 * @param rateLimit - The rate-limit info already parsed from the response headers, when present.
 * @param owner - The caller's stable transport-settings object, when known, used to key the shared deadline.
 * @param host - The upstream host the deadline is recorded for.
 */
export const paceAfterSuccess = (
    response: AxiosResponse,
    resolved: ResolvedRequestOptions,
    rateLimit: RateLimitInfo | undefined,
    owner?: object,
    host?: string
): void => {
    if (!resolved.paceWithRateLimit) {
        return;
    }
    const info = rateLimit ?? getRateLimitInfo(response.headers as Record<string, unknown>);
    if (info !== undefined && info.remaining < resolved.rateLimitFloor) {
        const rawDeadlineMs = info.reset * 1000;
        const deadlineMs = Math.min(rawDeadlineMs, Date.now() + MAX_PACE_WAIT_MS);
        if (owner !== undefined && host !== undefined) {
            recordPaceDeadline(owner, host, deadlineMs);
        }
    }
};
