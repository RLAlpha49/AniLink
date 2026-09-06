/**
 * Public type and constant surface for the shared transport.
 *
 * This module owns the transport's exported option/hook type declarations and
 * the small, dependency-free default constants (`DEFAULT_REQUEST_TIMEOUT`,
 * `MAX_SOCKETS`, `MAX_FREE_SOCKETS`). It is a leaf module: it only depends on
 * the error taxonomy (`./AniLinkError`) and the opt-in {@link ResponseCache}
 * type, so every other transport module can import these symbols without
 * forming a cycle. {@link RequestHandler} re-exports everything here so
 * consumers keep importing from `./RequestHandler` unchanged.
 */
import type { ResponseCache } from "./responseCache";
import { type AniLinkErrorCode, type RateLimitInfo } from "./AniLinkError";

/**
 * Default maximum time a request may remain in progress, in milliseconds.
 *
 * @see {@link RequestOptions.timeout}
 */
export const DEFAULT_REQUEST_TIMEOUT = 30_000;

/** Socket bounds for the shared keep-alive agents (see {@link MAX_SOCKETS}). */
export const MAX_FREE_SOCKETS = 5;

/**
 * Upper bound on concurrent sockets per shared keep-alive agent.
 *
 * The Node defaults are unbounded (`maxSockets: Infinity`), which lets bursts
 * open far more connections than connection reuse can benefit from and lets
 * idle keep-alive sockets linger until the server closes them. 20 concurrent
 * sockets comfortably covers legitimate pagination concurrency while keeping
 * pressure on AniList bounded; freed sockets are retained up to
 * {@link MAX_FREE_SOCKETS} with LIFO scheduling so the warmest connection is
 * reused first.
 */
export const MAX_SOCKETS = 20;

/**
 * Per-window cap on retries across requests sharing the same transport
 * settings object.
 *
 * The per-request `maxRetries` bounds retries for one call, but a workload
 * issuing thousands of requests during a sustained upstream outage would
 * still multiply API call volume by up to `maxRetries + 1` indefinitely.
 * This budget bounds the *total* retry spend per rolling window; when it is
 * exhausted, failures surface without retries until the window elapses.
 *
 * @see {@link RequestOptions.retryBudget}
 */
export interface RetryBudget {
    /** The maximum number of retries allowed across the window. */
    maxRetriesPerWindow: number;
    /** The rolling window length in milliseconds. */
    windowMs: number;
}

/**
 * Retry policy for transient transport failures.
 *
 * Delays between retries use exponential backoff with full jitter by default:
 * each wait is a random value between `0` and the computed exponential cap so
 * concurrent clients do not synchronize their retries (thundering herd).
 * Server-dictated `Retry-After` delays are never jittered.
 *
 * @see {@link RequestOptions.retry}
 */
export interface RetryPolicy {
    /** The maximum number of retries after the initial attempt. */
    maxRetries: number;
    /** The base delay before the first retry, in milliseconds. */
    baseDelayMs: number;
    /** The maximum delay between retries, in milliseconds. */
    maxDelayMs: number;
    /** HTTP status codes that trigger a retry. */
    retryOnStatus: readonly number[];
    /** Whether network and timeout failures trigger a retry. */
    retryOnNetworkError: boolean;
    /** Whether to apply full jitter to computed backoff delays. Defaults to `true`. */
    jitter?: boolean;
}

/**
 * HTTP methods the shared transport accepts.
 *
 * GraphQL providers use `POST` only; REST providers additionally use `GET`,
 * `PUT`, and `DELETE`. The union is shared so hooks and error contexts stay
 * provider-agnostic.
 *
 * @see {@link sendRequest}
 */
export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

/**
 * Authentication material a provider can apply to an HTTP request.
 *
 * @see {@link RequestAuthInput}
 */
export interface RequestAuth {
    /** A bearer token, when the provider uses bearer authentication. */
    readonly token?: string;
    /** Explicit headers for schemes such as Basic auth or provider API keys. */
    readonly headers?: Readonly<Record<string, string>>;
}

/**
 * Legacy string tokens and structured provider authentication accepted by transport.
 *
 * @see {@link RequestAuth}
 */
export type RequestAuthInput = string | RequestAuth;

/**
 * Context passed to the request lifecycle hooks for a single failed attempt.
 *
 * @see {@link OnErrorHandler}
 */
export interface RequestErrorContext {
    /**
     * Library-generated correlation ID identifying one logical request across
     * all of its attempts. Use it to join `onRequestStart`, `onResponse`,
     * `onError`, and `onRetry` events for the same request in a metrics or
     * logging backend.
     */
    requestId: string;
    /** The URL the request was sent to. */
    url: string;
    /** The HTTP method of the request. */
    method: HttpMethod;
    /** The 1-based attempt that failed. */
    attempt: number;
    /** The stable code of the normalized failure; see {@link AniLinkErrorCode}. */
    code: AniLinkErrorCode;
    /** The HTTP status when the failure came from an API response. */
    status?: number;
    /** The delay before the next retry, when the failure will be retried. */
    nextDelayMs?: number;
    /**
     * Rate-limit accounting parsed from the failure response's
     * `x-ratelimit-*` headers, when the upstream included them.
     */
    rateLimit?: RateLimitInfo;
}

