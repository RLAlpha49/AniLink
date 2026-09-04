import http from "node:http";
import https from "node:https";
import { randomInt, randomUUID } from "node:crypto";
import axios, { type AxiosError, type AxiosResponse } from "axios";
import {
    AniLinkApiError,
    AniLinkAuthError,
    AniLinkError,
    AniLinkErrorCodes,
    AniLinkGraphQLError,
    AniLinkNetworkError,
    AniLinkRestError,
    type AniLinkErrorCode,
    type GraphQLUpstreamError,
    type RateLimitInfo,
} from "./AniLinkError";

/**
 * Default maximum time a request may remain in progress, in milliseconds.
 *
 * @see {@link RequestOptions.timeout}
 */
export const DEFAULT_REQUEST_TIMEOUT = 30_000;

/** The maximum time a `Retry-After` header may delay a retry. */
const MAX_RETRY_AFTER_MS = 60_000;

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
export type OnErrorHandler = (error: AniLinkError, context: RequestErrorContext) => void;

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
 * `durationMs` and parsed `rateLimit` headers when present.
 *
 * @see {@link RequestOptions.onResponse}
 */
export type OnResponseHandler = (
    context: RequestContext & { durationMs: number; rateLimit?: RateLimitInfo }
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
}

const DEFAULT_RETRY_POLICY: Required<Pick<RetryPolicy, "jitter">> & RetryPolicy = {
    maxRetries: 3,
    baseDelayMs: 250,
    maxDelayMs: 5_000,
    retryOnStatus: [429, 500, 502, 503, 504],
    retryOnNetworkError: true,
    jitter: true,
};

const defaultHttpAgent = new http.Agent({
    keepAlive: true,
    maxSockets: MAX_SOCKETS,
    maxFreeSockets: MAX_FREE_SOCKETS,
    scheduling: "lifo",
});
const defaultHttpsAgent = new https.Agent({
    keepAlive: true,
    maxSockets: MAX_SOCKETS,
    maxFreeSockets: MAX_FREE_SOCKETS,
    scheduling: "lifo",
});

const axiosClient = axios.create({
    timeout: DEFAULT_REQUEST_TIMEOUT,
    httpAgent: defaultHttpAgent,
    httpsAgent: defaultHttpsAgent,
});

interface ResolvedRequestOptions {
    timeout: number;
    signal?: AbortSignal;
    exposeRawAxiosError: boolean;
    retry: RetryPolicy | null;
    paceWithRateLimit: boolean;
    rateLimitFloor: number;
    circuitBreaker?: { threshold: number; cooldownMs: number };
    retryBudget?: RetryBudget;
    httpAgent: http.Agent;
    httpsAgent: https.Agent;
    onError?: OnErrorHandler;
    onRetry?: OnErrorHandler;
    onRequestStart?: OnRequestStartHandler;
    onResponse?: OnResponseHandler;
    onPace?: OnPaceHandler;
    onHookError?: OnHookErrorHandler;
}

const resolveRetryPolicy = (
    retry: boolean | Partial<RetryPolicy> | undefined
): RetryPolicy | null => {
    if (retry === false) {
        return null;
    }
    if (retry === undefined || retry === true) {
        return { ...DEFAULT_RETRY_POLICY };
    }
    return { ...DEFAULT_RETRY_POLICY, ...retry };
};

/**
 * Builds the keep-alive agents for one request's socket bounds.
 *
 * When the caller leaves `maxSockets`/`maxFreeSockets` unset the shared
 * module-level agents are reused, so the default path allocates nothing and
 * every instance keeps competing for the same warm pool. Supplying either
 * bound constructs dedicated per-request agents, letting high-throughput or
 * multi-provider callers isolate their socket pressure without affecting
 * other clients.
 *
 * @param maxSockets - Upper bound on concurrent sockets, when customized.
 * @param maxFreeSockets - Upper bound on retained idle sockets, when customized.
 * @returns The agents to send the request with.
 */
