import { AniListOperation } from "../AniListOperation";
import type { RequestOptions } from "../../../../base/RequestHandler";
import { type ExternalLinkSourceCollectionResponse } from "../interfaces/responses/query/ExternalLinkSourceCollection";
import { type MediaType, MediaTypeMappings } from "../types/Type";

/**
 * {@link ExternalLinkSourceCollectionVariables} contains variables for the {@link ExternalLinkSourceCollectionQuery} operation.
 *
 * See {@link ExternalLinkSourceCollectionQuery} and {@link ExternalLinkSourceCollectionResponse} for the operation and response shape.
 *
 * Values are validated before dispatch.
 *
 * @see https://docs.anilist.co/reference/query
 */
export interface ExternalLinkSourceCollectionVariables {
    /**
     * `id` is a number representing the id of the external link source collection.
     */
    id?: number;

    /**
     * `type` is a string representing the type of the external link source collection.
     */
    type?: string;

    /**
     * `mediaType` is a string representing the media type of the external link source collection.
     */
    mediaType?: MediaType;
}

/**
 * The variable type mappings for the {@link ExternalLinkSourceCollectionQuery.externalLinkSourceCollection} operation.
 *
 * Hoisted to module scope so repeated calls do not rebuild the same
 * validation metadata on every request.
 */
const ExternalLinkSourceCollectionMappings = {
    id: "number",
    type: "string",
    mediaType: MediaTypeMappings,
};

/**
 * {@link ExternalLinkSourceCollectionQuery} executes the AniList external-link-source query through {@link AniListOperation}.
 * Its public operation is {@link ExternalLinkSourceCollectionQuery.externalLinkSourceCollection}.
 * @see https://docs.anilist.co/reference/query
 */
export class ExternalLinkSourceCollectionQuery extends AniListOperation {
    /**
     * {@link ExternalLinkSourceCollectionQuery.externalLinkSourceCollection} sends a query request to get external link source collections.
     *
     * @param variables - Optional values from {@link ExternalLinkSourceCollectionVariables}; defaults to an empty object.
     * @returns The {@link ExternalLinkSourceCollectionResponse} returned by the query.
     * @see https://docs.anilist.co/reference/query
     * @param options - Optional {@link RequestOptions} merged over the instance-level settings for this call only.
     * @example
     * ```typescript
     * const result = await new ExternalLinkSourceCollectionQuery().externalLinkSourceCollection({});
     * ```
     */
    async externalLinkSourceCollection(
        variables: ExternalLinkSourceCollectionVariables = {},
        options?: RequestOptions
    ): Promise<ExternalLinkSourceCollectionResponse> {
        const query = `
      query ($id: Int, $type: ExternalLinkType, $mediaType: ExternalLinkMediaType) {
        ExternalLinkSourceCollection (id: $id, type: $type, mediaType: $mediaType) {
          id
          url
          site
          siteId
          type
          language
          color
          icon
          notes
          isDisabled
        }
      }
    `;
        return await this.execute<ExternalLinkSourceCollectionResponse>(query, variables, {
            mappings: ExternalLinkSourceCollectionMappings,
            transportOptions: options,
        });
    }
}