/**
 * Callback invoked when an attempt fails, before each retry wait and once more when retries are exhausted.
 *
 * @see {@link RequestOptions.onError}
 * @see {@link RequestOptions.onRetry}
 */
export type OnErrorHandler = (
    error: import("./AniLinkError").AniLinkError,
    context: RequestErrorContext
) => void;

/**
 * Context passed to the `onRequestStart` hook just before an attempt is sent.
 *
 * @see {@link OnRequestStartHandler}
 */
export interface RequestContext {
    /**
     * Library-generated correlation ID identifying one logical request across
     * all of its attempts; see {@link RequestErrorContext.requestId}.
     */
    requestId: string;
    /** The URL the request is being sent to. */
    url: string;
    /** The HTTP method of the request. */
    method: HttpMethod;
    /** The 1-based attempt about to run. */
    attempt: number;
}

/**
 * A callback invoked immediately before each request attempt is sent. Use it
 * to count request volume or correlate logs with outgoing attempts.
 *
 * @see {@link RequestOptions.onRequestStart}
 */
export type OnRequestStartHandler = (context: RequestContext) => void;

/**
 * A callback invoked after each attempt completes with the elapsed
 * `durationMs` and parsed `rateLimit` headers when present. When the response
 * was served from the opt-in response cache, `cacheHit` is `true` and
 * `durationMs` is `0`.
 *
 * @see {@link RequestOptions.onResponse}
 */
export type OnResponseHandler = (
    context: RequestContext & { durationMs: number; rateLimit?: RateLimitInfo; cacheHit?: boolean }
) => void;

/**
 * A callback invoked when proactive rate-limit pacing delays the next request
 * after a successful attempt, with the pacing wait in `delayMs`.
 *
 * @see {@link RequestOptions.onPace}
 */
export type OnPaceHandler = (context: RequestContext & { delayMs: number }) => void;

/**
 * A callback invoked when a user-supplied lifecycle hook throws. Throwing
 * hooks never affect the request pipeline; this callback only observes the
 * failure so it can be routed to a logger or metrics backend. When unset,
 * hook failures fall back to a `console.warn`.
 *
 * @see {@link RequestOptions.onHookError}
 */
export type OnHookErrorHandler = (hookName: string, error: unknown) => void;

/**
 * Context passed to the `onCircuitOpen` hook when the circuit breaker trips.
 *
 * @see {@link OnCircuitOpenHandler}
 */
export interface CircuitOpenContext extends RequestContext {
    /** The upstream host scope the breaker tripped for. */
    host: string;
    /** The consecutive-failure count that reached the threshold. */
    failures: number;
}

/**
 * A callback invoked when the circuit breaker opens (trips) after the
 * consecutive-failure threshold is reached, so dashboards can plot trip
 * frequency and time-to-half-open without scraping `CIRCUIT_OPEN_ERROR` codes.
 *
 * @see {@link RequestOptions.onCircuitOpen}
 */
export type OnCircuitOpenHandler = (context: CircuitOpenContext) => void;

/**
 * A callback invoked when the circuit breaker closes (returns to healthy)
 * after a successful post-cooldown probe, so dashboards can plot open
 * duration and recovery without inferring it from error-code absence.
 *
 * @see {@link RequestOptions.onCircuitClose}
 */
export type OnCircuitCloseHandler = (context: RequestContext & { host: string }) => void;

/**
 * Transport settings shared by the AniLink request operations.
 *
 * Pass these as the second argument of the {@link AniLink} constructor; they apply
 * per instance and never leak across clients.
 *
 * @see {@link sendRequest}
 */