const resolveAgents = (
    maxSockets: number | undefined,
    maxFreeSockets: number | undefined
): { httpAgent: http.Agent; httpsAgent: https.Agent } => {
    if (maxSockets === undefined && maxFreeSockets === undefined) {
        return { httpAgent: defaultHttpAgent, httpsAgent: defaultHttpsAgent };
    }
    const sockets = Math.max(1, maxSockets ?? MAX_SOCKETS);
    const freeSockets = Math.max(0, maxFreeSockets ?? MAX_FREE_SOCKETS);
    const agentOptions = {
        keepAlive: true,
        maxSockets: sockets,
        maxFreeSockets: freeSockets,
        scheduling: "lifo" as const,
    };
    return {
        httpAgent: new http.Agent(agentOptions),
        httpsAgent: new https.Agent(agentOptions),
    };
};

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
const resolveRequestOptions = (options: RequestOptions = {}): ResolvedRequestOptions => {
    const timeout = options.timeout ?? DEFAULT_REQUEST_TIMEOUT;

    if (!Number.isFinite(timeout) || timeout < 0) {
        throw new TypeError("timeout must be a finite number greater than or equal to 0");
    }

    const agents = resolveAgents(options.maxSockets, options.maxFreeSockets);

    return {
        timeout,
        signal: options.signal,
        exposeRawAxiosError: options.exposeRawAxiosError ?? false,
        retry: resolveRetryPolicy(options.retry),
        paceWithRateLimit: options.paceWithRateLimit ?? true,
        rateLimitFloor: Math.max(1, options.rateLimitFloor ?? 1),
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
    };
};

/**
 * A GraphQL response envelope as returned by the AniList API.
 * The `data` field holds the root selection set of the operation.
 *
 * @see {@link unwrapGraphQLResponse}
 */
export interface GraphQLResponseEnvelope {
    /** Root selection set returned by the operation, when present. */
    data?: unknown;
    /** GraphQL-level failures returned inside the envelope, when present. */
    errors?: GraphQLUpstreamError[];
}

/**
 * Unwraps the single root field of a GraphQL response envelope.
 *
 * The AniList API returns every operation's result inside a `{ data }` envelope.
 * For operations whose selection set has exactly one root field (for example
 * `User`, `Media`, or `MediaListCollection`), this helper returns the bare
 * field value. When the envelope carries zero or multiple root fields, or no
 * `data` object at all, it returns `undefined` so callers can decide what to
 * do with a document whose shape does not match the single-root-field
 * contract.
 *
 * @param response - The full GraphQL response envelope.
 * @returns The bare root-field value, or `undefined` when the document does not have exactly one root field.
 * @see {@link GraphQLResponseEnvelope}
 */
export const unwrapSingleRootField = <T>(response: unknown): T | undefined => {
    const envelope = response as GraphQLResponseEnvelope | null | undefined;
    const queryData = envelope?.data;

    if (!queryData || typeof queryData !== "object") {
        return undefined;
    }

    const fields = Object.keys(queryData);

    if (fields.length === 1) {
        return (queryData as Record<string, T>)[fields[0]];
    }

    return undefined;
};

/**
 * Unwraps a GraphQL response envelope.
 *
 * This is the tolerant wrapper around {@link unwrapSingleRootField} used by
 * the request pipeline. Documents with exactly one root field resolve to the
 * bare field value; documents with multiple root fields (or none) are returned
 * as the full envelope unchanged. All shipped operations are single-root-field,
 * so consumers of typed operations always receive the bare value; only custom
 * multi-field documents surface the envelope shape.
 *
 * An envelope carrying a non-empty `errors` array (an HTTP 200 GraphQL
 * failure) throws an `AniLinkGraphQLError` instead of returning data.
 *
 * @param response - The full GraphQL response envelope.
 * @returns The unwrapped single-root-field value, or the envelope as-is.
 * @throws An `AniLinkGraphQLError` when the envelope carries GraphQL errors.
 * @see {@link GraphQLResponseEnvelope}
 */
export const unwrapGraphQLResponse = <T>(response: unknown): T => {
    const envelope = response as GraphQLResponseEnvelope | null | undefined;

    if (Array.isArray(envelope?.errors) && envelope.errors.length > 0) {
        throw new AniLinkGraphQLError(envelope.errors, envelope?.data);
    }

    return unwrapSingleRootField<T>(response) ?? (response as T);
};

