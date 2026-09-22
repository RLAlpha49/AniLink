/**
 * The transport's per-request attempt loop.
 *
 * Owns the `executeWithRetry` dispatch loop — the circuit check, the
 * pre-dispatch pacing wait, the network dispatch, the envelope resolution,
 * the cache write-back, the failure recording, the retry-budget accounting,
 * and every lifecycle-hook emission of one logical request — owned here so
 * the loop's invariants (probe bookkeeping,
 * `responseReported`, the cumulative `pacedWaitMs`/`retryWaitMs`
 * accumulators, budget-unit spending) live in one focused, reviewable
 * module. The request pipeline (`requestPipeline.ts`) resolves options,
 * builds auth headers, and decides cache eligibility before it hands the
 * attempt loop a fully resolved request; this module never re-derives policy.
 */
import { randomUUID } from "node:crypto";
import type { AxiosResponse } from "axios";
import { AniLinkAuthError, AniLinkGraphQLError } from "./AniLinkError";
import type { HttpMethod } from "./transportTypes";
import type { ResolvedRequestOptions } from "./requestOptions";
import { axiosClient } from "./agents";
import { unwrapGraphQLResponse } from "./envelope";
import { getRateLimitInfo, normalizeRequestError, stampRequestId } from "./errors";
import { computeNextRetryDelay, getRetryBudgetState, isBudgetGatedFailure } from "./retry";
import {
    checkCircuitOpen,
    circuitCooldownRemainingMs,
    circuitScopeOf,
    getCircuitState,
    isAvailabilityFailure,
    isStreakNeutralFailure,
    recordCircuitFailure,
    recordCircuitSuccess,
} from "./circuitBreaker";
import { awaitPaceDeadline, paceAfterSuccess, paceAfterTerminalRateLimit } from "./pacing";
import { buildErrorContext, reportFailure, safeInvoke } from "./hooks";
import { sleep } from "./sleep";

/** The wire-level request one attempt dispatches. */
export interface ExecuteOptions {
    url: string;
    method: HttpMethod;
    data?: object | string;
    headers: Record<string, string>;
}

/**
 * Execution modifiers for {@link executeWithRetry}, replacing the former
 * positional trailing booleans so call sites name their arguments.
 *
 * @see {@link executeWithRetry}
 */
export interface ExecuteModifiers {
    /** Whether the response body is returned verbatim (REST) instead of unwrapped (GraphQL). */
    rawPassthrough?: boolean;
    /**
     * Whether this request was a cacheable read that missed the response
     * cache: its network-served onResponse emission then carries
     * `cacheHit: false` so consumers can count misses directly instead of
     * subtracting hits from total response counts.
     */
    cacheMiss?: boolean;
    /**
     * The cache write-back for a successful attempt, executed inside the
     * attempt loop after the response resolves and before the `onResponse`
     * emission, returning whether the response was actually stored. The
     * transport's `sendRequest` builds it from the cache policy (the
     * in-flight generation guard, the partial-success exclusion) so the
     * emission can carry `cacheWrite: true` exactly when the cache filled —
     * the third cache outcome, indistinguishable from a plain miss
     * otherwise (a fail-closed read, a partial-success envelope, and an
     * invalidation-guarded `setIfFresh` drop all report identically
     * without it). `undefined` when the request has no cache write-back
     * (mutations, cache-less clients).
     */
    writeBack?: (result: unknown, resolvedPartial: boolean) => boolean;
    /**
     * The pre-dispatch auth guard: returns an {@link AniLinkAuthError} when
     * the request requires auth material and none is configured. Runs as
     * the first statement of every attempt, before the circuit check and
     * before any network dispatch, so the no-network-dispatch guarantee is
     * preserved — but inside the attempt loop, where a `requestId` exists
     * and the error hooks can observe the failure. `undefined` when the
     * request does not require auth (the common path: the guard is not
     * invoked at all).
     */
    authGuard?: () => AniLinkAuthError | undefined;
}

