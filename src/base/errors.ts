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

const SENSITIVE_HEADER_KEYS =
    /^(authorization|cookie|set-cookie|proxy-authorization|proxy-auth|authentication|(x-)?api[-_]?key|(x-)?auth[-_]?token|(x-)?session(-id)?|session)$/i;

/**
 * Returns a shallow-cloned copy of an Axios error with sensitive request
 * headers redacted, so opting into {@link RequestOptions.exposeRawAxiosError}
 * for diagnostics cannot leak the bearer token or cookies the request was
 * sent with. The `config.headers` (and nested `common`/per-method) maps, the
 * response's back-reference to the request config (`response.config`), the
 * upstream response headers, the request body (`config.data`), basic-auth
 * material (`config.auth`), and the raw `ClientRequest` (`error.request`)
 * are all scrubbed; the rest of the error is preserved verbatim so the
 * diagnostic value callers opted in for stays intact.
 */
const redactAxiosError = (error: AxiosError): AxiosError => {
    const config = error.config as Record<string, unknown> | undefined;
    const response = error.response as Record<string, unknown> | undefined;
    const isHeaderMap = (value: unknown): value is Record<string, unknown> =>
        value !== null && typeof value === "object" && !Array.isArray(value);
    // Clone only when something actually needs redacting, so errors with
    // no sensitive material keep their original identity.
    const configNeedsRedaction =
        config !== undefined &&
        (isHeaderMap(config.headers) || config.data !== undefined || config.auth !== undefined);
    const responseNeedsRedaction =
        response !== undefined &&
        (response.config !== undefined ||
            isHeaderMap(response.headers) ||
            response.request !== undefined);
    const requestNeedsRedaction = error.request !== undefined;
    if (!configNeedsRedaction && !responseNeedsRedaction && !requestNeedsRedaction) {
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
    const redactConfig = (source: Record<string, unknown>): Record<string, unknown> => {
        const cloned = { ...source };
        const headers = source.headers;
        if (isHeaderMap(headers)) {
            // Axios stores headers either as a flat map or as a per-method map
            // (`{ common, get, post, … }`). Redact both shapes.
            cloned.headers = redactHeaders(headers);
        }
        if (source.data !== undefined) {
            // The request body can carry credentials (an OAuth
            // `client_secret`, a `password` variable in a custom mutation);
            // it is replaced wholesale rather than partially redacted,
            // because a partially-redacted body has no diagnostic value.
            cloned.data = "[REDACTED]";
        }
        if (source.auth !== undefined) {
            // Axios basic-auth material: `{ username, password }`.
            cloned.auth = "[REDACTED]";
        }
        return cloned;
    };
    const cloned = { ...error } as unknown as AxiosError;
    const clonedRecord = cloned as unknown as Record<string, unknown>;
    if (requestNeedsRedaction) {
        // The raw Node `ClientRequest` carries `_header`: the verbatim
        // request header string including `Authorization: Bearer …`. It is
        // replaced with a marker instead of cloned — the live object must
        // never be shared with the consumer's diagnostics.
        clonedRecord.request = "[REDACTED]";
    }
    if (config !== undefined) {
        clonedRecord.config = redactConfig(config);
    }
    if (response !== undefined) {
        // The response object carries a back-reference to the original
        // request config (`response.config`); redact it too or the bearer
        // token survives through this second path. The response is cloned
        // because `{ ...error }` shares it with the original error.
        const clonedResponse: Record<string, unknown> = { ...response };
        const responseConfig = response.config as Record<string, unknown> | undefined;
        if (responseConfig !== undefined) {
            clonedResponse.config = redactConfig(responseConfig);
        }
        const responseHeaders = response.headers;
        if (isHeaderMap(responseHeaders)) {
            // Upstream response headers can carry `set-cookie`; the same
            // sensitive-key list applies.
            clonedResponse.headers = redactHeaders(responseHeaders);
        }
        if (response.request !== undefined) {
            // The response's back-reference to the raw `ClientRequest` is
            // scrubbed for the same reason as `error.request`.
            clonedResponse.request = "[REDACTED]";
        }
        clonedRecord.response = clonedResponse;
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