const getRawAxiosError = (resolved: ResolvedRequestOptions, error: unknown): unknown =>
    resolved.exposeRawAxiosError ? error : undefined;

const getRateLimitInfo = (
    headers: Record<string, unknown> | undefined
): RateLimitInfo | undefined => {
    if (!headers) {
        return undefined;
    }

    const limit = Number(headers["x-ratelimit-limit"]);
    const remaining = Number(headers["x-ratelimit-remaining"]);
    const reset = Number(headers["x-ratelimit-reset"]);

    if (![limit, remaining, reset].every(Number.isFinite)) {
        return undefined;
    }

    return { limit, remaining, reset };
};

const normalizeAxiosError = (
    resolved: ResolvedRequestOptions,
    error: AxiosError,
    isRestCall = false
): AniLinkError => {
    if (axios.isCancel(error)) {
        return new AniLinkNetworkError(
            AniLinkErrorCodes.ABORTED,
            "The request was cancelled.",
            getRawAxiosError(resolved, error)
        );
    }

    if (error.response?.status !== undefined) {
        const status = error.response.status;
        const data = error.response.data;
        const rawAxiosError = getRawAxiosError(resolved, error);
        const options = { rateLimit: getRateLimitInfo(error.response.headers) };
        return isRestCall
            ? new AniLinkRestError(status, data, rawAxiosError, options)
            : new AniLinkApiError(status, data, rawAxiosError, options);
    }

    if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT") {
        return new AniLinkNetworkError(
            AniLinkErrorCodes.TIMEOUT,
            "The request timed out.",
            getRawAxiosError(resolved, error),
            resolved.timeout > 0 ? { timeoutMs: resolved.timeout } : undefined
        );
    }

    return new AniLinkNetworkError(
        AniLinkErrorCodes.NETWORK,
        "The request failed due to a network error.",
        getRawAxiosError(resolved, error)
    );
};

const normalizeRequestError = (
    resolved: ResolvedRequestOptions,
    error: unknown,
    isRestCall = false
): AniLinkError => {
    if (error instanceof AniLinkError) {
        return error;
    }

    if (axios.isAxiosError(error)) {
        return normalizeAxiosError(resolved, error, isRestCall);
    }

    return new AniLinkError(
        "The request failed.",
        AniLinkErrorCodes.UNKNOWN,
        getRawAxiosError(resolved, error)
    );
};

export const parseRetryAfter = (header: string | undefined, now: number): number | null => {
    if (header === undefined || header === null || header === "") {
        return null;
    }

    const seconds = Number(header);
    if (Number.isFinite(seconds) && seconds >= 0) {
        return Math.min(seconds * 1000, MAX_RETRY_AFTER_MS);
    }

    const date = Date.parse(header);
    if (Number.isFinite(date)) {
        return Math.max(0, Math.min(date - now, MAX_RETRY_AFTER_MS));
    }

    return null;
};

const getRetryAfterDelay = (error: unknown): number | null => {
    if (axios.isAxiosError(error)) {
        const header = error.response?.headers?.["retry-after"];
        if (typeof header === "string" || header === undefined) {
            return parseRetryAfter(header, Date.now());
        }
    }
    return null;
};

/**
 * Computes the raw exponential backoff cap for an attempt.
 *
 * @param attempt - The zero-based index of the attempt that just failed.
 * @param policy - The active retry policy.
 * @returns The un-jittered delay cap in milliseconds.
 */
export const getBackoffDelay = (attempt: number, policy: RetryPolicy): number =>
    Math.min(policy.baseDelayMs * 2 ** attempt, policy.maxDelayMs);

/**
 * Applies full jitter to a computed backoff cap: the returned wait is a
 * uniformly random value in `[0, cap]`, which spreads out retries from
 * concurrent clients instead of synchronizing them.
 *
 * @param cap - The un-jittered delay cap in milliseconds.
 * @param policy - The active retry policy.
 * @returns The delay to wait before the next retry, in milliseconds.
 */