export interface RequestOptions {
    /** Milliseconds before a request is aborted. `0` disables the Axios timeout. Defaults to {@link DEFAULT_REQUEST_TIMEOUT}; timeout errors carry the effective duration as {@link AniLinkNetworkError.timeoutMs}. */
    timeout?: number;
    /** Signal used to cancel in-flight requests. */
    signal?: AbortSignal;
    /**
     * Attach the original Axios error to thrown errors as `rawAxiosError`
     * (and `cause`) for local debugging. Defaults to `false` because raw
     * errors can contain request configuration and bearer-token headers.
     */
    exposeRawAxiosError?: boolean;
    /**
     * Automatic retries for transient failures. Defaults to the built-in
     * policy (`maxRetries: 3`, jittered exponential backoff over HTTP `429`
     * and `5xx` responses plus network and timeout errors). Pass `false` to
     * opt out and send every request exactly once, or pass a partial policy
     * to tune individual knobs on top of the defaults.
     */
    retry?: boolean | Partial<RetryPolicy>;
    /**
     * Opt into proactive request pacing driven by the `x-ratelimit-*` headers
     * of every successful response: when the reported remaining quota drops
     * below `rateLimitFloor` (default 1), the next attempt waits until the
     * window resets instead of discovering the limit via a `429`. On by
     * default; pass `false` to disable it and discover the limit reactively
     * (each `429` then costs a wasted request plus a retry wait).
     */
    paceWithRateLimit?: boolean;
    /**
     * Remaining-quota threshold below which {@link RequestOptions.paceWithRateLimit}
     * delays the next request until the window resets. Defaults to `1`.
     */
    rateLimitFloor?: number;
    /**
     * Opt into a per-client circuit breaker for sustained upstream outages:
     * after `threshold` consecutive failed attempts, further requests fail
     * fast with a `CIRCUIT_OPEN_ERROR` network error until `cooldownMs` has
     * elapsed since the last failure, after which the next request is allowed
     * through as a probe. Off by default; when unset, no failure accounting
     * happens across requests.
     */
    circuitBreaker?: { threshold: number; cooldownMs: number };
    /**
     * Optional per-window cap on total retry attempts, complementing the
     * per-request `maxRetries` and the opt-in `circuitBreaker`: the retry
     * policy bounds one request's retries, the breaker handles sustained
     * outages after consecutive failures, and this budget bounds the total
     * retry spend across many requests in a rolling window (which handles
     * chronic intermittent failures even when the breaker never trips).
     * When the budget for the current window is exhausted, failures surface
     * without retries until the window elapses. Off by default.
     */
    retryBudget?: RetryBudget;
    /**
     * Upper bound on concurrent keep-alive sockets for this request.
     * Defaults to {@link MAX_SOCKETS} (20). Supplying this or
     * `maxFreeSockets` constructs dedicated per-request agents instead of
     * reusing the shared module-level pool, isolating this caller's socket
     * pressure from other {@link AniLink} instances and providers.
     */
    maxSockets?: number;
    /**
     * Upper bound on retained idle keep-alive sockets for this request.
     * Defaults to {@link MAX_FREE_SOCKETS} (5); see {@link RequestOptions.maxSockets}.
     */
    maxFreeSockets?: number;
    onError?: OnErrorHandler;
    /** Invoked before each retry wait with the scheduled delay in `nextDelayMs`. Falls back to per-attempt `onError` calls when unset. */
    onRetry?: OnErrorHandler;
    /** Invoked just before each attempt is sent. */
    onRequestStart?: OnRequestStartHandler;
    /** Invoked after each attempt completes with the elapsed `durationMs` and the parsed `rateLimit` headers when present. */
    onResponse?: OnResponseHandler;
    /**
     * Invoked when proactive rate-limit pacing ({@link RequestOptions.paceWithRateLimit})
     * delays the next request after a successful attempt, with the pacing
     * wait in `delayMs`.
     */
    onPace?: OnPaceHandler;
    /**
     * Invoked when a user-supplied lifecycle hook throws. Throwing hooks are
     * always isolated from the request pipeline; this callback observes the
     * failure so it can be routed to a logger or metrics backend. When unset,
     * hook failures are reported via `console.warn`.
     */
    onHookError?: OnHookErrorHandler;
    /**
     * Invoked when the circuit breaker opens (trips) after the
     * consecutive-failure threshold is reached. Carries the host scope and
     * the failure count so consumers can plot trip frequency and alert on
     * sustained outages without parsing `CIRCUIT_OPEN_ERROR` codes.
     *
     * @see {@link OnCircuitOpenHandler}
     */
    onCircuitOpen?: OnCircuitOpenHandler;
    /**
     * Invoked when the circuit breaker closes (returns to healthy) after a
     * successful post-cooldown probe, so consumers can plot open duration and
     * recovery without inferring it from error-code absence.
     *
     * @see {@link OnCircuitCloseHandler}
     */
    onCircuitClose?: OnCircuitCloseHandler;
    /**
     * Bypass the shared rate-limit pacing deadline recorded by a prior
     * successful response to the same host, so an urgent single request
     * (for example a user-facing lookup during a rate-limited window) is not
     * held hostage by a deadline recorded from an earlier bulk request on
     * the same client. Defaults to `false`; the per-request `signal` is still
     * honored.
     *
     * @see {@link RequestOptions.paceWithRateLimit}
     */
    ignorePaceDeadline?: boolean;
    /**
     * Opt-in in-memory TTL response cache for read-heavy traversals. When
     * set, `GET` responses are cached by `(method, url, serialized body)`
     * for the cache's TTL window so repeated identical reads skip the network
     * round-trip entirely. Mutations (`POST`/`PUT`/`DELETE`) are never cached.
     * Off by default; pass a `ResponseCache` instance to enable.
     *
     * **Privacy:** the cache retains the full response body of every cached
     * `GET` in plaintext for the TTL window, including authenticated
     * user-scoped responses. Entries are scoped by a hash of the bearer
     * token so they never cross identities, but within one identity
     * sensitive payloads are retained. Do not enable for clients that fetch
     * private user data unless the TTL is short and the cache instance is
     * not shared across trust boundaries.
     *
     * @see {@link ResponseCache}
     */
    responseCache?: ResponseCache;
}
