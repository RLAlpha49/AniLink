/**
 * Proactive rate-limit pacing.
 *
 * Owns the module-level `paceDeadlines` `WeakMap` keyed by a stable per-client
 * owner and then by upstream host, the deadline recorder, the pre-dispatch
 * deadline awaiter, and the post-success deadline recording. When a
 * successful response reports the remaining quota below the configured
 * floor, the reset deadline is recorded — the response itself returns
 * immediately — so every subsequently dispatched request to the same host
 * waits for it *before* it is sent. The per-owner host map is LRU-bounded so
 * a caller dispatching to many distinct hosts cannot grow it without bound,
 * each wait wakes with a small random stagger so requests queued on one
 * window reset do not fire as a synchronized burst, and a wait aborted
 * partway through still emits its partial `onPace` signal with
 * `aborted: true`.
 */
import { randomInt } from "node:crypto";
import axios, { type AxiosResponse } from "axios";
import {
    AniLinkApiError,
    AniLinkError,
    AniLinkErrorCodes,
    AniLinkNetworkError,
    type RateLimitInfo,
} from "./AniLinkError";
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
 * waits for the window to reset *before* it is sent. A terminal 429 records
 * the same deadline from the error's own rate-limit metadata (see
 * {@link paceAfterTerminalRateLimit}), so the window a failed request proved
 * exhausted gates the next request too. This is the only
 * pacing mechanism: it gates concurrent/sequential requests that do not
 * share one {@link executeWithRetry} call too, not just the response that
 * observed the low quota. The per-owner host map is LRU-bounded by
 * `MAX_PACE_SCOPES_PER_OWNER` — mirroring the `circuitStates` cap, which
 * faces the identical dynamic-host exposure — so a caller dispatching to
 * many distinct hosts cannot grow it without bound.
 */
const paceDeadlines = new WeakMap<object, Map<string, number>>();

/**
 * Maximum pacing wait in milliseconds. Hostile or malformed `reset` values
 * cannot create unbounded waits.
 */
const MAX_PACE_WAIT_MS = 5 * 60 * 1000;

/**
 * Upper bound on distinct host scopes tracked per owner. Public transport
 * callers that send to many hosts through one client accumulate a pacing
 * deadline per host; this cap evicts the least-recently-used scope so
 * memory stays bounded. The shipped two-provider host set is tiny, so this
 * only matters for `sendRequest`/`custom()` consumers with dynamic URLs.
 * Mirrors `MAX_CIRCUIT_SCOPES_PER_OWNER` in the circuit-breaker module.
 */
const MAX_PACE_SCOPES_PER_OWNER = 64;

/**
 * Upper bound on the random stagger added to a pacing wait, so requests
 * queued on one window reset wake spread across a short interval after it
 * instead of firing a synchronized burst at the identical millisecond. The
 * stagger scales with the wait (a tenth of it, capped here), so short waits
 * stay precise while long window resets get the full spread.
 */
const MAX_PACE_JITTER_MS = 500;

/**
 * Sleeps for the given delay, classifying an abort during the wait as a
 * pacing abort (`abortedDuringPacing`) so a cancelled rate-limit wait stays
 * distinguishable from a cancelled in-flight request.
 *
 * @param delayMs - The duration to sleep in milliseconds (the deadline wait plus the random stagger).
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
 * requests, unless a later active deadline is already recorded for the
 * host — a stale report never clears a still-pending deadline. Recording
 * an existing host refreshes its recency in the
 * per-owner map, and once an owner tracks more hosts than the LRU cap
 * allows, the least-recently-used host's deadline is evicted so
 * dynamic-host callers cannot grow the map without bound.
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
    const now = Date.now();
    const existing = scopes.get(host);
    if (deadlineMs <= now) {
        // A stale incoming deadline clears the host only when no active
        // deadline is recorded or the recorded one is stale too — a later
        // active deadline survives a stale report, so one already-reset
        // window cannot un-record a still-pending one.
        if (existing === undefined || existing <= now) {
            scopes.delete(host);
        }
        return;
    }
    if (existing !== undefined) {
        // Refresh recency: delete + re-insert moves the host to the end,
        // whether the recorded deadline is kept or replaced by a later one.
        scopes.delete(host);
        scopes.set(host, Math.max(existing, deadlineMs));
        return;
    }
    // Cap the per-owner host map so dynamic-host callers cannot grow it
    // without bound. Map preserves insertion order, so the first key is the
    // least recently used after the delete+re-insert refreshes above.
    if (scopes.size >= MAX_PACE_SCOPES_PER_OWNER) {
        const oldestHost = scopes.keys().next().value;
        if (oldestHost !== undefined) {
            scopes.delete(oldestHost);
        }
    }
    scopes.set(host, deadlineMs);
};

/**
 * Awaits the recorded rate-limit reset deadline for the caller's owner and
 * host, when one is still in the future, before the caller dispatches its
 * request. The sleep carries a small random stagger on top of the deadline
 * wait so requests queued on one window reset wake spread across a short
 * interval instead of firing at the identical millisecond; the `onPace`
 * payload reports the true deadline wait, not the staggered sleep, so
 * pacing metrics stay comparable. Emits `onPace` once for the wait — the only
 * `onPace` emission point, so the wait is reported exactly where it happens
 * — so an intentional rate-limit wait stays distinguishable from a hung
 * request in hook-based metrics. A wait aborted partway through emits
 * `onPace` with the elapsed portion of the deadline wait (clamped, so an
 * abort landing inside the stagger window never reports more than the
 * deadline wait itself) and `aborted: true` before surfacing as a pacing
 * abort (`abortedDuringPacing`), so a cancelled wait stays distinguishable
 * both from a cancelled in-flight request and from no pacing at all.
 *
 * Returns the deadline wait actually observed — the elapsed portion of the
 * deadline wait, stagger excluded — so the caller's cumulative pacing
 * metrics (`pacedMs`) report the same stagger-excluded measure `onPace`
 * does; `0` when no wait was needed.
 *
 * @param owner - The caller's stable transport-settings object, when known.
 * @param host - The upstream host the request is dispatched to.
 * @param resolved - The resolved request options carrying the pacing flag and hooks.
 * @param hookContext - The attempt's request context, reused for the `onPace` emission.
 * @returns The observed deadline wait in milliseconds, stagger excluded;
 * `0` when the dispatch was not paced.
 */