export const applyJitter = (cap: number, policy: RetryPolicy): number =>
    policy.jitter === false ? cap : randomInt(0, cap + 1);

/**
 * Computes the delay before the next retry, or `null` when the request should
 * not be retried. `Retry-After` delays are returned un-jittered because the
 * server dictates them.
 */
const getRetryDelay = (
    error: AniLinkError,
    rawError: unknown,
    attempt: number,
    policy: RetryPolicy
): number | null => {
    if (attempt >= policy.maxRetries) {
        return null;
    }

    if (error instanceof AniLinkApiError) {
        if (error.status === 429) {
            return (
                getRetryAfterDelay(rawError) ??
                applyJitter(getBackoffDelay(attempt, policy), policy)
            );
        }
        if (policy.retryOnStatus.includes(error.status)) {
            return applyJitter(getBackoffDelay(attempt, policy), policy);
        }
        return null;
    }

    if (error instanceof AniLinkNetworkError) {
        if (error.code === AniLinkErrorCodes.ABORTED) {
            return null;
        }
        if (policy.retryOnNetworkError) {
            return applyJitter(getBackoffDelay(attempt, policy), policy);
        }
    }

    return null;
};

const sleep = (ms: number, signal?: AbortSignal): Promise<void> =>
    new Promise((resolve, reject) => {
        const timeout: NodeJS.Timeout = setTimeout(() => {
            signal?.removeEventListener("abort", abort);
            resolve();
        }, ms);

        const abort = (): void => {
            clearTimeout(timeout);
            reject(
                new AniLinkNetworkError(AniLinkErrorCodes.ABORTED, "The request was cancelled.")
            );
        };

        if (signal?.aborted) {
            abort();
            return;
        }
        signal?.addEventListener("abort", abort, { once: true });
    });

interface ExecuteOptions {
    url: string;
    method: HttpMethod;
    data?: object;
    headers: Record<string, string>;
}

/**
 * Invokes a user-supplied lifecycle hook without letting its exceptions
 * escape into the request pipeline. A throwing hook is reported through the
 * configured `onHookError` callback (falling back to a console warning) and
 * otherwise ignored: it must not crash the request, be counted as an attempt,
 * or distort retry and error classification.
 *
 * @param hook - The hook callback, if configured.
 * @param name - The hook's option name, used in the report.
 * @param onHookError - Consumer callback observing hook failures, when configured.
 * @param args - Arguments forwarded verbatim to the hook.
 */
const safeInvoke = (
    hook: ((...args: never[]) => void) | undefined,
    name: string,
    onHookError: OnHookErrorHandler | undefined,
    ...args: unknown[]
): void => {
    if (hook === undefined) {
        return;
    }
    try {
        (hook as (...hookArgs: unknown[]) => void)(...args);
    } catch (hookError: unknown) {
        if (onHookError !== undefined) {
            try {
                onHookError(name, hookError);
            } catch {
                // A failing observer must never break the request pipeline.
            }
            return;
        }
        console.warn(
            `[AniLink] ${name} hook threw and was ignored:`,
            hookError instanceof Error ? hookError.message : hookError
        );
    }
};

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

interface CircuitState {
    consecutiveFailures: number;
    openedAt: number | null;
    probeInFlight: boolean;
}

/**
 * Shared retry-budget state, keyed on a stable per-client owner like
 * {@link circuitStates}. Only populated when a request opts in via
 * `retryBudget`.
 *
 * @see {@link RetryBudget}
 */
interface RetryBudgetState {
    /** Retries spent in the current window. */
    retriesUsed: number;
    /** Epoch milliseconds at which the current window ends and resets. */
    windowEndsAt: number;
}

const retryBudgetStates = new WeakMap<object, RetryBudgetState>();

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
 * Records the rate-limit reset deadline for the caller's owner and host so
 * the next dispatch through {@link awaitPaceDeadline} waits for it. A later
 * (smaller) deadline replaces an earlier one; a deadline at or before now is
 * cleared so a healthy window does not stall subsequent requests.
 *
 * @param owner - The caller's stable transport-settings object.
 * @param host - The upstream host the deadline applies to.
 * @param deadlineMs - The epoch millisecond at which the window resets.
 */
