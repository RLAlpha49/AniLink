import { AniListOperation } from "./AniListOperation";
import type { RequestOptions } from "../../../base/RequestHandler";
import { AniLinkValidationError } from "../../../base/AniLinkError";

/**
 * Matches a GraphQL document that declares an executable operation.
 *
 * Accepted shapes: an anonymous shorthand selection (`{ Viewer { id } }`),
 * or a document opening with the `query` or `mutation` keyword followed by
 * a selection set. Fragment-only documents are not executable, so they
 * are rejected.
 *
 * Leading `#` comment lines and whitespace are stripped before the test, so
 * a copied document that opens with a comment (`# fetch viewer\nquery { … }`)
 * validates locally exactly as the server would accept it.
 *
 * This is a deliberately lightweight guard, not a parser: it catches empty
 * payloads and non-documents locally so the most obvious mistakes fail fast
 * instead of as remote 400 responses. Full syntax validation is left to the
 * AniList API.
 */
const GRAPHQL_OPERATION_PATTERN = /^\s*(?:\{|(?:query|mutation)\b[\s\S]*\{)/;

/**
 * Strips leading `#` comment lines and blank lines from a GraphQL document
 * so the operation pattern can anchor at the first executable token. Only
 * the document head is stripped — comments between selections are untouched
 * and remain the server's concern.
 */
const stripLeadingComments = (query: string): string => {
    let rest = query;
    for (;;) {
        // Consume one leading blank-or-comment line per iteration; a flat
        // loop avoids the nested-quantifier regex the security linter flags.
        const line = /^[^\n]*\n/.exec(rest);
        if (line === null) {
            return rest;
        }
        if (!/^\s*(#|$)/.test(line[0])) {
            return rest;
        }
        rest = rest.slice(line[0].length);
    }
};

/**
 * `CustomRequest` sends caller-authored GraphQL documents to AniList — the
 * escape hatch for queries and mutations the typed operation surface does
 * not cover.
 *
 * @see https://docs.anilist.co/reference/query
 * @see https://docs.anilist.co/reference/mutation
 */
export class CustomRequest extends AniListOperation {
    /**
     * `custom` sends a caller-authored GraphQL query or mutation document.
     *
     * The response follows the same unwrapping rule as every other operation:
     * a document with a single root field resolves to the bare field value,
     * while a document with multiple root fields resolves to the full
     * `{ data }` envelope. Annotate `T` with the shape you expect — the bare
     * value for single-root-field documents, or the envelope type itself when
     * the document selects several root fields:
     *
     * ```typescript
     * const viewer = await aniLink.anilist.custom<{ id: number }>("query { Viewer { id } }");
     *
     * // Multi-root-field document: T is the full envelope.
     * const both = await aniLink.anilist.custom<{ data: { Media: { id: number }; User: { id: number } } }>(
     *     "query { Media (id: 1) { id } User (id: 1) { id } }"
     * );
     * ```
     *
     * @param query - The GraphQL document to execute. It must declare an executable operation: an anonymous shorthand selection (`{ Viewer { id } }`) or a `query`/`mutation` document. AniList's HTTP endpoint does not serve subscriptions, so `subscription` documents are rejected here rather than failing remotely.
     * @param variables - The variables for the document. This parameter is optional.
     * @param options - Optional per-request transport settings merged over the instance-level ones for this call only.
     * @returns A promise that resolves to the unwrapped response data for single-root-field documents, or the full `{ data }` envelope otherwise.
     * @throws An {@link AniLinkValidationError} when the query is empty or is not an executable document (for example a fragment-only definition).
     * @throws An `AniLinkError` when the request fails. When AniList returns partial success (some fields resolve while others fail inside an HTTP 200 envelope), the thrown `AniLinkGraphQLError` exposes the resolved portion via its `partialData` field, so the fields that did resolve remain recoverable from the error.
     * @see https://docs.anilist.co/reference/query
     * @see https://docs.anilist.co/reference/mutation
     */
    async custom<T = unknown>(
        query: string,
        variables: Record<string, unknown> = {},
        options?: RequestOptions
    ): Promise<T> {
        if (
            typeof query !== "string" ||
            !GRAPHQL_OPERATION_PATTERN.test(stripLeadingComments(query))
        ) {
            throw new AniLinkValidationError([
                "custom() requires an executable GraphQL document (an anonymous selection or a query/mutation operation)",
            ]);
        }
        return await this.request<T>(query, variables, { transportOptions: options });
    }
}
