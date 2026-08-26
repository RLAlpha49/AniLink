/**
 * The `custom` member of the `AniListApi` type.
 */
import type { RequestOptions } from "../../../../base/RequestHandler";

export type AniListCustom = {
    /**
     * Custom query or mutation.
     * @param query - The query for the request.
     * @param variables - The variables for the request. This parameter is optional.
     * @returns {Promise<any>} A promise that resolves to the response from the request.
     *
     * @example
     * ```typescript
     * const viewer = await aniLink.anilist.custom('query {Viewer {id}}');
     *
     * const mutation = 'mutation ($about: String) {UpdateUser (about: $about) {id}}';
     * const variables = { about: "New about text" };
     * const response = await aniLink.anilist.custom(mutation, variables);
     * ```
     */
    custom: <T = unknown>(
        query: string,
        variables?: Record<string, unknown>,
        options?: RequestOptions
    ) => Promise<T>;
};
