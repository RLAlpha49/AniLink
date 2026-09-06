/**
 * Error normalization for the shared transport.
 *
 * Converts raw Axios errors, cancellations, and unexpected thrown values
 * into the {@link AniLinkError} taxonomy, redacts sensitive request headers
 * from any raw Axios error attached for diagnostics, and stamps the
 * correlation `requestId` onto errors constructed before the retry loop had
 * an ID. Also owns the small header-parsing helpers (`getRateLimitInfo`,
 * `getResponseContentType`) shared with envelope unwrapping and pacing.
 */
import axios, { type AxiosError } from "axios";
import {
    AniLinkApiError,
    AniLinkError,
    AniLinkErrorCodes,
    AniLinkNetworkError,
    AniLinkRestError,
    type RateLimitInfo,
} from "./AniLinkError";
import type { ResolvedRequestOptions } from "./requestOptions";

const SENSITIVE_HEADER_KEYS = /^(authorization|cookie|set-cookie|proxy-authorization)$/i;

/**
 * Returns a shallow-cloned copy of an Axios error with sensitive request
 * headers redacted, so opting into {@link RequestOptions.exposeRawAxiosError}
 * for diagnostics cannot leak the bearer token or cookies the request was
 * sent with. Only the `config.headers` (and nested `common`/per-method) maps
 * are scrubbed; the rest of the error is preserved verbatim so the diagnostic
 * value callers opted in for stays intact.
 */
const redactAxiosError = (error: AxiosError): AxiosError => {
    const config = error.config as Record<string, unknown> | undefined;
    if (config === undefined || config.headers === undefined) {
        return error;
    }
    const redactHeaders = (headers: Record<string, unknown>): Record<string, unknown> => {
        const scrubbed: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(headers)) {
            if (value !== null && typeof value === "object" && !Array.isArray(value)) {
                // Nested per-method header map (`{ common, get, post, … }`):
                // recurse so a bearer token inside `common.authorization` or
                // `get.authorization` is redacted, not just top-level keys.
                scrubbed[key] = redactHeaders(value as Record<string, unknown>);
            } else {
                scrubbed[key] = SENSITIVE_HEADER_KEYS.test(key) ? "[REDACTED]" : value;
            }
        }
        return scrubbed;
    };
    const cloned = { ...error, config: { ...config } } as unknown as AxiosError;
    const clonedConfig = cloned.config as unknown as Record<string, unknown>;
    const headers = config.headers as Record<string, unknown>;
    if (headers !== null && typeof headers === "object" && !Array.isArray(headers)) {
        // Axios stores headers either as a flat map or as a per-method map
        // (`{ common, get, post, … }`). Redact both shapes.
        clonedConfig.headers = redactHeaders(headers);
    }
    return cloned;
};

const getRawAxiosError = (resolved: ResolvedRequestOptions, error: unknown): unknown =>
    resolved.exposeRawAxiosError
        ? axios.isAxiosError(error)
            ? redactAxiosError(error)
            : error
        : undefined;

export const getRateLimitInfo = (
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

export const getResponseContentType = (
    headers: Record<string, unknown> | undefined
): string | undefined => {
    if (!headers) return undefined;
    const raw = headers["content-type"] ?? headers["Content-Type"];
    return typeof raw === "string" ? raw : undefined;
};

const normalizeAxiosError = (
    resolved: ResolvedRequestOptions,
    error: AxiosError,
    isRestCall = false,
    requestId?: string
): AniLinkError => {
    if (axios.isCancel(error)) {
        return new AniLinkNetworkError(
            AniLinkErrorCodes.ABORTED,
            "The request was cancelled.",
            getRawAxiosError(resolved, error),
            { requestId }
        );
    }

    if (error.response?.status !== undefined) {
        const status = error.response.status;
        const data = error.response.data;
        const rawAxiosError = getRawAxiosError(resolved, error);
        const options = {
            rateLimit: getRateLimitInfo(error.response.headers),
            contentType: getResponseContentType(error.response.headers as Record<string, unknown>),
            requestId,
        };
        return isRestCall
            ? new AniLinkRestError(status, data, rawAxiosError, options)
            : new AniLinkApiError(status, data, rawAxiosError, options);
    }

    if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT") {
        return new AniLinkNetworkError(
            AniLinkErrorCodes.TIMEOUT,
            "The request timed out.",
            getRawAxiosError(resolved, error),
            { timeoutMs: resolved.timeout > 0 ? resolved.timeout : undefined, requestId }
        );
    }

    return new AniLinkNetworkError(
        AniLinkErrorCodes.NETWORK,
        "The request failed due to a network error.",
        getRawAxiosError(resolved, error),
        { requestId }
    );
};

/**
 * Stamps an immutable, enumerable `requestId` correlation property onto an
 * {@link AniLinkError} that was constructed before the retry loop had an ID
 * (for example an `AniLinkGraphQLError` thrown by envelope unwrapping, or a
 * circuit-breaker fast-fail error). Errors that already carry a `requestId`
 * are left untouched so an existing correlation is never overwritten.
 *
 * @param error - The error to stamp.
 * @param requestId - The correlation ID, when available.
 */
export const stampRequestId = (error: AniLinkError, requestId: string | undefined): void => {
    if (requestId === undefined || error.requestId !== undefined) {
        return;
    }
    Object.defineProperty(error, "requestId", {
        value: requestId,
        writable: false,
        enumerable: true,
        configurable: false,
    });
};

export const normalizeRequestError = (
    resolved: ResolvedRequestOptions,
    error: unknown,
    isRestCall = false,
    requestId?: string
): AniLinkError => {
    if (error instanceof AniLinkError) {
        stampRequestId(error, requestId);
        return error;
    }

    if (axios.isAxiosError(error)) {
        return normalizeAxiosError(resolved, error, isRestCall, requestId);
    }

    return new AniLinkError(
        "The request failed.",
        AniLinkErrorCodes.UNKNOWN,
        getRawAxiosError(resolved, error),
        { requestId }
    );
};
