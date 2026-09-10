/**
 * Per-client circuit-breaker state machine.
 *
 * Owns the module-level `circuitStates` `WeakMap` keyed by a stable per-client
 * owner and then by upstream host, the scope extractor, the LRU-bounded
 * per-owner scope map, and the three state transitions: fast-fail while open
 * (`checkCircuitOpen`), reset on success (`recordCircuitSuccess`), and
 * count-and-trip on failure (`recordCircuitFailure`). The half-open
 * `probeInFlight` flag reserves a single post-cooldown probe so concurrent
 * requests fast-fail until the probe settles.
 */
import {
    AniLinkApiError,
    AniLinkError,
    AniLinkErrorCodes,
    AniLinkNetworkError,
    AniLinkValidationError,
} from "./AniLinkError";
import type { RequestContext } from "./transportTypes";
import type { ResolvedRequestOptions } from "./requestOptions";
import { safeInvoke } from "./hooks";
import { stampRequestId } from "./errors";

/**
 * Shared circuit-breaker state, keyed first by a stable per-client owner —
 * the {@link SendRequestOptions.stateOwner} object when supplied (for
 * example the operation instance a request dispatches through) and otherwise
 * the `circuitBreaker` configuration object itself, which stays identical
 * across requests when the caller reuses one transport-settings object (the
 * instance-level pattern) — and then by the upstream host (so one provider's
 * outage cannot fast-fail another provider's requests on a multi-API client).
 * Only populated when a request opts in via `circuitBreaker`; disabled
 * configurations allocate nothing.
 */
const circuitStates = new WeakMap<object, Map<string, CircuitState>>();

export interface CircuitState {
    consecutiveFailures: number;
    openedAt: number | null;
    probeInFlight: boolean;
}

/**
 * Classifies a normalized failure as an availability failure — the only
 * class that may count toward the circuit breaker.
 *
 * Availability failures are transport-level conditions that indicate the
 * upstream is unhealthy: network errors, timeouts, rate limiting (429), and
 * server faults (5xx), including their GraphQL-envelope counterparts.
 * Caller-side errors (4xx, GraphQL validation failures with no upstream
 * status) and caller-initiated aborts say nothing about upstream health, so
 * counting them would let a consumer-side bug fast-fail healthy traffic.
 *
 * @param error - The normalized failure from the request pipeline.
 * @returns Whether the failure may count toward the breaker.
 */
export const isAvailabilityFailure = (error: AniLinkError): boolean => {
    if (error instanceof AniLinkNetworkError) {
        // Caller-initiated aborts are not upstream failures.
        return error.code !== AniLinkErrorCodes.ABORTED;
    }
    if (error instanceof AniLinkApiError) {
        // AniLinkGraphQLError subclasses carry the upstream status (or the
        // envelope default 200), so GraphQL-level 429/5xx count here too.
        return error.status === 429 || error.status >= 500;
    }
    return false;
};

/**
 * Upper bound on distinct host scopes tracked per owner. Public transport
 * callers that send to many hosts through one client accumulate a breaker
 * state entry per host; this cap evicts the least-recently-used scope so
 * memory stays bounded. The shipped two-provider host set is tiny, so this
 * only matters for `sendRequest`/`custom()` consumers with dynamic URLs.
 */
const MAX_CIRCUIT_SCOPES_PER_OWNER = 64;

/**
 * Extracts the upstream identity for breaker scoping from a request URL.
 * Throws an {@link AniLinkValidationError} when the URL cannot be parsed so a
 * request with an unparseable URL fails fast at dispatch instead of silently
 * sharing one breaker bucket with all other malformed-URL traffic (which
 * would let cross-provider or cross-endpoint failures contaminate each
 * other). The error is a normalized `AniLinkError` subclass so consumers
 * catching `AniLinkError` still handle it consistently.
 */
export const circuitScopeOf = (url: string, requestId?: string): string => {
    try {
        return new URL(url).host;
    } catch {
        // Generic message: the raw URL may carry credentials or sensitive
        // query parameters and must not be echoed into the error details.
        const error = new AniLinkValidationError(["Unparseable request URL"]);
        stampRequestId(error, requestId);
        throw error;
    }
};

export const getCircuitState = (owner: object, scope: string): CircuitState => {
    let scopes = circuitStates.get(owner);
    if (scopes === undefined) {
        scopes = new Map();
        circuitStates.set(owner, scopes);
    }
    let state = scopes.get(scope);
    if (state !== undefined) {
        // Refresh recency: delete + re-insert moves the scope to the end.
        scopes.delete(scope);
        scopes.set(scope, state);
        return state;
    }
    // Cap the per-owner scope map so dynamic-URL callers cannot grow it
    // without bound. Map preserves insertion order, so the first key is the
    // least recently used after the delete+re-insert refreshes above.
    if (scopes.size >= MAX_CIRCUIT_SCOPES_PER_OWNER) {
        const oldestScope = scopes.keys().next().value;
        if (oldestScope !== undefined) {
            scopes.delete(oldestScope);
        }
    }
    state = {
        consecutiveFailures: 0,
        openedAt: null,
        probeInFlight: false,
    };
    scopes.set(scope, state);
    return state;
};