/**
 * The outcome of one {@link executeWithRetry} dispatch: the resolved value
 * plus whether it came from a partial-success envelope resolved by
 * `allowPartialData`. The partial flag lets the transport entry keep the
 * degraded result out of the response cache — a later cache hit would
 * replay the data without the `onError` reporting that accompanied the
 * original fetch.
 *
 * @see {@link executeWithRetry}
 */
export interface ExecuteOutcome<T> {
    /** The resolved response value. */
    result: T;
    /** Whether the value was resolved from a partial-success GraphQL envelope. */
    resolvedPartial: boolean;
}

/**
 * Resolves one successful attempt's response body into the value the
 * pipeline returns — the raw body for REST passthrough, or the unwrapped
 * GraphQL envelope — accounting for the `allowPartialData` opt-in.
 *
 * When the envelope is a partial success resolved by `allowPartialData`,
 * the returned `partialError` carries the normalized error the strict mode
 * would have thrown; the caller reports it through the `onError` hook after
 * its own `onResponse` emission (the pre-extraction ordering), and the
 * returned `partialBreakerError` carries the error when its class
 * participates in circuit-breaker accounting: an availability-class error
 * (429/5xx) advances the streak exactly as the strict mode's throw would —
 * instead of letting the success path reset it, so a persistently degraded
 * upstream that always fails one root field cannot keep the breaker
 * permanently closed under the opt-in while tripping it under strict mode —
 * and a status-less envelope error is streak-neutral (see
 * `isStreakNeutralFailure`), so the resolved partial success neither
 * advances nor resets the streak, again matching the strict mode's throw of
 * the same error.
 *
 * @param response - The successful Axios response for the attempt.
 * @param resolved - The resolved request options.
 * @param rawPassthrough - Whether the body is returned verbatim (REST)
 * instead of unwrapped (GraphQL).
 * @returns The resolved value, whether it came from a partial-success
 * envelope, the partial error to report through `onError` when one was
 * resolved, and the breaker-relevant partial error (availability-class or
 * streak-neutral) for circuit accounting.
 */
const resolveEnvelopeOutcome = <T>(
    response: AxiosResponse,
    resolved: ResolvedRequestOptions,
    rawPassthrough: boolean
): {
    result: T;
    resolvedPartial: boolean;
    partialError: AniLinkGraphQLError | undefined;
    partialBreakerError: AniLinkGraphQLError | undefined;
} => {
    let resolvedPartial = false;
    let partialError: AniLinkGraphQLError | undefined;
    let partialBreakerError: AniLinkGraphQLError | undefined;
    const result = rawPassthrough
        ? (response.data as T)
        : unwrapGraphQLResponse<T>(
              response.data,
              response.headers as Record<string, unknown>,
              resolved.allowPartialData
                  ? {
                        allowPartialData: true,
                        onPartialData: (error) => {
                            resolvedPartial = true;
                            partialError = error;
                            if (isAvailabilityFailure(error) || isStreakNeutralFailure(error)) {
                                partialBreakerError = error;
                            }
                        },
                    }
                  : undefined
          );
    return { result, resolvedPartial, partialError, partialBreakerError };
};

/**
 * Dispatches one logical request with the full resilience pipeline: the
 * per-attempt circuit check, the pre-dispatch rate-limit pacing wait, the
 * network dispatch, the envelope resolution (including the
 * `allowPartialData` partial path), the cache write-back, the failure
 * recording, the retry-budget accounting, and every lifecycle-hook
 * emission — retrying retryable failures under the resolved policy until
 * one succeeds or the failure surfaces.
 *
 * The loop's invariants live here and only here: the half-open probe is
 * settled exactly once per attempt outcome, `onResponse` fires exactly once
 * per attempt (the `responseReported` guard keeps the error path from
 * double-emitting after a success-path emission), the cumulative
 * `pacedWaitMs`/`retryWaitMs` accumulators span attempts, and a budget unit
 * is spent exactly when a retry is scheduled.
 *
 * @typeParam T - The expected response payload type.
 * @param options - The wire-level request one attempt dispatches.
 * @param resolved - The resolved request options.
 * @param stateOwner - The caller's stable transport-state owner, when known.
 * @param modifiers - The execution modifiers; see {@link ExecuteModifiers}.
 * @returns The resolved value and whether it came from a partial-success
 * envelope.
 */
