import http from "node:http";
import https from "node:https";
import { randomInt } from "node:crypto";
import axios, { type AxiosError, type AxiosResponse } from "axios";
import {
    AniLinkApiError,
    AniLinkAuthError,
    AniLinkError,
    AniLinkErrorCodes,
    AniLinkGraphQLError,
    AniLinkNetworkError,
    type AniLinkErrorCode,
    type GraphQLUpstreamError,
    type RateLimitInfo,
} from "./AniLinkError";

/** The default maximum time a request may remain in progress. */
export const DEFAULT_REQUEST_TIMEOUT = 30_000;

/** The maximum time a `Retry-After` header may delay a retry. */
const MAX_RETRY_AFTER_MS = 60_000;

/** Socket bounds for the shared keep-alive agents (see `MAX_SOCKETS`). */
const MAX_FREE_SOCKETS = 5;

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
const MAX_SOCKETS = 20;

/**
 * Retry policy for transient transport failures.
 *
 * Delays between retries use exponential backoff with full jitter by default:
 * each wait is a random value between `0` and the computed exponential cap so
 * concurrent clients do not synchronize their retries (thundering herd).
 * Server-dictated `Retry-After` delays are never jittered.
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
 */
export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

/** Authentication material a provider can apply to an HTTP request. */
export interface RequestAuth {
    /** A bearer token, when the provider uses bearer authentication. */
    readonly token?: string;
    /** Explicit headers for schemes such as Basic auth or provider API keys. */
    readonly headers?: Readonly<Record<string, string>>;
}

/** Legacy string tokens and structured provider authentication accepted by transport. */
export type RequestAuthInput = string | RequestAuth;

/** Context passed to the request lifecycle hooks for a single attempt. */
export interface RequestErrorContext {
    /** The URL the request was sent to. */
    url: string;
    /** The HTTP method of the request. */
    method: HttpMethod;
    /** The 1-based attempt that failed. */
    attempt: number;
    /** The stable code of the normalized failure. */
    code: AniLinkErrorCode;
    /** The HTTP status when the failure came from an API response. */
    status?: number;
    /** The delay before the next retry, when the failure will be retried. */
    nextDelayMs?: number;
}

/** A callback invoked when an attempt fails, before each retry wait and once more when retries are exhausted. */
export type OnErrorHandler = (error: AniLinkError, context: RequestErrorContext) => void;

/** Context passed to the `onRequestStart` hook just before an attempt is sent. */
export interface RequestContext {
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
 */
export type OnRequestStartHandler = (context: RequestContext) => void;

/**
 * A callback invoked after each attempt completes, whether it succeeded or
 * failed. The elapsed wall-clock time of the attempt is reported as
 * `durationMs`, making this the natural point for latency metrics.
 */
export type OnResponseHandler = (context: RequestContext & { durationMs: number }) => void;

/**
 * Transport settings shared by the AniLink request operations.
 *
 * Pass these as the second argument of the `AniLink` constructor; they apply
 * per instance and never leak across clients.
 */
export interface RequestOptions {
    /** Milliseconds before a request is aborted. `0` disables the Axios timeout. Defaults to 30 seconds; timeout errors carry the effective duration as `timeoutMs`. */
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
     * window resets instead of discovering the limit via a `429`. Off by default.
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
    /** Invoked when an attempt fails, and once more when retries are exhausted. */
    onError?: OnErrorHandler;
    /** Invoked before each retry wait with the scheduled delay in `nextDelayMs`. Falls back to per-attempt `onError` calls when unset. */
    onRetry?: OnErrorHandler;
    /** Invoked just before each attempt is sent. */
    onRequestStart?: OnRequestStartHandler;
    /** Invoked after each attempt completes with the elapsed `durationMs`. */
    onResponse?: OnResponseHandler;
}

const DEFAULT_RETRY_POLICY: Required<Pick<RetryPolicy, "jitter">> & RetryPolicy = {
    maxRetries: 3,
    baseDelayMs: 250,
    maxDelayMs: 5_000,
    retryOnStatus: [429, 500, 502, 503, 504],
    retryOnNetworkError: true,
    jitter: true,
};

const axiosClient = axios.create({
    timeout: DEFAULT_REQUEST_TIMEOUT,
    httpAgent: new http.Agent({
        keepAlive: true,
        maxSockets: MAX_SOCKETS,
        maxFreeSockets: MAX_FREE_SOCKETS,
        scheduling: "lifo",
    }),
    httpsAgent: new https.Agent({
        keepAlive: true,
        maxSockets: MAX_SOCKETS,
        maxFreeSockets: MAX_FREE_SOCKETS,
        scheduling: "lifo",
    }),
});

interface ResolvedRequestOptions {
    timeout: number;
    signal?: AbortSignal;
    exposeRawAxiosError: boolean;
    retry: RetryPolicy | null;
    paceWithRateLimit: boolean;
    rateLimitFloor: number;
    circuitBreaker?: { threshold: number; cooldownMs: number };
    onError?: OnErrorHandler;
    onRetry?: OnErrorHandler;
    onRequestStart?: OnRequestStartHandler;
    onResponse?: OnResponseHandler;
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