const recordPaceDeadline = (owner: object, host: string, deadlineMs: number): void => {
    let scopes = paceDeadlines.get(owner);
    if (scopes === undefined) {
        scopes = new Map();
        paceDeadlines.set(owner, scopes);
    }
    if (deadlineMs <= Date.now()) {
        scopes.delete(host);
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
const awaitPaceDeadline = async (
    owner: object | undefined,
    host: string,
    resolved: ResolvedRequestOptions,
    hookContext: RequestContext
): Promise<void> => {
    if (owner === undefined || !resolved.paceWithRateLimit) {
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
    try {
        await sleep(delayMs, resolved.signal);
    } catch (error: unknown) {
        if (
            error instanceof AniLinkNetworkError &&
            error.code === AniLinkErrorCodes.ABORTED &&
            !axios.isCancel(error)
        ) {
            throw new AniLinkNetworkError(
                AniLinkErrorCodes.ABORTED,
                "The request was cancelled while waiting for the rate-limit window to reset.",
                undefined,
                { abortedDuringPacing: true }
            );
        }
        throw error;
    }
};

/**
 * Returns the live retry-budget window for the caller, rolling it forward to
 * a fresh window when the previous one has elapsed.
 *
 * @param owner - The caller's transport-settings object.
 * @param budget - The configured budget, when enabled.
 * @returns The mutable budget state, or `undefined` when the budget is disabled.
 */
const getRetryBudgetState = (
    owner: object | undefined,
    budget: RetryBudget | undefined
): RetryBudgetState | undefined => {
    if (owner === undefined || budget === undefined) {
        return undefined;
    }
    let state = retryBudgetStates.get(owner);
    if (state === undefined) {
        state = { retriesUsed: 0, windowEndsAt: 0 };
        retryBudgetStates.set(owner, state);
    }
    if (Date.now() >= state.windowEndsAt) {
        state.retriesUsed = 0;
        state.windowEndsAt = Date.now() + budget.windowMs;
    }
    return state;
};

/**
 * Extracts the upstream identity for breaker scoping from a request URL.
 * Falls back to the empty string when the URL cannot be parsed, which keeps
 * such requests sharing one bucket without failing the call.
 */
const circuitScopeOf = (url: string): string => {
    try {
        return new URL(url).host;
    } catch {
        return "";
    }
};

const getCircuitState = (owner: object, scope: string): CircuitState => {
    let scopes = circuitStates.get(owner);
    if (scopes === undefined) {
        scopes = new Map();
        circuitStates.set(owner, scopes);
    }
    let state = scopes.get(scope);
    if (state === undefined) {
        state = { consecutiveFailures: 0, openedAt: null, probeInFlight: false };
        scopes.set(scope, state);
    }
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
const checkCircuitOpen = (
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
 * the breaker.
 */
const recordCircuitSuccess = (circuit: CircuitState | undefined): void => {
    if (circuit !== undefined) {
        circuit.probeInFlight = false;
        circuit.consecutiveFailures = 0;
    }
};

/**
 * Counts a failed attempt and opens the circuit once the consecutive-failure
 * budget is exhausted. When the failure is the reserved post-cooldown probe,
 * clears the half-open state and re-opens the breaker immediately so the next
 * request fast-fails until the cooldown elapses again.
 */
const recordCircuitFailure = (
    circuit: CircuitState | undefined,
    breaker: { threshold: number; cooldownMs: number } | undefined
): void => {
    if (circuit === undefined || breaker === undefined) {
        return;
    }
    if (circuit.probeInFlight) {
        circuit.probeInFlight = false;
        circuit.openedAt = Date.now();
        return;
    }
    circuit.consecutiveFailures += 1;
    if (circuit.consecutiveFailures >= breaker.threshold) {
        circuit.openedAt = Date.now();
    }
};

/**
 * Builds the context object handed to the error lifecycle hooks.
 *
 * @param requestId - The correlation ID of the logical request.
 * @param url - The URL the request was sent to.
 * @param method - The HTTP method of the request.
 * @param attempt - The 1-based attempt number.
 * @param normalized - The normalized failure for the attempt.
 * @param nextDelayMs - The scheduled retry delay, when the failure will be retried.
 * @returns The populated hook context.
 */
const buildErrorContext = (
    requestId: string,
    url: string,
    method: HttpMethod,
    attempt: number,
    normalized: AniLinkError,
    nextDelayMs?: number
): RequestErrorContext => ({
    requestId,
    url,
    method,
    attempt,
    code: normalized.code,
    ...(normalized instanceof AniLinkApiError ? { status: normalized.status } : {}),
    ...(normalized instanceof AniLinkApiError && normalized.rateLimit !== undefined
        ? { rateLimit: normalized.rateLimit }
        : {}),
    ...(nextDelayMs === undefined ? {} : { nextDelayMs }),
});

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
const paceAfterSuccess = async (
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
        const deadlineMs = info.reset * 1000;
        const delayMs = Math.max(0, deadlineMs - Date.now());
        if (owner !== undefined && host !== undefined) {
            recordPaceDeadline(owner, host, deadlineMs);
        }
        safeInvoke(resolved.onPace, "onPace", resolved.onHookError, { ...hookContext, delayMs });
        try {
            await sleep(delayMs, resolved.signal);
        } catch (error: unknown) {
            if (
                error instanceof AniLinkNetworkError &&
                error.code === AniLinkErrorCodes.ABORTED &&
                !axios.isCancel(error)
            ) {
                throw new AniLinkNetworkError(
                    AniLinkErrorCodes.ABORTED,
                    "The request was cancelled while waiting for the rate-limit window to reset.",
                    undefined,
                    { abortedDuringPacing: true }
                );
            }
            throw error;
        }
    }
};

/**
 * Reports a failed attempt through the error hooks. A retryable failure goes
 * to `onRetry` (falling back to `onError`) with the scheduled delay; a
 * terminal failure goes to `onError` only.
 */
const reportFailure = (
    requestId: string,
    url: string,
    method: HttpMethod,
    attempt: number,
    normalized: AniLinkError,
    resolved: ResolvedRequestOptions,
    nextDelayMs?: number
): void => {
    const context = buildErrorContext(requestId, url, method, attempt, normalized, nextDelayMs);
    if (nextDelayMs !== undefined) {
        safeInvoke(
            resolved.onRetry ?? resolved.onError,
            resolved.onRetry === undefined ? "onError" : "onRetry",
            resolved.onHookError,
            normalized,
            context
        );
        return;
    }
    safeInvoke(resolved.onError, "onError", resolved.onHookError, normalized, context);
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
const isPacingAbort = (resolved: ResolvedRequestOptions, error: unknown): boolean =>
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
const rethrowIfPacingAbort = (resolved: ResolvedRequestOptions, error: unknown): void => {
    if (isPacingAbort(resolved, error)) {
        throw error;
    }
};

const executeWithRetry = async <T>(
    options: ExecuteOptions,
    resolved: ResolvedRequestOptions,
    stateOwner?: object,
    rawPassthrough = false
): Promise<T> => {
    const { url, method, data, headers } = options;
    const policy = resolved.retry;
    const host = circuitScopeOf(url);
    const circuit =
        resolved.circuitBreaker !== undefined && stateOwner !== undefined
            ? getCircuitState(stateOwner, host)
            : undefined;
    const budgetState = getRetryBudgetState(stateOwner, resolved.retryBudget);
    // Correlation ID joining every lifecycle hook emission for this logical
    // request (including across retries) in a metrics or logging backend.
    const requestId = randomUUID();
    let attempt = 0;

    for (;;) {
        const startedAt = Date.now();
        const hookContext = { requestId, url, method, attempt: attempt + 1 };
        const circuitError = checkCircuitOpen(circuit, resolved.circuitBreaker);
        if (circuitError !== undefined) {
            // A fast-failed request still emits the start/error hook pair so
            // request-volume counters and error-rate dashboards do not
            // undercount while the breaker is open. The failure is not an
            // attempt outcome, so it bypasses failure accounting and retry.
            safeInvoke(
                resolved.onRequestStart,
                "onRequestStart",
                resolved.onHookError,
                hookContext
            );
            safeInvoke(
                resolved.onError,
                "onError",
                resolved.onHookError,
                circuitError,
                buildErrorContext(requestId, url, method, attempt + 1, circuitError)
            );
            throw circuitError;
        }
        // Gate the dispatch on any shared rate-limit reset deadline recorded
        // by a prior successful response to this host, so independently
        // dispatched requests wait for the window to reset *before* they are
        // sent rather than only pacing the response that observed the low
        // quota. A pacing abort here propagates before any attempt is sent,
        // so it neither fires `onResponse` nor counts as a circuit failure.
        // If a post-cooldown probe was reserved by `checkCircuitOpen`, the
        // abort releases it (re-opening the breaker) so the half-open state
        // is not left dangling.
        try {
            await awaitPaceDeadline(stateOwner, host, resolved, hookContext);
        } catch (paceError) {
            if (circuit !== undefined && circuit.probeInFlight) {
                circuit.probeInFlight = false;
                circuit.openedAt = Date.now();
            }
            throw paceError;
        }
        safeInvoke(resolved.onRequestStart, "onRequestStart", resolved.onHookError, hookContext);
        // Tracks whether onResponse has already fired for this attempt so a
        // failure surfaced after the success-path emission (for example an
        // AniLinkGraphQLError thrown while unwrapping a 200 envelope, or a
        // pacing-wait abort) does not emit onResponse a second time. Each
        // attempt emits onResponse at most once.
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
            safeInvoke(resolved.onResponse, "onResponse", resolved.onHookError, {
                ...hookContext,
                durationMs: Date.now() - startedAt,
                ...(rateLimit !== undefined ? { rateLimit } : {}),
            });
            responseReported = true;
            recordCircuitSuccess(circuit);
            await paceAfterSuccess(response, resolved, hookContext, rateLimit, stateOwner, host);
            return rawPassthrough ? (response.data as T) : unwrapGraphQLResponse<T>(response.data);
        } catch (error: unknown) {
            // A pacing-wait abort is not an attempt outcome: it must neither
            // re-fire onResponse for the finished attempt nor count as a
            // circuit failure, so it bypasses the failure accounting below.
            rethrowIfPacingAbort(resolved, error);
            // Emit onResponse only when the success path did not already fire
            // it (a transport failure). A failure surfaced after the success
            // emission — an AniLinkGraphQLError from envelope unwrapping, or a
            // pacing-wait abort rethrown above — must not emit a second time.
            if (!responseReported) {
                safeInvoke(resolved.onResponse, "onResponse", resolved.onHookError, {
                    ...hookContext,
                    durationMs: Date.now() - startedAt,
                });
            }
            const normalized = normalizeRequestError(resolved, error, rawPassthrough);
            recordCircuitFailure(circuit, resolved.circuitBreaker);
            const delay =
                policy === null || budgetState === undefined
                    ? policy === null
                        ? null
                        : getRetryDelay(normalized, error, attempt, policy)
                    : budgetState.retriesUsed >= resolved.retryBudget!.maxRetriesPerWindow
                      ? null // budget exhausted: surface the failure without retrying
                      : getRetryDelay(normalized, error, attempt, policy);
            if (delay !== null && budgetState !== undefined) {
                budgetState.retriesUsed += 1;
            }
            reportFailure(
                requestId,
                url,
                method,
                attempt + 1,
                normalized,
                resolved,
                delay ?? undefined
            );
            if (delay === null) {
                throw normalized;
            }
            attempt += 1;
            await sleep(delay, resolved.signal);
        }
    }
};

/**
 * Trailing options for {@link sendRequest}, replacing the former positional
 * rest tuple so call sites name their arguments and new options can be added
 * without reordering.
 *
 * @see {@link sendRequest}
 */
export interface SendRequestOptions {
    /** Whether the operation requires an authentication token; the request fails fast with an {@link AniLinkAuthError} when set and no auth material is configured. */
    requiresAuth?: boolean;
    /** Per-request {@link RequestOptions}; when omitted, library defaults apply (30 second timeout, automatic retries under the default policy, proactive rate-limit pacing, no hooks). */
    options?: RequestOptions;
    /** Optional operation name included in missing-token auth errors. */
    operation?: string;
    /**
     * Optional `Content-Type` override for non-GraphQL endpoints — for example
     * form-urlencoded OAuth token requests, or `application/json` for REST
     * calls — which also returns the parsed body verbatim instead of
     * unwrapping a GraphQL envelope and classifies HTTP failures as
     * {@link AniLinkRestError}.
     */
    contentType?: string;
    /**
     * Stable per-client object used to key cross-request transport state (the
     * circuit breaker and retry budget). Operation dispatch passes the
     * operation instance; direct callers that reuse one transport-settings
     * object can omit this, in which case the `circuitBreaker`/
     * `retryBudget` configuration object itself keys the state. Passing a
     * fresh object per request prevents breaker state from ever accumulating.
     */
    stateOwner?: object;
}

/**
 * Sends a request to the specified URL.
 *
 * This is the provider-agnostic transport entry point. GraphQL callers get
 * envelope unwrapping by leaving `contentType` unset; REST callers pass an
 * explicit `contentType` (for example `application/json`) and receive the
 * parsed body verbatim. HTTP failures on REST calls surface as
 * {@link AniLinkRestError}; GraphQL calls surface as {@link AniLinkApiError}.
 *
 * @typeParam T - The expected response payload type.
 * @param url - The URL to send the request to.
 * @param method - The HTTP method to use ('GET', 'POST', 'PUT', or 'DELETE').
 * @param data - The data to send with the request.
 * @param auth - The authentication material to include in the request headers. A string is treated as a bearer token for backwards compatibility.
 * @param sendOptions - Named trailing options; see {@link SendRequestOptions}.
 * @returns The unwrapped response data. For documents with a single root
 * field this is the bare field value; multi-root-field (or zero-root-field)
 * documents are returned as the full `{ data }` envelope unchanged. Use
 * {@link unwrapGraphQLResponse} for the tolerant rule or
 * {@link unwrapSingleRootField} when a caller needs the strict single-root-field
 * result (`undefined` signals the document did not match). With a `contentType`
 * override, the parsed response body is returned as-is.
 * @throws `AniLinkAuthError` when authentication is required but no auth material is configured.
 * @throws `AniLinkApiError` for an upstream HTTP failure.
 * @throws `AniLinkGraphQLError` for GraphQL errors in an HTTP 200 envelope.
 * @throws `AniLinkNetworkError` for network, timeout, cancellation, or circuit-breaker failures.
 * @see {@link RequestOptions}
 * @see {@link SendRequestOptions}
 */
export const sendRequest = async <T = unknown>(
    url: string,
    method: HttpMethod,
    data?: object,
    auth?: RequestAuthInput,
    sendOptions?: SendRequestOptions
): Promise<T> => {
    const { requiresAuth = false, options, operation, contentType, stateOwner } = sendOptions ?? {};
    const resolvedAuth: RequestAuth | undefined = typeof auth === "string" ? { token: auth } : auth;
    const hasBearerToken = resolvedAuth?.token !== undefined && resolvedAuth.token !== "";
    const hasAuthorizationHeader = Object.entries(resolvedAuth?.headers ?? {}).some(
        ([key, value]) => key.toLowerCase() === "authorization" && value !== ""
    );
    const hasAuthMaterial = hasBearerToken || hasAuthorizationHeader;

    if (requiresAuth && !hasAuthMaterial) {
        throw new AniLinkAuthError(operation);
    }

    const headers: Record<string, string> =
        contentType === undefined
            ? {
                  "Content-Type": "application/json",
                  Accept: "application/json",
              }
            : { "Content-Type": contentType };

    Object.assign(headers, resolvedAuth?.headers);

    if (hasBearerToken && !hasAuthorizationHeader) {
        headers.Authorization = `Bearer ${resolvedAuth.token}`;
    }

    const result = await executeWithRetry<unknown>(
        { url, method, data, headers },
        resolveRequestOptions(options),
        stateOwner ?? options,
        contentType !== undefined
    );
    return result as T;
};
