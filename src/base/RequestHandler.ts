import http from "node:http";
import https from "node:https";
import axios, { type AxiosError, type AxiosResponse } from "axios";
import {
    AniLinkApiError,
    AniLinkAuthError,
    AniLinkError,
    AniLinkErrorCodes,
    AniLinkNetworkError,
} from "./AniLinkError";

/** The default maximum time a request may remain in progress. */
export const DEFAULT_REQUEST_TIMEOUT = 30_000;

/** The maximum time a `Retry-After` header may delay a retry. */
const MAX_RETRY_AFTER_MS = 60_000;

/** Retry policy for transient transport failures. */
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
}

/** Context passed to the `onError` hook when a request ultimately fails. */
export interface RequestErrorContext {
    /** The URL the request was sent to. */
    url: string;
    /** The HTTP method of the request. */
    method: "GET" | "POST";
    /** The 1-based attempt that failed. */
    attempt: number;
}

/** A callback invoked when a request fails after all retries are exhausted. */
export type OnErrorHandler = (error: AniLinkError, context: RequestErrorContext) => void;

/** Transport settings shared by the AniLink request operations. */
export interface RequestOptions {
    timeout?: number;
    signal?: AbortSignal;
    exposeRawAxiosError?: boolean;
    retry?: boolean | Partial<RetryPolicy>;
    onError?: OnErrorHandler;
}

const DEFAULT_RETRY_POLICY: RetryPolicy = {
    maxRetries: 3,
    baseDelayMs: 250,
    maxDelayMs: 5_000,
    retryOnStatus: [429, 500, 502, 503, 504],
    retryOnNetworkError: true,
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
}

let requestOptions: ResolvedRequestOptions = {
    timeout: DEFAULT_REQUEST_TIMEOUT,
    exposeRawAxiosError: false,
    retry: null,
};

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
 * Configures the timeout, cancellation signal, retry policy, and error hook
 * used by subsequent requests.
 *
 * Passing no options restores the defaults. A timeout of zero is valid because
 * Axios uses it to disable its timeout.
 *
 * @param options - Optional transport configuration.
 * @throws A `TypeError` when `timeout` is negative or not finite.
 */
export const configureRequestOptions = (options: RequestOptions = {}): void => {
    const timeout = options.timeout ?? DEFAULT_REQUEST_TIMEOUT;

    if (!Number.isFinite(timeout) || timeout < 0) {
        throw new TypeError("timeout must be a finite number greater than or equal to 0");
    }

    requestOptions = {
        timeout,
        signal: options.signal,
        exposeRawAxiosError: options.exposeRawAxiosError ?? false,
        retry: resolveRetryPolicy(options.retry),
        onError: options.onError,
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
 * field value. For responses with multiple root fields, or responses without
 * a `data` object (for example GraphQL errors), the full envelope is returned
 * unchanged.
 *
 * @param response - The full GraphQL response envelope.
 * @returns The unwrapped single-root-field value, or the envelope as-is.
 */
export const unwrapGraphQLResponse = <T>(response: unknown): T => {
    const envelope = response as GraphQLResponseEnvelope | null | undefined;
    const queryData = envelope?.data;

    if (queryData && typeof queryData === "object") {
        const fields = Object.keys(queryData);

        if (fields.length === 1) {
            return (queryData as Record<string, T>)[fields[0]];
        }
    }

    return response as T;
};

const getRawAxiosError = (error: unknown): unknown =>
    requestOptions.exposeRawAxiosError ? error : undefined;

const normalizeAxiosError = (error: AxiosError): AniLinkError => {
    if (axios.isCancel(error)) {
        return new AniLinkNetworkError(
            AniLinkErrorCodes.ABORTED,
            "AniList request was cancelled.",
            getRawAxiosError(error)
        );
    }

    if (error.response?.status !== undefined) {
        return new AniLinkApiError(
            error.response.status,
            error.response.data,
            getRawAxiosError(error)
        );
    }

    if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT") {
        return new AniLinkNetworkError(
            AniLinkErrorCodes.TIMEOUT,
            "AniList request timed out.",
            getRawAxiosError(error)
        );
    }

    return new AniLinkNetworkError(
        AniLinkErrorCodes.NETWORK,
        "AniList request failed due to a network error.",
        getRawAxiosError(error)
    );
};

const normalizeRequestError = (error: unknown): AniLinkError => {
    if (error instanceof AniLinkError) {
        return error;
    }

    if (axios.isAxiosError(error)) {
        return normalizeAxiosError(error);
    }

    return new AniLinkError("AniList request failed.", AniLinkErrorCodes.UNKNOWN);
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

const getBackoffDelay = (attempt: number, policy: RetryPolicy): number =>
    Math.min(policy.baseDelayMs * 2 ** attempt, policy.maxDelayMs);

/**
 * Computes the delay before the next retry, or `null` when the request should
 * not be retried.
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
            return getRetryAfterDelay(rawError) ?? getBackoffDelay(attempt, policy);
        }
        if (policy.retryOnStatus.includes(error.status)) {
            return getBackoffDelay(attempt, policy);
        }
        return null;
    }

    if (error instanceof AniLinkNetworkError) {
        if (error.code === AniLinkErrorCodes.ABORTED) {
            return null;
        }
        if (policy.retryOnNetworkError) {
            return getBackoffDelay(attempt, policy);
        }
    }

    return null;
};

const sleep = (ms: number, signal?: AbortSignal): Promise<void> =>
    new Promise((resolve, reject) => {
        let timeout: NodeJS.Timeout;

        const abort = (): void => {
            clearTimeout(timeout);
            reject(
                new AniLinkNetworkError(AniLinkErrorCodes.ABORTED, "AniList request was cancelled.")
            );
        };

        timeout = setTimeout(() => {
            signal?.removeEventListener("abort", abort);
            resolve();
        }, ms);

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

const executeWithRetry = async <T>(options: ExecuteOptions): Promise<T> => {
    const { url, method, data, headers } = options;
    const policy = requestOptions.retry;
    let attempt = 0;

    for (;;) {
        try {
            const response: AxiosResponse = await axiosClient({
                url,
                method,
                data,
                headers,
                timeout: requestOptions.timeout,
                signal: requestOptions.signal,
            });
            return unwrapGraphQLResponse<T>(response.data);
        } catch (error: unknown) {
            const normalized = normalizeRequestError(error);
            const delay =
                policy === null ? null : getRetryDelay(normalized, error, attempt, policy);

            if (delay === null) {
                requestOptions.onError?.(normalized, { url, method, attempt: attempt + 1 });
                throw normalized;
            }

            attempt += 1;
            await sleep(delay, requestOptions.signal);
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
 * @returns The unwrapped response data. For operations with a single root
 * field this is the bare field value; otherwise it is the full `{ data }`
 * envelope. Use {@link unwrapGraphQLResponse} to apply the same rule to a
 * response yourself.
 * @throws An error if the request fails.
 */
export const sendRequest = async <T = unknown>(
    url: string,
    method: "GET" | "POST",
    data?: object,
    token?: string,
    requiresAuth = false
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

    return executeWithRetry<T>({ url, method, data, headers });
};
