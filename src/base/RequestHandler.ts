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
    type RateLimitInfo,
} from "./AniLinkError";

/** The default maximum time a request may remain in progress. */
export const DEFAULT_REQUEST_TIMEOUT = 30_000;

/** The maximum time a `Retry-After` header may delay a retry. */
const MAX_RETRY_AFTER_MS = 60_000;

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

/** Context passed to the request lifecycle hooks for a single attempt. */
export interface RequestErrorContext {
    /** The URL the request was sent to. */
    url: string;
    /** The HTTP method of the request. */
    method: "GET" | "POST";
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
    method: "GET" | "POST";
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
    /** Milliseconds before a request is aborted. `0` disables the Axios timeout. Defaults to 30 seconds. */
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
     * Opt into automatic retries for transient failures: `true` uses the
     * default policy, a partial policy tunes it, and `false` (the default)
     * sends every request exactly once.
     */
    retry?: boolean | Partial<RetryPolicy>;
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
    httpAgent: new http.Agent({ keepAlive: true }),
    httpsAgent: new https.Agent({ keepAlive: true }),
});

interface ResolvedRequestOptions {
    timeout: number;
    signal?: AbortSignal;
    exposeRawAxiosError: boolean;
    retry: RetryPolicy | null;
    onError?: OnErrorHandler;
    onRetry?: OnErrorHandler;
    onRequestStart?: OnRequestStartHandler;
    onResponse?: OnResponseHandler;
}

const resolveRetryPolicy = (
    retry: boolean | Partial<RetryPolicy> | undefined
): RetryPolicy | null => {
    if (retry === undefined || retry === false) {
        return null;
    }
    if (retry === true) {
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
    errors?: Array<{ message: string }>;
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
            "AniList request was cancelled.",
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
            "AniList request timed out.",
            getRawAxiosError(resolved, error)
        );
    }

    return new AniLinkNetworkError(
        AniLinkErrorCodes.NETWORK,
        "AniList request failed due to a network error.",
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
        "AniList request failed.",
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
                new AniLinkNetworkError(AniLinkErrorCodes.ABORTED, "AniList request was cancelled.")
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
    method: "GET" | "POST";
    data?: object;
    headers: Record<string, string>;
}

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
    method: "GET" | "POST",
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

const executeWithRetry = async <T>(
    options: ExecuteOptions,
    resolved: ResolvedRequestOptions
): Promise<T> => {
    const { url, method, data, headers } = options;
    const policy = resolved.retry;
    let attempt = 0;

    for (;;) {
        const startedAt = Date.now();
        const hookContext = { url, method, attempt: attempt + 1 };
        resolved.onRequestStart?.(hookContext);
        try {
            const response: AxiosResponse = await axiosClient({
                url,
                method,
                data,
                headers,
                timeout: resolved.timeout,
                signal: resolved.signal,
            });
            resolved.onResponse?.({ ...hookContext, durationMs: Date.now() - startedAt });
            return unwrapGraphQLResponse<T>(response.data);
        } catch (error: unknown) {
            resolved.onResponse?.({ ...hookContext, durationMs: Date.now() - startedAt });
            const normalized = normalizeRequestError(resolved, error);
            const delay =
                policy === null ? null : getRetryDelay(normalized, error, attempt, policy);

            if (delay !== null) {
                (resolved.onRetry ?? resolved.onError)?.(
                    normalized,
                    buildErrorContext(url, method, attempt + 1, normalized, delay)
                );
                attempt += 1;
                await sleep(delay, resolved.signal);
                continue;
            }

            resolved.onError?.(normalized, buildErrorContext(url, method, attempt + 1, normalized));
            throw normalized;
        }
    }
};

/**
 * Sends a request to the specified URL.
 * @param url - The URL to send the request to.
 * @param method - The HTTP method to use ('GET' or 'POST').
 * @param data - The data to send with the request.
 * @param token - The authentication token to include in the request headers.
 * @param requiresAuth - Whether the operation requires an authentication token.
 * @param options - Per-request transport settings. When omitted, library defaults apply (30 second timeout, no retry, no hooks).
 * @returns The unwrapped response data. For documents with a single root
 * field this is the bare field value; multi-root-field (or zero-root-field)
 * documents are returned as the full `{ data }` envelope unchanged. Use
 * {@link unwrapGraphQLResponse} for the tolerant rule or
 * {@link unwrapSingleRootField} when a caller needs the strict single-root-field
 * result (`undefined` signals the document did not match).
 * @throws An error if the request fails.
 */
export const sendRequest = async <T = unknown>(
    url: string,
    method: "GET" | "POST",
    data?: object,
    token?: string,
    requiresAuth = false,
    options?: RequestOptions
): Promise<T> => {
    if (requiresAuth && (token === null || token === undefined || token === "")) {
        throw new AniLinkAuthError();
    }

    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        Accept: "application/json",
    };

    if (token !== null && token !== undefined && token !== "") {
        headers.Authorization = `Bearer ${token}`;
    }

    return executeWithRetry<T>({ url, method, data, headers }, resolveRequestOptions(options));
};
