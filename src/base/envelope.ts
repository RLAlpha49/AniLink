/**
 * GraphQL response-envelope unwrapping.
 *
 * The AniList API returns every operation's result inside a `{ data }`
 * envelope, optionally carrying an `errors` array for GraphQL-level failures
 * returned with an HTTP 200. This module owns the envelope type and the two
 * unwrapping helpers used by the request pipeline: the strict single-root-field
 * extractor and the tolerant wrapper that throws on envelope errors.
 * Rate-limit and content-type metadata from the HTTP 200 envelope are
 * preserved on the thrown {@link AniLinkGraphQLError} via the header helpers
 * in `./errors`.
 */
import { AniLinkGraphQLError, type GraphQLUpstreamError } from "./AniLinkError";
import { getRateLimitInfo, getResponseContentType } from "./errors";

/**
 * A GraphQL response envelope as returned by the AniList API.
 * The `data` field holds the root selection set of the operation.
 *
 * @see {@link unwrapGraphQLResponse}
 */
export interface GraphQLResponseEnvelope {
    /** Root selection set returned by the operation, when present. */
    data?: unknown;
    /** GraphQL-level failures returned inside the envelope, when present. */
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
 * @see {@link GraphQLResponseEnvelope}
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
 * Options controlling how {@link unwrapGraphQLResponse} treats an envelope
 * that carries both a usable `data` object and a non-empty `errors` array.
 *
 * @see {@link unwrapGraphQLResponse}
 */
export interface UnwrapOptions {
    /**
     * When `true`, a partial-success envelope (a `data` object with at
     * least one resolved root field, plus errors) resolves with the data
     * instead of throwing: the resolved fields are returned and the error
     * entries are surfaced through `onPartialData` so the failures stay
     * observable. Envelopes with errors and no usable `data` — `data:
     * null`, a non-object, or an object where every root field failed
     * (including one whose only entries resolved to `null`, the GraphQL
     * shape for a failed nullable root field) — still throw regardless of
     * this flag.
     */
    allowPartialData?: boolean;
    /**
     * Observer for the error entries of a partial-success envelope resolved
     * by `allowPartialData`. Receives the normalized `AniLinkGraphQLError` the
     * strict mode would have thrown, so consumers observe the same error
     * shape on both paths. The request pipeline routes this through its
     * failure reporter so the `onError` hook sees a fully populated context.
     * A throwing observer is isolated: the resolved data still wins.
     */
    onPartialData?: (error: AniLinkGraphQLError) => void;
}

/**
 * Whether a partial-success envelope carries at least one resolved root
 * field — the "usable data" gate for `allowPartialData`.
 *
 * Per GraphQL semantics, a nullable root field that errors comes back
 * inside `data` as `null` (not as `data: null`), so key presence alone
 * proves nothing: a `data: { Media: null }` envelope for a single-root
 * field document means the only root field failed. A field counts as
 * resolved only when its value is non-null; an envelope whose every root
 * field resolved to `null` has nothing usable to return and must throw
 * like the strict mode would.
 *
 * @param data - The envelope's `data` member, already checked non-null and
 * object-typed by the caller.
 * @returns Whether at least one root field resolved to a non-null value.
 */
const hasResolvedRootField = (data: object): boolean => {
    for (const value of Object.values(data)) {
        if (value !== null) {
            return true;
        }
    }
    return false;
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
 * failure) throws an `AniLinkGraphQLError` instead of returning data —
 * unless `options.allowPartialData` is set and the envelope also carries a
 * non-null `data` object, in which case the data is returned and the error
 * entries are reported through `options.onPartialData` with the same
 * `AniLinkGraphQLError` the strict mode would have thrown.
 *
 * @param response - The full GraphQL response envelope.
 * @param headers - The response headers, when available, so rate-limit and
 * content-type metadata from the HTTP 200 envelope are preserved on the
 * thrown {@link AniLinkGraphQLError} (AniList returns `x-ratelimit-*` headers
 * even on envelopes carrying GraphQL-level errors).
 * @param options - Partial-success controls; see {@link UnwrapOptions}.
 * @returns The unwrapped single-root-field value, or the envelope as-is.
 * @throws An `AniLinkGraphQLError` when the envelope carries GraphQL errors
 * and either no `allowPartialData` opt-in applies or no usable `data` object
 * accompanies them.
 * @see {@link GraphQLResponseEnvelope}
 */
export const unwrapGraphQLResponse = <T>(
    response: unknown,
    headers?: Record<string, unknown>,
    options?: UnwrapOptions
): T => {
    const envelope = response as GraphQLResponseEnvelope | null | undefined;

    if (Array.isArray(envelope?.errors) && envelope.errors.length > 0) {
        const error = new AniLinkGraphQLError(envelope.errors, envelope?.data, undefined, {
            rateLimit: getRateLimitInfo(headers),
            contentType: getResponseContentType(headers ?? {}),
        });
        // Partial-success opt-in: a multi-field document can resolve most
        // root fields while one fails. When usable data accompanies the
        // errors, return it and report the failure through `onPartialData`
        // with the same error the strict mode would have thrown, so
        // consumers get the resolved fields inline without losing
        // observability. "Usable" means a non-null object with at least one
        // resolved (non-null) root field: an empty `data: {}` means every
        // root field failed, and so does `data: { Media: null }` — the
        // GraphQL shape for a failed nullable root field — so there is
        // nothing to return and the envelope throws; returning the raw
        // envelope as `T` would hand the caller a shape its types do not
        // predict (or a bare `null` indistinguishable from a legitimate
        // one).
        const data = envelope?.data;
        if (
            options?.allowPartialData === true &&
            data !== null &&
            typeof data === "object" &&
            hasResolvedRootField(data)
        ) {
            // A throwing observer is isolated exactly like a throwing
            // lifecycle hook: the resolved data wins, and the observer
            // failure never becomes the request's failure.
            try {
                options.onPartialData?.(error);
            } catch {
                // The observer's failure is not the request's failure.
            }
            const unwrapped = unwrapSingleRootField<T>(response);
            return unwrapped === undefined ? (response as T) : unwrapped;
        }
        throw error;
    }

    const unwrapped = unwrapSingleRootField<T>(response);
    return unwrapped === undefined ? (response as T) : unwrapped;
};