export const awaitPaceDeadline = async (
    owner: object | undefined,
    host: string,
    resolved: ResolvedRequestOptions,
    hookContext: RequestContext
): Promise<number> => {
    if (owner === undefined || !resolved.paceWithRateLimit || resolved.ignorePaceDeadline) {
        return 0;
    }
    const scopes = paceDeadlines.get(owner);
    if (scopes === undefined) {
        return 0;
    }
    const deadlineMs = scopes.get(host);
    if (deadlineMs === undefined) {
        return 0;
    }
    const delayMs = deadlineMs - Date.now();
    if (delayMs <= 0) {
        // The window already reset; clear the stale deadline and dispatch.
        scopes.delete(host);
        return 0;
    }
    // Refresh recency: delete + re-insert moves the host to the end of the
    // map's insertion order, so a host whose deadline is actively awaited
    // is never the least-recently-used entry when the cap evicts.
    scopes.delete(host);
    scopes.set(host, deadlineMs);
    // A bounded random stagger on top of the deadline wait spreads requests
    // queued on one window reset instead of synchronizing them.
    const jitterMs = randomInt(Math.min(MAX_PACE_JITTER_MS, Math.floor(delayMs / 10)) + 1);
    const waitStartedAt = Date.now();
    try {
        await sleepForPacing(delayMs + jitterMs, resolved, hookContext);
    } catch (error: unknown) {
        if (
            error instanceof AniLinkNetworkError &&
            error.code === AniLinkErrorCodes.ABORTED &&
            error.abortedDuringPacing === true
        ) {
            // An aborted wait reports the observed partial wait — clamped
            // to the deadline wait so an abort landing inside the stagger
            // window never reports more than the deadline itself, and never
            // the full deadline — so pacing time is not over-counted, and
            // the `aborted` flag distinguishes a cancelled wait from a
            // completed one without watching `onError`.
            const elapsedMs = Math.min(Date.now() - waitStartedAt, delayMs);
            safeInvoke(resolved.onPace, "onPace", resolved.onHookError, resolved.diagnostics, {
                ...hookContext,
                delayMs: elapsedMs,
                aborted: true,
            });
            throw error;
        }
        throw error;
    }
    safeInvoke(resolved.onPace, "onPace", resolved.onHookError, resolved.diagnostics, {
        ...hookContext,
        delayMs,
    });
    return delayMs;
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

/**
 * Records the rate-limit reset deadline from a terminal 429 — one that
 * exhausted its retry budget, ran with retries disabled, or surfaced for
 * any other reason without another attempt scheduled — so the next request
 * to the same host waits for the window it already proved exhausted instead
 * of dispatching immediately, eating another 429, and repeating until the
 * window resets on its own.
 *
 * The 429's `rateLimit.reset` metadata is already on the normalized error
 * (parsed from the `x-ratelimit-*` headers of both HTTP-level and
 * GraphQL-envelope 429s), so this is the failure-path counterpart of
 * {@link paceAfterSuccess}: the same `MAX_PACE_WAIT_MS` clamp, the same
 * {@link recordPaceDeadline} recorder. A 429 without rate-limit metadata
 * records nothing — there is no reset deadline to wait for.
 *
 * @param normalized - The terminal normalized failure from the request pipeline.
 * @param resolved - The resolved request options carrying the pacing flag.
 * @param owner - The caller's stable transport-settings object, when known, used to key the shared deadline.
 * @param host - The upstream host the deadline is recorded for.
 */
export const paceAfterTerminalRateLimit = (
    normalized: AniLinkError,
    resolved: ResolvedRequestOptions,
    owner: object | undefined,
    host: string
): void => {
    if (!resolved.paceWithRateLimit) {
        return;
    }
    if (!(normalized instanceof AniLinkApiError) || normalized.status !== 429) {
        return;
    }
    const reset = normalized.rateLimit?.reset;
    if (reset === undefined || !Number.isFinite(reset)) {
        return;
    }
    const deadlineMs = Math.min(reset * 1000, Date.now() + MAX_PACE_WAIT_MS);
    if (owner !== undefined) {
        recordPaceDeadline(owner, host, deadlineMs);
    }
};

/**
 * Returns the recorded rate-limit pacing deadlines for one owner without
 * waiting for them or clearing stale entries — the read-only counterpart of
 * {@link awaitPaceDeadline} used by transport-state snapshots. Reading
 * through this helper never mutates the deadline map: a stale
 * (already-elapsed) deadline is reported as-is instead of being cleared,
 * and an owner with no recorded deadlines yields `undefined` without
 * allocating a scope map, so snapshotting can never perturb the pacing
 * behavior it observes.
 *
 * @param owner - The caller's stable transport-settings object.
 * @returns The recorded host-scoped deadlines, when any exist.
 */
export const peekPaceDeadlines = (owner: object): ReadonlyMap<string, number> | undefined =>
    paceDeadlines.get(owner);
