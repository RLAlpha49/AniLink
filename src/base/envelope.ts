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
 * failure) throws an `AniLinkGraphQLError` instead of returning data.
 *
 * @param response - The full GraphQL response envelope.
 * @param headers - The response headers, when available, so rate-limit and
 * content-type metadata from the HTTP 200 envelope are preserved on the
 * thrown {@link AniLinkGraphQLError} (AniList returns `x-ratelimit-*` headers
 * even on envelopes carrying GraphQL-level errors).
 * @returns The unwrapped single-root-field value, or the envelope as-is.
 * @throws An `AniLinkGraphQLError` when the envelope carries GraphQL errors.
 * @see {@link GraphQLResponseEnvelope}
 */
export const unwrapGraphQLResponse = <T>(
    response: unknown,
    headers?: Record<string, unknown>
): T => {
    const envelope = response as GraphQLResponseEnvelope | null | undefined;

    if (Array.isArray(envelope?.errors) && envelope.errors.length > 0) {
        throw new AniLinkGraphQLError(envelope.errors, envelope?.data, undefined, {
            rateLimit: getRateLimitInfo(headers),
            contentType: getResponseContentType(headers ?? {}),
        });
    }

    const unwrapped = unwrapSingleRootField<T>(response);
    return unwrapped === undefined ? (response as T) : unwrapped;
};