/**
 * Fast-fails while the circuit is open. Once the cooldown has elapsed,
 * reserves the single post-cooldown probe by switching to a half-open state
 * (`probeInFlight`) and lets that one request through; concurrent requests
 * while the probe is pending fast-fail so only the probe reaches the
 * upstream. The probe's own success or failure clears the half-open state
 * (closing or re-opening the breaker) via {@link recordCircuitSuccess} /
 * {@link recordCircuitFailure}.
 *
 * @param circuit - The caller's breaker state, when the breaker is enabled.
 * @param breaker - The breaker configuration, when enabled.
 * @returns The fast-fail error while the cooldown is still running or a probe is pending, or `undefined` when the attempt may proceed.
 */
export const checkCircuitOpen = (
    circuit: CircuitState | undefined,
    breaker: { threshold: number; cooldownMs: number } | undefined
): AniLinkNetworkError | undefined => {
    if (circuit === undefined || breaker === undefined) {
        return undefined;
    }
    if (circuit.probeInFlight) {
        return new AniLinkNetworkError(
            AniLinkErrorCodes.CIRCUIT,
            `The request failed fast: the circuit breaker is probing the upstream after ${breaker.threshold} consecutive failures. Retrying is possible once the probe settles.`
        );
    }
    if (circuit.openedAt === null) {
        return undefined;
    }
    if (Date.now() - circuit.openedAt < breaker.cooldownMs) {
        return new AniLinkNetworkError(
            AniLinkErrorCodes.CIRCUIT,
            `The request failed fast: the circuit breaker is open after ${breaker.threshold} consecutive failures. Retrying is possible after the cooldown elapses.`
        );
    }
    circuit.openedAt = null;
    circuit.probeInFlight = true;
    return undefined;
};

/**
 * Resets the failure streak after a successful attempt. When the success is
 * the reserved post-cooldown probe, clears the half-open state and closes
 * the breaker, emitting `onCircuitClose` so dashboards can plot recovery.
 */
export const recordCircuitSuccess = (
    circuit: CircuitState | undefined,
    resolved: ResolvedRequestOptions,
    hookContext: RequestContext,
    host: string
): void => {
    if (circuit === undefined) {
        return;
    }
    const wasOpen = circuit.openedAt !== null || circuit.probeInFlight;
    circuit.probeInFlight = false;
    circuit.consecutiveFailures = 0;
    circuit.openedAt = null;
    if (wasOpen && resolved.onCircuitClose !== undefined) {
        safeInvoke(resolved.onCircuitClose, "onCircuitClose", resolved.onHookError, {
            ...hookContext,
            host,
        });
    }
};

/**
 * Counts a failed attempt and opens the circuit once the consecutive-failure
 * budget is exhausted. Only availability failures (see
 * {@link isAvailabilityFailure}) count: network errors, timeouts, 429s, and
 * 5xx responses. Caller-side errors (4xx, GraphQL validation failures) and
 * caller-initiated aborts say nothing about upstream health, so they never
 * advance the streak — and because such a failure proves the upstream
 * answered, it resets the streak like a success would: a stale 500-streak
 * cannot trip the breaker after interleaved caller-side errors. When such a
 * failure is the reserved post-cooldown probe, the breaker closes (the
 * upstream answered, so it is reachable) instead of re-opening. When the
 * failure is the reserved post-cooldown probe, clears the half-open state and
 * re-opens the breaker immediately so the next request fast-fails until the
 * cooldown elapses again. Emits `onCircuitOpen` on the first trip into open
 * (not on re-opens from a failed probe, which are a continuation of the same
 * open period).
 *
 * @param circuit - The caller's breaker state, when the breaker is enabled.
 * @param breaker - The breaker configuration, when enabled.
 * @param normalized - The normalized failure from the request pipeline.
 * @param resolved - The resolved request options, for the `onCircuitOpen` hook.
 * @param hookContext - The request context, for the `onCircuitOpen` hook.
 * @param host - The upstream host scope, for the `onCircuitOpen` hook.
 * @returns Nothing; mutates the breaker state.
 */
export const recordCircuitFailure = (
    circuit: CircuitState | undefined,
    breaker: { threshold: number; cooldownMs: number } | undefined,
    normalized: AniLinkError,
    resolved: ResolvedRequestOptions,
    hookContext: RequestContext,
    host: string
): void => {
    if (circuit === undefined || breaker === undefined) {
        return;
    }
    if (!isAvailabilityFailure(normalized)) {
        // The upstream answered with a caller-side error, so it is
        // reachable: the availability-failure streak resets, exactly as it
        // would on a success. If this was the reserved half-open probe,
        // closing the breaker (emitting onCircuitClose) is part of that
        // reset instead of leaving it wedged.
        recordCircuitSuccess(circuit, resolved, hookContext, host);
        return;
    }
    if (circuit.probeInFlight) {
        circuit.probeInFlight = false;
        circuit.openedAt = Date.now();
        return;
    }
    circuit.consecutiveFailures += 1;
    if (circuit.consecutiveFailures >= breaker.threshold && circuit.openedAt === null) {
        circuit.openedAt = Date.now();
        if (resolved.onCircuitOpen !== undefined) {
            safeInvoke(resolved.onCircuitOpen, "onCircuitOpen", resolved.onHookError, {
                ...hookContext,
                host,
                failures: circuit.consecutiveFailures,
            });
        }
    }
};