export const executeWithRetry = async <T>(
    options: ExecuteOptions,
    resolved: ResolvedRequestOptions,
    stateOwner: object | undefined,
    modifiers: ExecuteModifiers = {}
): Promise<ExecuteOutcome<T>> => {
    const { rawPassthrough = false, cacheMiss = false, writeBack, authGuard } = modifiers;
    const { url, method, data, headers } = options;
    const policy = resolved.retry;
    // Correlation ID joining every lifecycle hook emission for this logical
    // request (including across retries) in a metrics or logging backend.
    // Generated before `circuitScopeOf` so an unparseable-URL validation
    // error thrown from that call can still be correlated to this request.
    const requestId = randomUUID();
    const host = circuitScopeOf(url, requestId);
    const circuit =
        resolved.circuitBreaker !== undefined && stateOwner !== undefined
            ? getCircuitState(stateOwner, host)
            : undefined;
    const budgetState = getRetryBudgetState(stateOwner, resolved.retryBudget);
    let attempt = 0;
    // Total time this logical request has spent waiting for rate-limit
    // pacing across its attempts: stamped on the onResponse emission so a
    // paced request stays identifiable in latency dashboards without the
    // onPace hook being pre-wired. Declared outside the attempt loop so a
    // wait before a retried attempt is not lost when that attempt fails.
    let pacedWaitMs = 0;
    // Total time this logical request has spent waiting between attempts
    // (retry backoff and server-dictated delays), accumulated across its
    // attempts: stamped on the terminal error report so a request that
    // failed after several server-dictated 429 delays stays distinguishable
    // from a fast validation failure without joining onRetry events per
    // requestId. Same optional-presence convention as pacedMs.
    let retryWaitMs = 0;

    for (;;) {
        const startedAt = Date.now();
        const hookContext = { requestId, url, method, attempt: attempt + 1 };
        // The pre-dispatch auth guard runs inside the attempt loop — before
        // the circuit check, before pacing, before any network dispatch —
        // so a missing-token failure is observable through the same
        // hook/correlation machinery every other failure class uses
        // (onRequestStart + onError with a requestId) instead of throwing
        // invisibly above the pipeline. The guard is terminal: an auth
        // failure is never retried, never paced, and never reaches the
        // breaker — it says nothing about upstream health.
        const authError = authGuard?.();
        if (authError !== undefined) {
            safeInvoke(
                resolved.onRequestStart,
                "onRequestStart",
                resolved.onHookError,
                resolved.diagnostics,
                hookContext
            );
            stampRequestId(authError, requestId);
            safeInvoke(
                resolved.onError,
                "onError",
                resolved.onHookError,
                resolved.diagnostics,
                authError,
                buildErrorContext(requestId, url, method, attempt + 1, authError)
            );
            throw authError;
        }
        const circuitError = checkCircuitOpen(circuit, resolved.circuitBreaker);
        if (circuitError !== undefined) {
            safeInvoke(
                resolved.onRequestStart,
                "onRequestStart",
                resolved.onHookError,
                resolved.diagnostics,
                hookContext
            );
            stampRequestId(circuitError, requestId);
            // The breaker facts on the fast-fail report: the host scope so
            // fast-fail volume is graphable per upstream directly from
            // onError events, and the cooldown remaining so "when can I
            // retry?" is answered in the structured payload instead of the
            // message prose. Computed once — this is the hot path while the
            // breaker is open (every request fast-fails through here).
            const cooldownRemainingMs = circuitCooldownRemainingMs(
                circuit,
                resolved.circuitBreaker
            );
            safeInvoke(
                resolved.onError,
                "onError",
                resolved.onHookError,
                resolved.diagnostics,
                circuitError,
                buildErrorContext(requestId, url, method, attempt + 1, circuitError, {
                    host,
                    ...(cooldownRemainingMs !== undefined
                        ? { retryAfterMs: cooldownRemainingMs }
                        : {}),
                })
            );
            throw circuitError;
        }
        try {
            // The observed deadline wait, stagger excluded — the same
            // measure onPace reports — so the cumulative pacedMs stays
            // consistent with the per-wait emissions and never over-reports
            // the deadline wait by the random stagger.
            pacedWaitMs += await awaitPaceDeadline(stateOwner, host, resolved, hookContext);
        } catch (paceError) {
            // A caller abort during the pre-dispatch pacing wait carries no
            // upstream-health signal. When the reserved half-open probe is
            // aborted here, the breaker closes — matching the axios-cancel
            // path, where the same abort also closes it — instead of
            // re-opening with a fresh cooldown that punishes the caller with
            // a fast-fail window for an abort that says nothing about the
            // upstream.
            if (circuit !== undefined && circuit.probeInFlight) {
                recordCircuitSuccess(circuit, resolved, hookContext, host);
            }
            throw paceError;
        }
        safeInvoke(
            resolved.onRequestStart,
            "onRequestStart",
            resolved.onHookError,
            resolved.diagnostics,
            hookContext
        );
        let responseReported = false;
        try {
            const response: AxiosResponse = await axiosClient({
                url,
                method,
                data,
                headers,
                timeout: resolved.timeout,
                signal: resolved.signal,
                httpAgent: resolved.httpAgent,
                httpsAgent: resolved.httpsAgent,
            });
            const rateLimit = getRateLimitInfo(response.headers as Record<string, unknown>);
            // The attempt's wall-clock duration is captured when the HTTP
            // response arrives — before the envelope unwrap and the cache
            // write-back clone — so durationMs measures the network attempt
            // only, matching the pre-extraction emission point.
            const attemptDurationMs = Date.now() - startedAt;
            // The onResponse facts shared by every emission below: the
            // parsed rate-limit headers and the cache-miss marker ride along
            // even when the envelope later turns out to carry errors, so
            // quota tracking and miss counting keep working on that error
            // class (the pre-extraction payload).
            const responseFacts = {
                ...hookContext,
                durationMs: attemptDurationMs,
                ...(rateLimit !== undefined ? { rateLimit } : {}),
                ...(cacheMiss ? { cacheHit: false } : {}),
                ...(pacedWaitMs > 0 ? { pacedMs: pacedWaitMs } : {}),
            };
            let outcome: {
                result: T;
                resolvedPartial: boolean;
                partialError: AniLinkGraphQLError | undefined;
                partialBreakerError: AniLinkGraphQLError | undefined;
            };
            try {
                outcome = resolveEnvelopeOutcome<T>(response, resolved, rawPassthrough);
            } catch (envelopeError) {
                // A strict-mode GraphQL error envelope (HTTP 200 + errors)
                // throws during the unwrap. The HTTP attempt itself
                // succeeded, so onResponse reports it with the attempt's
                // facts before the error surfaces through the failure path
                // below — the pre-extraction ordering, which keeps
                // onResponse ahead of onError and the rateLimit/cacheHit
                // facts on the emission.
                safeInvoke(
                    resolved.onResponse,
                    "onResponse",
                    resolved.onHookError,
                    resolved.diagnostics,
                    responseFacts
                );
                responseReported = true;
                throw envelopeError;
            }
            const { result, resolvedPartial, partialError, partialBreakerError } = outcome;
            // The cache write-back runs inside the attempt loop, after the
            // envelope resolves, so the onResponse emission can report
            // whether the cache actually filled — the third cache outcome
            // alongside hit and miss. A `false` return (a fail-closed read,
            // a partial-success envelope, an invalidation-guarded drop)
            // leaves the emission unmarked, the same optional-presence
            // convention as `cacheHit`.
            const cacheWritten = writeBack?.(result, resolvedPartial) ?? false;
            safeInvoke(
                resolved.onResponse,
                "onResponse",
                resolved.onHookError,
                resolved.diagnostics,
                { ...responseFacts, ...(cacheWritten ? { cacheWrite: true } : {}) }
            );
            responseReported = true;
            if (partialError !== undefined) {
                // A partial resolution is terminal — the data is returned,
                // not retried — so the error hook is the only place the
                // failures appear. Reported after the onResponse emission,
                // matching the pre-extraction ordering.
                stampRequestId(partialError, requestId);
                safeInvoke(
                    resolved.onError,
                    "onError",
                    resolved.onHookError,
                    resolved.diagnostics,
                    partialError,
                    buildErrorContext(requestId, url, method, attempt + 1, partialError)
                );
            }
            if (partialBreakerError !== undefined) {
                // The partial envelope's error entries participate in
                // breaker accounting exactly as the strict mode's throw of
                // the same error would — the same normalized error, the same
                // probe bookkeeping (a failed half-open probe re-opens with a
                // scaled cooldown; a status-less envelope error is
                // streak-neutral but still settles an in-flight probe by
                // closing, since the upstream answered).
                recordCircuitFailure(
                    circuit,
                    resolved.circuitBreaker,
                    partialBreakerError,
                    resolved,
                    hookContext,
                    host
                );
            } else {
                recordCircuitSuccess(circuit, resolved, hookContext, host);
            }
            paceAfterSuccess(response, resolved, rateLimit, stateOwner, host);
            return { result, resolvedPartial };
        } catch (error: unknown) {
            if (!responseReported) {
                safeInvoke(
                    resolved.onResponse,
                    "onResponse",
                    resolved.onHookError,
                    resolved.diagnostics,
                    {
                        ...hookContext,
                        durationMs: Date.now() - startedAt,
                        ...(pacedWaitMs > 0 ? { pacedMs: pacedWaitMs } : {}),
                    }
                );
            }
            const normalized = normalizeRequestError(resolved, error, rawPassthrough, requestId);
            const wasProbe = circuit?.probeInFlight === true;
            recordCircuitFailure(
                circuit,
                resolved.circuitBreaker,
                normalized,
                resolved,
                hookContext,
                host
            );
            const delayInput = {
                normalized,
                rawError: error,
                attempt,
                policy,
                budgetState,
                budget: resolved.retryBudget,
                wasProbe,
            };
            const delay = computeNextRetryDelay(delayInput);
            if (delay !== null && budgetState !== undefined) {
                budgetState.retriesUsed += 1;
            }
            // A terminal 429 records the rate-limit reset deadline from the
            // error's own metadata — the failure-path counterpart of
            // paceAfterSuccess — so the next request to the same host waits
            // for the window this one proved exhausted instead of
            // dispatching immediately, eating another 429, and repeating
            // until the window resets on its own.
            if (delay === null) {
                paceAfterTerminalRateLimit(normalized, resolved, stateOwner, host);
            }
            reportFailure(requestId, url, method, attempt + 1, normalized, resolved, {
                nextDelayMs: delay ?? undefined,
                // The cumulative retry wait, present only when a wait
                // occurred — the same optional-presence convention as
                // pacedMs — so terminal-failure metrics can report the
                // total retry investment directly from the onError
                // payload.
                ...(retryWaitMs > 0 ? { retryWaitMs } : {}),
                // The budget-exhaustion signal: this failure was
                // retryable, but the window's retry spend was already
                // spent — distinguishable at the hook level from a
                // failure that was never retryable, without polling
                // transport-state snapshots. Gated on actual retryability
                // (see isBudgetGatedFailure) so a never-retryable failure
                // landing in a spent window is not miscounted as chronic
                // budget exhaustion.
                ...(delay === null && isBudgetGatedFailure(delayInput)
                    ? { budgetExhausted: true }
                    : {}),
            });
            if (delay === null) {
                throw normalized;
            }
            retryWaitMs += delay;
            attempt += 1;
            await sleep(delay, resolved.signal, requestId);
        }
    }
};
