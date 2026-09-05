/**
 * Shared token-request error normalization.
 *
 * Both provider auth modules (AniList and MAL) run OAuth token exchanges
 * through the shared transport pipeline and then re-classify the thrown
 * error so token-request bodies (which carry `client_secret`, authorization
 * `code`, and `refresh_token` values) never leak through error messages.
 * This module owns that re-classification so the two providers share one
 * implementation instead of drifting copies.
 */
import axios from "axios";
import {
    AniLinkApiError,
    AniLinkError,
    AniLinkErrorCodes,
    AniLinkNetworkError,
    AniLinkRestError,
} from "./AniLinkError";

/**
 * Normalizes a failed OAuth token request into an {@link AniLinkError}
 * subclass with a context-prefixed message.
 *
 * Token request bodies carry `client_secret`, authorization `code`, and
 * `refresh_token` values, so the original Axios error is deliberately
 * discarded: the returned error carries only a safe message (prefixed with
 * `label` so logs identify the failing token exchange), a stable code, and —
 * for HTTP failures — the upstream response body, which contains no
 * credentials.
 *
 * Errors already normalized by the shared pipeline carry only safe fields
 * (message, stable code, upstream response body), so they pass through with
 * their specific classification intact; API failures are relabeled with the
 * `label` prefix so logs still identify the failing token exchange. A *new*
 * error is constructed for the relabel path (carrying the original as
 * `cause`) instead of mutating the existing instance's `message` in place,
 * so consumers comparing messages across the same error instance are not
 * surprised by mid-flight mutation.
 *
 * @param error - The value thrown by the token request transport.
 * @param label - A context label prefixed to the safe message (for example `"AniList token request"` or `"MAL token request"`).
 * @returns A sanitized error that is safe to surface in application logs.
 */
export const sanitizeTokenError = (error: unknown, label: string): AniLinkError => {
    if (error instanceof AniLinkRestError) {
        const relabeled = new AniLinkRestError(error.status, error.data, undefined, {
            rateLimit: error.rateLimit,
            contentType: error.contentType,
            requestId: error.requestId,
        });
        relabeled.message = `${label} failed with status ${error.status}.`;
        return relabeled;
    }

    if (error instanceof AniLinkApiError) {
        const relabeled = new AniLinkApiError(error.status, error.data, undefined, {
            rateLimit: error.rateLimit,
            contentType: error.contentType,
            requestId: error.requestId,
        });
        relabeled.message = `${label} failed with status ${error.status}.`;
        return relabeled;
    }

    if (error instanceof AniLinkError) {
        return error;
    }

    if (axios.isCancel(error)) {
        return new AniLinkNetworkError(AniLinkErrorCodes.ABORTED, `${label} was cancelled.`);
    }

    if (axios.isAxiosError(error)) {
        if (error.response?.status !== undefined) {
            const status = error.response.status;
            const apiError = new AniLinkApiError(status, error.response.data);
            apiError.message = `${label} failed with status ${status}.`;
            return apiError;
        }

        if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT") {
            return new AniLinkNetworkError(AniLinkErrorCodes.TIMEOUT, `${label} timed out.`);
        }

        return new AniLinkNetworkError(
            AniLinkErrorCodes.NETWORK,
            `${label} failed due to a network error.`
        );
    }

    return new AniLinkError(`${label} failed.`, AniLinkErrorCodes.UNKNOWN);
};
