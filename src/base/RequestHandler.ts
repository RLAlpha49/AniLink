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

/** Transport settings shared by the AniLink request operations. */
export interface RequestOptions {
    timeout?: number;
    signal?: AbortSignal;
    exposeRawAxiosError?: boolean;
}

const axiosClient = axios.create({
    timeout: DEFAULT_REQUEST_TIMEOUT,
    httpAgent: new http.Agent({ keepAlive: true }),
    httpsAgent: new https.Agent({ keepAlive: true }),
});

let requestOptions: Required<Pick<RequestOptions, "timeout" | "exposeRawAxiosError">> &
    Pick<RequestOptions, "signal"> = {
    timeout: DEFAULT_REQUEST_TIMEOUT,
    exposeRawAxiosError: false,
};

/**
 * Configures the timeout and cancellation signal used by subsequent requests.
 *
 * Passing no options restores the default timeout and clears the signal. A
 * timeout of zero is valid because Axios uses it to disable its timeout.
 *
 * @param options - Optional timeout and abort signal configuration.
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

    let response: AxiosResponse;

    try {
        response = await axiosClient({
            url,
            method,
            data,
            headers,
            timeout: requestOptions.timeout,
            signal: requestOptions.signal,
        });
    } catch (error: unknown) {
        throw normalizeRequestError(error);
    }

    return unwrapGraphQLResponse<T>(response.data);
};
