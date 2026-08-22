/**
 * Stable error codes returned by the AniLink transport boundary.
 *
 * These codes let consumers classify failures without depending on Axios
 * implementation details or matching human-readable messages.
 */
export const AniLinkErrorCodes = {
    API: "API_ERROR",
    GRAPHQL: "GRAPHQL_ERROR",
    NETWORK: "NETWORK_ERROR",
    TIMEOUT: "TIMEOUT_ERROR",
    ABORTED: "ABORTED_ERROR",
    AUTH: "AUTH_ERROR",
    VALIDATION: "VALIDATION_ERROR",
    UNKNOWN: "UNKNOWN_ERROR",
} as const;

/** A machine-readable AniLink transport error code. */
export type AniLinkErrorCode = (typeof AniLinkErrorCodes)[keyof typeof AniLinkErrorCodes];

/** A base error with a stable AniLink error code. */
export class AniLinkError extends Error {
    public code: AniLinkErrorCode;
    declare public readonly rawAxiosError?: unknown;

    /**
     * Creates a sanitized AniLink error.
     *
     * @param message - A safe message intended for application logs.
     * @param code - The stable code used to classify the failure.
     * @param rawAxiosError - The original Axios error when raw diagnostics are enabled.
     */
    constructor(message: string, code: AniLinkErrorCode, rawAxiosError?: unknown) {
        super(message, rawAxiosError instanceof Error ? { cause: rawAxiosError } : undefined);
        this.name = "AniLinkError";
        this.code = code;
        if (rawAxiosError !== undefined) {
            this.rawAxiosError = rawAxiosError;
        }
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

/** Rate-limit accounting reported by the AniList response headers. */
export interface RateLimitInfo {
    /** The maximum number of requests allowed in the current window. */
    limit: number;
    /** The number of requests remaining in the current window. */
    remaining: number;
    /** The Unix epoch seconds at which the current window resets. */
    reset: number;
}

/** A failure returned by the AniList HTTP API. */
export class AniLinkApiError extends AniLinkError {
    public readonly status: number;
    public readonly data: unknown;

    /**
     * Rate-limit accounting parsed from the `x-ratelimit-limit`,
     * `x-ratelimit-remaining`, and `x-ratelimit-reset` response headers,
     * whenever AniList includes all three. Use it to self-throttle before
     * the next request instead of waiting for another `429`. It is never
     * included in the error message so logs stay clean.
     */
    declare public readonly rateLimit?: RateLimitInfo;

    /**
     * Creates an API error while preserving the upstream response body.
     *
     * @param status - The HTTP status returned by AniList.
     * @param data - The response body returned by AniList.
     * @param rawAxiosError - The original Axios error when raw diagnostics are enabled.
     * @param options - Additional error metadata such as rate-limit headers.
     */
    constructor(
        status: number,
        data: unknown,
        rawAxiosError?: unknown,
        options?: { rateLimit?: RateLimitInfo }
    ) {
        super(
            `AniList API request failed with status ${status}.`,
            AniLinkErrorCodes.API,
            rawAxiosError
        );
        this.name = "AniLinkApiError";
        this.status = status;
        this.data = data;
        if (options?.rateLimit !== undefined) {
            this.rateLimit = options.rateLimit;
        }
    }
}

/** A GraphQL-level failure returned inside an HTTP 200 envelope. */
export class AniLinkGraphQLError extends AniLinkApiError {
    /**
     * The upstream GraphQL `errors` array carried by the envelope. Each entry
     * has a human-readable `message`; partial `data` returned alongside the
     * errors remains available on {@link AniLinkApiError.data}.
     */
    public readonly graphqlErrors: ReadonlyArray<{ message: string }>;

    /**
     * Creates a GraphQL error from an HTTP 200 envelope's `errors` array.
     *
     * @param errors - The upstream GraphQL errors; each entry should carry a `message`.
     * @param data - The partial `data` object returned alongside the errors, when any.
     * @param rawAxiosError - The original Axios error when raw diagnostics are enabled.
     */
    constructor(
        errors: ReadonlyArray<{ message: string }>,
        data?: unknown,
        rawAxiosError?: unknown
    ) {
        super(200, data, rawAxiosError);
        this.name = "AniLinkGraphQLError";
        this.code = AniLinkErrorCodes.GRAPHQL;
        this.message = `AniList request failed with GraphQL errors: ${errors
            .map((graphqlError) => graphqlError.message)
            .join("; ")}`;
        this.graphqlErrors = errors;
    }
}

/** A failure caused by a missing authentication token. */
export class AniLinkAuthError extends AniLinkError {
    /**
     * Creates an authentication error for a token-required operation.
     */
    constructor() {
        super(
            "This operation requires an authentication token. Create an instance of AniLink and pass the token as an argument.",
            AniLinkErrorCodes.AUTH
        );
        this.name = "AniLinkAuthError";
    }
}

/** A failure caused by operation variables that fail validation. */
export class AniLinkValidationError extends AniLinkError {
    /** The individual validation problems, one per line. */
    public readonly details: readonly string[];

    /**
     * Creates a validation error for invalid operation variables.
     *
     * @param details - The individual validation problems.
     */
    constructor(details: readonly string[]) {
        super(
            `AniList request variables are invalid:\n${details.join("\n")}`,
            AniLinkErrorCodes.VALIDATION
        );
        this.name = "AniLinkValidationError";
        this.details = details;
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
