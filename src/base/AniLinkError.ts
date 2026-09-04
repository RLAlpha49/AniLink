/**
 * {@link AniLinkErrorCodes} is the stable code map returned by the AniLink transport boundary.
 *
 * These codes let consumers classify failures without depending on Axios implementation details or matching human-readable messages. Use {@link AniLinkErrorCode} to type the code and {@link AniLinkError} to branch on it.
 *
 * @see {@link AniLinkErrorCode}
 * @example
 * ```ts
 * import { AniLinkErrorCodes } from "./base/AniLinkError";
 * if (error.code === AniLinkErrorCodes.AUTH) {
 *   console.error("Missing token");
 * }
 * ```
 */
export const AniLinkErrorCodes = {
    API: "API_ERROR",
    GRAPHQL: "GRAPHQL_ERROR",
    NETWORK: "NETWORK_ERROR",
    TIMEOUT: "TIMEOUT_ERROR",
    ABORTED: "ABORTED_ERROR",
    CIRCUIT: "CIRCUIT_OPEN_ERROR",
    AUTH: "AUTH_ERROR",
    VALIDATION: "VALIDATION_ERROR",
    UNKNOWN: "UNKNOWN_ERROR",
} as const;

/**
 * Union of stable error codes exposed by the AniLink transport boundary.
 *
 * @see {@link AniLinkErrorCodes}
 */
export type AniLinkErrorCode = (typeof AniLinkErrorCodes)[keyof typeof AniLinkErrorCodes];

/**
 * Base error for failures normalized by AniLink.
 *
 * Consumers can branch on {@link AniLinkError.code} without depending on the
 * underlying Axios error or a provider's human-readable message.
 *
 * @see {@link AniLinkErrorCodes}
 */
export class AniLinkError extends Error {
    /** Stable code used to classify the failure. */
    public code: AniLinkErrorCode;
    /** Original Axios or transport error when raw diagnostics were enabled. */
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

/**
 * Rate-limit accounting parsed from provider response headers.
 *
 * Populated from the `x-ratelimit-*` header family (AniList) or the
 * `X-RateLimit-*` / `Retry-After` family used by REST providers such as
 * MyAnimeList, whenever the upstream includes the required headers.
 *
 * @see {@link AniLinkApiError.rateLimit}
 */
export interface RateLimitInfo {
    /** The maximum number of requests allowed in the current window. */
    limit: number;
    /** The number of requests remaining in the current window. */
    remaining: number;
    /** The Unix epoch seconds at which the current window resets. */
    reset: number;
}

/**
 * A failure returned by an upstream HTTP API.
 *
 * This is the transport-level failure for every provider: GraphQL providers
 * surface HTTP failures through it and protocol-level failures through
 * {@link AniLinkGraphQLError}; REST providers surface every non-2xx response
 * through it directly.
 */
export class AniLinkApiError extends AniLinkError {
    /** HTTP status returned by the upstream API. For GraphQL failures this is the upstream GraphQL error status when available, and the HTTP envelope status (`200`) otherwise. */
    public readonly status: number;
    /** Response body returned by the upstream API, preserved verbatim. */
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
        super(`API request failed with status ${status}.`, AniLinkErrorCodes.API, rawAxiosError);
        this.name = "AniLinkApiError";
        this.status = status;
        this.data = data;
        if (options?.rateLimit !== undefined) {
            this.rateLimit = options.rateLimit;
        }
    }
}

/**
 * A single upstream GraphQL error object as carried by an HTTP 200 envelope.
 *
 * AniList error entries always carry a human-readable `message` and usually a
 * numeric `status` (for example `404` for "Not Found" versus `500` for an
 * internal server error); `locations` and `extensions` appear when the server
 * includes them. Any additional upstream fields are preserved verbatim via the
 * index signature so consumers never need to string-match messages to
 * classify a failure.
 *
 * @see {@link AniLinkGraphQLError.graphqlErrors}
 */
export interface GraphQLUpstreamError {
    /** The human-readable error message returned by AniList. */
    message: string;
    /** The upstream HTTP-like status for the error, when present (e.g. `404`, `500`). */
    status?: number | string;
    /** The GraphQL source locations the error refers to, when present. */
    locations?: unknown;
    /** Arbitrary upstream extension metadata, when present. */
    extensions?: Record<string, unknown> | null;
    /** Any additional upstream fields, preserved verbatim. */
    [key: string]: unknown;
}

