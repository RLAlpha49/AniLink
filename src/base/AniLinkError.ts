/**
 * Stable error codes returned by the AniLink transport boundary.
 *
 * These codes let consumers classify failures without depending on Axios
 * implementation details or matching human-readable messages.
 */
export const AniLinkErrorCodes = {
    API: "API_ERROR",
    NETWORK: "NETWORK_ERROR",
    TIMEOUT: "TIMEOUT_ERROR",
    ABORTED: "ABORTED_ERROR",
    UNKNOWN: "UNKNOWN_ERROR",
} as const;

/** A machine-readable AniLink transport error code. */
export type AniLinkErrorCode = (typeof AniLinkErrorCodes)[keyof typeof AniLinkErrorCodes];

/** A base error with a stable AniLink error code. */
export class AniLinkError extends Error {
    public readonly code: AniLinkErrorCode;
    declare public readonly rawAxiosError?: unknown;

    /**
     * Creates a sanitized AniLink error.
     *
     * @param message - A safe message intended for application logs.
     * @param code - The stable code used to classify the failure.
     * @param rawAxiosError - The original Axios error when raw diagnostics are enabled.
     */
    constructor(message: string, code: AniLinkErrorCode, rawAxiosError?: unknown) {
        super(message);
        this.name = "AniLinkError";
        this.code = code;
        if (rawAxiosError !== undefined) {
            this.rawAxiosError = rawAxiosError;
        }
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

/** A failure returned by the AniList HTTP API. */
export class AniLinkApiError extends AniLinkError {
    public readonly status: number;
    public readonly data: unknown;

    /**
     * Creates an API error while preserving the upstream response body.
     *
     * @param status - The HTTP status returned by AniList.
     * @param data - The response body returned by AniList.
     * @param rawAxiosError - The original Axios error when raw diagnostics are enabled.
     */
    constructor(status: number, data: unknown, rawAxiosError?: unknown) {
        super(
            `AniList API request failed with status ${status}.`,
            AniLinkErrorCodes.API,
            rawAxiosError
        );
        this.name = "AniLinkApiError";
        this.status = status;
        this.data = data;
    }
}

/** A network, timeout, or cancellation failure. */
export class AniLinkNetworkError extends AniLinkError {
    /**
     * Creates a sanitized transport error.
     *
     * @param code - The stable code for the transport failure.
     * @param message - A safe message intended for application logs.
    * @param rawAxiosError - The original Axios error when raw diagnostics are enabled.
     */
    constructor(
        code:
            | typeof AniLinkErrorCodes.NETWORK
            | typeof AniLinkErrorCodes.TIMEOUT
            | typeof AniLinkErrorCodes.ABORTED,
        message: string,
        rawAxiosError?: unknown
    ) {
        super(message, code, rawAxiosError);
        this.name = "AniLinkNetworkError";
    }
}
