import { APIWrapper } from "../../base/APIWrapper";
import { AniLinkValidationError } from "../../base/AniLinkError";

/**
 * Matches a GraphQL document that declares a `query` or `mutation` operation.
 *
 * This is a deliberately lightweight guard, not a parser: it catches empty
 * payloads and missing operation keywords locally so the most obvious mistakes
 * fail fast instead of as remote 400 responses. Full syntax validation is left
 * to the AniList API.
 */
const GRAPHQL_OPERATION_PATTERN = /^\s*(?:query|mutation)\b[\s\S]*\{/;

/**
 * `CustomRequest` is a class representing a custom query or mutation by the user.
 * @see https://docs.anilist.co/reference/query
 * @see https://docs.anilist.co/reference/mutation
 */
export class CustomRequest extends APIWrapper {
    /**
     * `custom` is a method that sends a custom query or mutation by the user.
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
     * @param query - The GraphQL document to execute. It must declare a `query` or `mutation` operation.
     * @param variables - The variables for the document. This parameter is optional.
     * @returns A promise that resolves to the unwrapped response data for single-root-field documents, or the full `{ data }` envelope otherwise.
     * @throws An `AniLinkValidationError` when the query is empty or does not declare a `query` or `mutation` operation.
     * @throws An `AniLinkError` when the request fails.
     * @see https://docs.anilist.co/reference/query
     * @see https://docs.anilist.co/reference/mutation
     */
    async custom<T = unknown>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
        if (typeof query !== "string" || !GRAPHQL_OPERATION_PATTERN.test(query)) {
            throw new AniLinkValidationError([
                "custom() requires a GraphQL document declaring a query or mutation operation",
            ]);
        }
        return await this.request<T>(query, variables);
    }
}