/**
 * Extracts the first finite numeric `status` carried by an upstream GraphQL
 * error entry.
 *
 * AniList error entries usually carry a numeric `status` (for example `404`
 * for "Not Found" versus `500` for an internal server error); entries without
 * one (or with a non-numeric placeholder) are skipped so the envelope default
 * applies.
 *
 * @param errors - The upstream GraphQL errors carried by the envelope.
 * @returns The first finite numeric upstream status, or `undefined` when no entry carries one.
 */
const extractUpstreamStatus = (errors: ReadonlyArray<GraphQLUpstreamError>): number | undefined => {
    for (const entry of errors) {
        const status = entry.status;
        if (typeof status === "number" && Number.isFinite(status)) {
            return status;
        }
    }
    return undefined;
};

/**
 * GraphQL-level failure returned inside an HTTP 200 envelope.
 *
 * The inherited {@link AniLinkApiError.status} reflects the upstream GraphQL
 * error status when an entry in {@link AniLinkGraphQLError.graphqlErrors}
 * carries one (for example `404` or `429`), and the HTTP `200` envelope status
 * otherwise. This makes `status` a meaningful classification field for
 * GraphQL failures and lets status-based branching and retry policies treat a
 * GraphQL-level `429`/`5xx` like its HTTP-level counterpart.
 *
 * @see {@link GraphQLUpstreamError}
 */
export class AniLinkGraphQLError extends AniLinkApiError {
    /**
     * The upstream GraphQL `errors` array carried by the envelope, preserved
     * verbatim. Beyond `message`, entries typically carry an upstream `status`
     * (distinguishing "entity does not exist" from a server fault) plus
     * `locations` and `extensions` when AniList includes them.
     */
    public readonly graphqlErrors: ReadonlyArray<GraphQLUpstreamError>;

    /**
     * The partial `data` object returned alongside the GraphQL errors, when
     * AniList produced a partial success. GraphQL can resolve some fields
     * while failing others; the usable portion survives here (and on the
     * inherited {@link AniLinkApiError.data} field) instead of being
     * discarded, so consumers can recover the fields that did resolve.
     */
    declare public readonly partialData?: unknown;

    /**
     * Creates a GraphQL error from an HTTP 200 envelope's `errors` array.
     *
     * @param errors - The upstream GraphQL errors; each entry should carry a `message`.
     * @param data - The partial `data` object returned alongside the errors, when any. Exposed as {@link AniLinkGraphQLError.partialData}.
     * @param rawAxiosError - The original Axios error when raw diagnostics are enabled.
     */
    constructor(
        errors: ReadonlyArray<GraphQLUpstreamError>,
        data?: unknown,
        rawAxiosError?: unknown
    ) {
        super(extractUpstreamStatus(errors) ?? 200, data, rawAxiosError);
        this.name = "AniLinkGraphQLError";
        this.code = AniLinkErrorCodes.GRAPHQL;
        this.message = `The request failed with GraphQL errors: ${errors
            .map((graphqlError) => graphqlError.message)
            .join("; ")}`;
        this.graphqlErrors = errors;
        if (data !== undefined) {
            this.partialData = data;
        }
    }
}

/**
 * Failure caused by a missing authentication token on a protected operation.
 *
 * @see {@link AniLinkErrorCodes.AUTH}
 */
export class AniLinkAuthError extends AniLinkError {
    /**
     * Creates an authentication error for a token-required operation.
     *
     * @param operation - Optional name of the operation that required authentication, appended to the message so the failing call is identifiable from logs alone.
     */
    constructor(operation?: string) {
        super(
            operation === undefined
                ? "This operation requires an authentication token. Create an instance of AniLink and pass the token as an argument."
                : `This operation requires an authentication token. Create an instance of AniLink and pass the token as an argument. (operation: ${operation})`,
            AniLinkErrorCodes.AUTH
        );
        this.name = "AniLinkAuthError";
    }
}