    return {
        timeout,
        signal: options.signal,
        exposeRawAxiosError: options.exposeRawAxiosError ?? false,
        retry: resolveRetryPolicy(options.retry),
        paceWithRateLimit: options.paceWithRateLimit ?? false,
        rateLimitFloor: Math.max(1, options.rateLimitFloor ?? 1),
        circuitBreaker: options.circuitBreaker,
        onError: options.onError,
        onRetry: options.onRetry,
        onRequestStart: options.onRequestStart,
        onResponse: options.onResponse,
    };
};

/**
 * A GraphQL response envelope as returned by the AniList API.
 * The `data` field holds the root selection set of the operation.
 */
export interface GraphQLResponseEnvelope {
    data?: unknown;
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
 * failure) throws an {@link AniLinkGraphQLError} instead of returning data.
 *
 * @param response - The full GraphQL response envelope.
 * @returns The unwrapped single-root-field value, or the envelope as-is.
 * @throws An {@link AniLinkGraphQLError} when the envelope carries GraphQL errors.
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

const normalizeAxiosError = (resolved: ResolvedRequestOptions, error: AxiosError): AniLinkError => {
    if (axios.isCancel(error)) {
        return new AniLinkNetworkError(
            AniLinkErrorCodes.ABORTED,
            "The request was cancelled.",
            getRawAxiosError(resolved, error)
        );
    }

    if (error.response?.status !== undefined) {
        return new AniLinkApiError(
            error.response.status,
            error.response.data,
            getRawAxiosError(resolved, error),
            { rateLimit: getRateLimitInfo(error.response.headers) }
        );
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

const normalizeRequestError = (resolved: ResolvedRequestOptions, error: unknown): AniLinkError => {
    if (error instanceof AniLinkError) {
        return error;
    }

    if (axios.isAxiosError(error)) {
        return normalizeAxiosError(resolved, error);
    }

    return new AniLinkError(
        "The request failed.",
        AniLinkErrorCodes.UNKNOWN,
        getRawAxiosError(resolved, error)
    );
};

const parseRetryAfter = (header: string | undefined, now: number): number | null => {
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
const getBackoffDelay = (attempt: number, policy: RetryPolicy): number =>
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
const applyJitter = (cap: number, policy: RetryPolicy): number =>
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
 * escape into the request pipeline. A throwing hook is reported as a console
 * warning and otherwise ignored: it must not crash the request, be counted as
 * an attempt, or distort retry and error classification.
 *
 * @param hook - The hook callback, if configured.
 * @param name - The hook's option name, used in the warning.
 * @param args - Arguments forwarded verbatim to the hook.
 */
const safeInvoke = (
    hook: ((...args: never[]) => void) | undefined,
    name: string,
    ...args: unknown[]
): void => {
    if (hook === undefined) {
        return;
    }
    try {
        (hook as (...hookArgs: unknown[]) => void)(...args);
    } catch (hookError: unknown) {
        console.warn(
            `[AniLink] ${name} hook threw and was ignored:`,
            hookError instanceof Error ? hookError.message : hookError
        );
    }
};

/**
 * Shared circuit-breaker state, keyed first by the caller's transport-settings
 * object (so concurrent `AniLink` clients never trip each other's breaker)
 * and then by the upstream host (so one provider's outage cannot fast-fail
 * another provider's requests on a multi-API client). Only populated when a
 * request opts in via `circuitBreaker`; disabled configurations allocate
 * nothing.
 */
const circuitStates = new WeakMap<object, Map<string, CircuitState>>();

interface CircuitState {
    consecutiveFailures: number;
    openedAt: number | null;
}

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
        state = { consecutiveFailures: 0, openedAt: null };
        scopes.set(scope, state);
    }
    return state;
};

/**
 * Fast-fails while the circuit is open and clears the open state once the
 * cooldown has elapsed so the next attempt can probe the upstream again.
 *
 * @param circuit - The caller's breaker state, when the breaker is enabled.
 * @param breaker - The breaker configuration, when enabled.
 * @throws An {@link AniLinkNetworkError} with code `CIRCUIT_OPEN_ERROR` while the cooldown is still running.
 */
const throwIfCircuitOpen = (
    circuit: CircuitState | undefined,
    breaker: { threshold: number; cooldownMs: number } | undefined
): void => {
    if (circuit === undefined || breaker === undefined || circuit.openedAt === null) {
        return;
    }
    if (Date.now() - circuit.openedAt < breaker.cooldownMs) {
        throw new AniLinkNetworkError(
            AniLinkErrorCodes.CIRCUIT,
            `The request failed fast: the circuit breaker is open after ${breaker.threshold} consecutive failures. Retrying is possible after the cooldown elapses.`
        );
    }
    // Cooldown elapsed: allow the next attempt through as the probe.
    circuit.openedAt = null;
};

/** Resets the failure streak after a successful attempt. */
const recordCircuitSuccess = (circuit: CircuitState | undefined): void => {
    if (circuit !== undefined) {
        circuit.consecutiveFailures = 0;
    }
};

/**
 * Counts a failed attempt and opens the circuit once the consecutive-failure
 * budget is exhausted.
 */
const recordCircuitFailure = (
    circuit: CircuitState | undefined,
    breaker: { threshold: number; cooldownMs: number } | undefined
): void => {
    if (circuit === undefined || breaker === undefined) {
        return;
    }
    circuit.consecutiveFailures += 1;
    if (circuit.consecutiveFailures >= breaker.threshold) {
        circuit.openedAt = Date.now();
    }
};

/**
 * Builds the context object handed to the request lifecycle hooks.
 *
 * @param url - The URL the request was sent to.
 * @param method - The HTTP method of the request.
 * @param attempt - The 1-based attempt number.
 * @param normalized - The normalized failure for the attempt.
 * @param nextDelayMs - The scheduled retry delay, when the failure will be retried.
 * @returns The populated hook context.
 */
const buildErrorContext = (
    url: string,
    method: HttpMethod,
    attempt: number,
    normalized: AniLinkError,
    nextDelayMs?: number
): RequestErrorContext => ({
    url,
    method,
    attempt,
    code: normalized.code,
    ...(normalized instanceof AniLinkApiError ? { status: normalized.status } : {}),
    ...(nextDelayMs === undefined ? {} : { nextDelayMs }),
});

/**
 * Applies opt-in rate-limit pacing after a successful response: when the
 * reported remaining quota drops below the configured floor, waits until the
 * window resets before the caller proceeds.
 */
const paceAfterSuccess = async (
    response: AxiosResponse,
    resolved: ResolvedRequestOptions
): Promise<void> => {
    if (!resolved.paceWithRateLimit) {
        return;
    }
    const info = getRateLimitInfo(response.headers as Record<string, unknown>);
    if (info !== undefined && info.remaining < resolved.rateLimitFloor) {
        await sleep(Math.max(0, info.reset * 1000 - Date.now()), resolved.signal);
    }
};

/**
 * Reports a failed attempt through the error hooks. A retryable failure goes
 * to `onRetry` (falling back to `onError`) with the scheduled delay; a
 * terminal failure goes to `onError` only.
 */
const reportFailure = (
    url: string,
    method: HttpMethod,
    attempt: number,
    normalized: AniLinkError,
    resolved: ResolvedRequestOptions,
    nextDelayMs?: number
): void => {
    const context = buildErrorContext(url, method, attempt, normalized, nextDelayMs);
    if (nextDelayMs !== undefined) {
        safeInvoke(
            resolved.onRetry ?? resolved.onError,
            resolved.onRetry === undefined ? "onError" : "onRetry",
            normalized,
            context
        );
        return;
    }
    safeInvoke(resolved.onError, "onError", normalized, context);
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
    stateKey?: object,
    rawPassthrough = false
): Promise<T> => {
    const { url, method, data, headers } = options;
    const policy = resolved.retry;
    const circuit =
        resolved.circuitBreaker !== undefined && stateKey !== undefined
            ? getCircuitState(stateKey, circuitScopeOf(url))
            : undefined;
    let attempt = 0;

    for (;;) {
        throwIfCircuitOpen(circuit, resolved.circuitBreaker);

        const startedAt = Date.now();
        const hookContext = { url, method, attempt: attempt + 1 };
        safeInvoke(resolved.onRequestStart, "onRequestStart", hookContext);
        try {
            const response: AxiosResponse = await axiosClient({
                url,
                method,
                data,
                headers,
                timeout: resolved.timeout,
                signal: resolved.signal,
            });
            safeInvoke(resolved.onResponse, "onResponse", {
                ...hookContext,
                durationMs: Date.now() - startedAt,
            });
            recordCircuitSuccess(circuit);
            await paceAfterSuccess(response, resolved);
            return rawPassthrough ? (response.data as T) : unwrapGraphQLResponse<T>(response.data);
        } catch (error: unknown) {
            // A pacing-wait abort is not an attempt outcome: it must neither
            // re-fire onResponse for the finished attempt nor count as a
            // circuit failure, so it bypasses the failure accounting below.
            rethrowIfPacingAbort(resolved, error);
            safeInvoke(resolved.onResponse, "onResponse", {
                ...hookContext,
                durationMs: Date.now() - startedAt,
            });
            const normalized = normalizeRequestError(resolved, error);
            recordCircuitFailure(circuit, resolved.circuitBreaker);
            const delay =
                policy === null ? null : getRetryDelay(normalized, error, attempt, policy);
            reportFailure(url, method, attempt + 1, normalized, resolved, delay ?? undefined);
            if (delay === null) {
                throw normalized;
            }
            attempt += 1;
            await sleep(delay, resolved.signal);
        }
    }
};

/**
 * Sends a request to the specified URL.
 *
 * This is the provider-agnostic transport entry point. GraphQL callers get
 * envelope unwrapping by leaving `contentType` unset; REST callers pass an
 * explicit `contentType` (for example `application/json`) and receive the
 * parsed body verbatim.
 *
 * @param url - The URL to send the request to.
 * @param method - The HTTP method to use ('GET', 'POST', 'PUT', or 'DELETE').
 * @param data - The data to send with the request.
 * @param auth - The authentication material to include in the request headers. A string is treated as a bearer token for backwards compatibility.
 * @param requiresAuth - Whether the operation requires an authentication token.
 * @param options - Per-request transport settings. When omitted, library defaults apply: 30 second timeout, automatic retries under the default policy, no hooks.
 * @param operation - Optional operation name included in missing-token auth errors.
 * @param contentType - Optional `Content-Type` override for non-GraphQL endpoints (for example form-urlencoded OAuth token requests, or `application/json` for REST calls). When provided, the response body is returned verbatim instead of being unwrapped as a GraphQL envelope.
 * @returns The unwrapped response data. For documents with a single root
 * field this is the bare field value; multi-root-field (or zero-root-field)
 * documents are returned as the full `{ data }` envelope unchanged. Use
 * {@link unwrapGraphQLResponse} for the tolerant rule or
 * {@link unwrapSingleRootField} when a caller needs the strict single-root-field
 * result (`undefined` signals the document did not match). With a `contentType`
 * override, the parsed response body is returned as-is.
 * @throws An error if the request fails.
 */
export const sendRequest = async <T = unknown>(
    url: string,
    method: HttpMethod,
    data?: object,
    auth?: RequestAuthInput,
    ...requestOptions: [
        requiresAuth?: boolean,
        options?: RequestOptions,
        operation?: string,
        contentType?: string,
    ]
): Promise<T> => {
    const [requiresAuth = false, options, operation, contentType] = requestOptions;
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

    // The caller's settings object doubles as the circuit-breaker owner key
    // (stable per `AniLink` instance); the upstream host scopes the breaker so
    // multi-provider clients isolate one provider's outage from the others.
    const result = await executeWithRetry<unknown>(
        { url, method, data, headers },
        resolveRequestOptions(options),
        options,
        contentType !== undefined
    );
    return result as T;
};
