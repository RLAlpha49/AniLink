/**
 * Resolved transport options and the option normalizer.
 *
 * {@link resolveRequestOptions} folds a partial public {@link RequestOptions}
 * into the complete, validated set the request pipeline uses for one call:
 * it resolves the retry policy, the keep-alive agents, the pacing and
 * rate-limit-floor defaults, and forwards every hook. The
 * {@link ResolvedRequestOptions} interface is the shared shape every
 * resilience module (errors, pacing, circuit breaker, retry loop) reads
 * from, so it lives here rather than in `transportTypes` to keep the type
 * next to the resolver and avoid pulling runtime agents into the leaf type
 * module.
 */
import type http from "node:http";
import type https from "node:https";
import type { ResponseCache } from "./responseCache";
import {
    type DiagnosticsMode,
    type OnCircuitCloseHandler,
    type OnCircuitOpenHandler,
    type OnErrorHandler,
    type OnHookErrorHandler,
    type OnPaceHandler,
    type OnRequestStartHandler,
    type OnResponseHandler,
    type RequestOptions,
    type RetryBudget,
    type RetryPolicy,
    DEFAULT_REQUEST_TIMEOUT,
    resolveDiagnosticsMode,
} from "./transportTypes";
import { resolveAgents } from "./agents";
import { resolveRetryPolicy } from "./retry";

/**
 * The complete, validated transport settings one request pipeline runs
 * with — the output of {@link resolveRequestOptions}.
 *
 * Every resilience module (error normalization, pacing, circuit breaker,
 * retry loop) reads from this shape instead of re-deriving defaults, so a
 * request never branches on missing fields. Unlike the public
 * {@link RequestOptions}, the defaults are already applied: `timeout`,
 * `exposeRawAxiosError`, `paceWithRateLimit`, `rateLimitFloor`,
 * `ignorePaceDeadline`, and `diagnostics` are always present, `retry` is a
 * complete policy or `null`, and the keep-alive agents are resolved.
 *
 * @see {@link RequestOptions}
 */
export interface ResolvedRequestOptions {
    /** Per-attempt timeout in milliseconds; `0` disables the Axios timeout. */
    timeout: number;
    /** Signal used to cancel in-flight requests and retry waits. */
    signal?: AbortSignal;
    /** Whether raw Axios errors are attached to thrown errors for diagnostics. */
    exposeRawAxiosError: boolean;
    /** The complete retry policy, or `null` when retries are disabled. */
    retry: RetryPolicy | null;
    /** Whether proactive rate-limit pacing is enabled. */
    paceWithRateLimit: boolean;
    /** Remaining-quota threshold below which pacing delays the next request. */
    rateLimitFloor: number;
    /** Circuit-breaker configuration, when opted in. */
    circuitBreaker?: { threshold: number; cooldownMs: number };
    /** Retry-budget configuration, when opted in. */
    retryBudget?: RetryBudget;
    /** The resolved keep-alive agent for plain-HTTP requests. */
    httpAgent: http.Agent;
    /** The resolved keep-alive agent for HTTPS requests. */
    httpsAgent: https.Agent;
    /** Invoked when an attempt fails and once more when retries are exhausted. */
    onError?: OnErrorHandler;
    /** Invoked before each retry wait with the scheduled delay. */
    onRetry?: OnErrorHandler;
    /** Invoked just before each attempt is sent. */
    onRequestStart?: OnRequestStartHandler;
    /** Invoked after each attempt completes. */
    onResponse?: OnResponseHandler;
    /** Invoked when proactive pacing delays the next request. */
    onPace?: OnPaceHandler;
    /** Invoked when a user-supplied lifecycle hook throws. */
    onHookError?: OnHookErrorHandler;
    /** How the library's unsolicited diagnostics are emitted; see {@link DiagnosticsMode}. */
    diagnostics: DiagnosticsMode;
    /** Invoked when the circuit breaker opens. */
    onCircuitOpen?: OnCircuitOpenHandler;
    /** Invoked when the circuit breaker closes. */
    onCircuitClose?: OnCircuitCloseHandler;
    /** Whether the shared rate-limit pacing deadline is bypassed for this request. */
    ignorePaceDeadline: boolean;
    /** Whether GraphQL envelopes carrying both data and errors resolve with the data instead of throwing. */
    allowPartialData: boolean;
    /** The opt-in response cache, when configured. */
    responseCache?: ResponseCache;
    /** Whether this request skips the response cache entirely (no lookup, no write-back). */
    bypassResponseCache: boolean;
}

/**
 * Resolves partial transport settings into the complete set used by one
 * request pipeline.
 *
 * Passing no options restores the defaults. A timeout of zero is valid because
 * Axios uses it to disable its timeout.
 *
 * @param options - Optional transport configuration.
 * @returns The fully resolved options.
 * @throws A `TypeError` when `timeout` is negative or not finite.
 */
export const resolveRequestOptions = (options: RequestOptions = {}): ResolvedRequestOptions => {
    const timeout = options.timeout ?? DEFAULT_REQUEST_TIMEOUT;

    if (!Number.isFinite(timeout) || timeout < 0) {
        throw new TypeError("timeout must be a finite number greater than or equal to 0");
    }

    const rateLimitFloor = options.rateLimitFloor ?? 1;
    if (
        !Number.isFinite(rateLimitFloor) ||
        rateLimitFloor < 0 ||
        !Number.isInteger(rateLimitFloor)
    ) {
        throw new TypeError(
            "rateLimitFloor must be a finite, non-negative integer (0 disables floor-based pacing)"
        );
    }

    const agents = resolveAgents(options.maxSockets, options.maxFreeSockets);

    const diagnostics = resolveDiagnosticsMode(options.diagnostics);

    return {
        timeout,
        signal: options.signal,
        exposeRawAxiosError: options.exposeRawAxiosError ?? false,
        retry: resolveRetryPolicy(options.retry),
        paceWithRateLimit: options.paceWithRateLimit ?? true,
        rateLimitFloor,
        circuitBreaker: options.circuitBreaker,
        retryBudget: options.retryBudget,
        httpAgent: agents.httpAgent,
        httpsAgent: agents.httpsAgent,
        onError: options.onError,
        onRetry: options.onRetry,
        onRequestStart: options.onRequestStart,
        onResponse: options.onResponse,
        onPace: options.onPace,
        onHookError: options.onHookError,
        diagnostics,
        onCircuitOpen: options.onCircuitOpen,
        onCircuitClose: options.onCircuitClose,
        ignorePaceDeadline: options.ignorePaceDeadline ?? false,
        allowPartialData: options.allowPartialData ?? false,
        responseCache: options.responseCache,
        bypassResponseCache: options.bypassResponseCache ?? false,
    };
};