/**
 * Failure caused by operation variables that fail validation.
 *
 * @see {@link AniLinkErrorCodes.VALIDATION}
 */
export class AniLinkValidationError extends AniLinkError {
    /** Individual validation problems, one per entry. */
    public readonly details: readonly string[];

    /**
     * Creates a validation error for invalid operation variables.
     *
     * @param details - The individual validation problems.
     */
    constructor(details: readonly string[]) {
        super(
            `Request variables are invalid:\n${details.join("\n")}`,
            AniLinkErrorCodes.VALIDATION
        );
        this.name = "AniLinkValidationError";
        this.details = details;
    }
}

/**
 * A REST-level failure returned by a REST-style provider.
 *
 * REST APIs report failures as plain HTTP status codes with a JSON (or HTML)
 * body rather than inside a GraphQL envelope, so this subclass exists to give
 * consumers a stable type to branch on without inspecting status codes. It
 * carries no additional fields beyond {@link AniLinkApiError}; its value is
 * the named type itself.
 *
 * @see {@link AniLinkApiError}
 */
export class AniLinkRestError extends AniLinkApiError {
    /**
     * Creates a REST error carrying the upstream HTTP status and body.
     *
     * @param status - The HTTP status returned by the upstream REST API.
     * @param data - The response body returned by the upstream REST API.
     * @param rawAxiosError - The original Axios error when raw diagnostics are enabled.
     * @param options - Additional error metadata such as rate-limit headers.
     */
    constructor(
        status: number,
        data: unknown,
        rawAxiosError?: unknown,
        options?: { rateLimit?: RateLimitInfo }
    ) {
        super(status, data, rawAxiosError, options);
        this.name = "AniLinkRestError";
    }
}

/**
 * Additional metadata attached to a transport failure.
 *
 * @see {@link AniLinkNetworkError.timeoutMs}
 */
export interface AniLinkNetworkErrorOptions {
    /** The effective per-attempt timeout in milliseconds, when a timeout was configured and enforced. */
    timeoutMs?: number;
    /**
     * `true` when the abort happened during the post-success rate-limit
     * pacing wait rather than while the request was in flight. The upstream
     * request itself succeeded in that case, so consumers can distinguish
     * "data was received but the caller's wait was cancelled" from a cancelled
     * request. Absent for every other abort.
     */
    abortedDuringPacing?: boolean;
}

/**
 * Network, timeout, cancellation, or circuit-breaker failure.
 *
 * @see {@link AniLinkErrorCodes.NETWORK}
 * @see {@link AniLinkErrorCodes.TIMEOUT}
 */
export class AniLinkNetworkError extends AniLinkError {
    /**
     * The effective timeout duration in milliseconds when this failure was a
     * timeout and a finite timeout was configured. Use it to correlate the
     * error with the `timeout` option that produced it; absent when the
     * timeout is disabled (`0`) or the failure is not a timeout.
     */
    declare public readonly timeoutMs?: number;

    /**
     * `true` when this abort happened during the post-success rate-limit
     * pacing wait (see {@link AniLinkNetworkErrorOptions.abortedDuringPacing}).
     * The upstream attempt already succeeded when this is set.
     */
    declare public readonly abortedDuringPacing?: boolean;

    /**
     * Creates a sanitized transport error.
     *
     * @param code - The stable code for the transport failure.
     * @param message - A safe message intended for application logs.
     * @param rawAxiosError - The original Axios error when raw diagnostics are enabled.
     * @param options - Additional transport metadata such as the effective timeout duration.
     */
    constructor(
        code:
            | typeof AniLinkErrorCodes.NETWORK
            | typeof AniLinkErrorCodes.TIMEOUT
            | typeof AniLinkErrorCodes.ABORTED
            | typeof AniLinkErrorCodes.CIRCUIT,
        message: string,
        rawAxiosError?: unknown,
        options?: AniLinkNetworkErrorOptions
    ) {
        super(message, code, rawAxiosError);
        this.name = "AniLinkNetworkError";
        if (options?.timeoutMs !== undefined) {
            this.timeoutMs = options.timeoutMs;
        }
        if (options?.abortedDuringPacing !== undefined) {
            this.abortedDuringPacing = options.abortedDuringPacing;
        }
    }
}
