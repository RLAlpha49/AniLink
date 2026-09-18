import type { CustomRequest } from "../CustomRequest";

/**
 * The `custom` member group of the `AniListApi` type.
 *
 * @see https://docs.anilist.co/reference/query
 * @see https://docs.anilist.co/reference/mutation
 */
export type AniListCustom = {
    /**
     * {@link AniListCustom.custom} sends a caller-authored GraphQL query or mutation document to AniList.
     * Use it as an escape hatch when no typed operation fits: the `query` string is sent
     * verbatim and the `variables` argument is forwarded as-is. A document with a single
     * root field resolves to the bare field value; a document with multiple root fields
     * resolves to the full `{ data }` envelope.
     * @param query - The GraphQL query or mutation document to send verbatim.
     * @param variables - The variables to forward with the request. Optional.
     * @param options - Optional per-request transport settings (`RequestOptions`) merged over the instance-level ones for this call only.
     * @returns {Promise<T>} A promise that resolves to the unwrapped response, typed as `T` (defaults to `unknown`).
     * @throws {AniLinkError} When the request fails. When AniList returns partial success (some fields resolve while others fail inside an HTTP 200 envelope), the thrown `AniLinkGraphQLError` exposes the resolved portion via its `partialData` field, so the fields that did resolve remain recoverable from the error.
     * @see https://docs.anilist.co/reference/query
     * @see https://docs.anilist.co/reference/mutation
     * @example
     * ```typescript
     * const viewer = await aniLink.anilist.custom('query {Viewer {id}}');
     *
     * const mutation = 'mutation ($about: String) {UpdateUser (about: $about) {id}}';
     * const variables = { about: "New about text" };
     * const response = await aniLink.anilist.custom(mutation, variables);
     * ```
     */
    custom: CustomRequest["custom"];
};
