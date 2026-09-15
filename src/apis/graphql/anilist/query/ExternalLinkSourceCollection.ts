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
 * @see https://docs.anilist.co/reference/object/mediaexternallink
 */
export interface ExternalLinkSourceCollectionVariables {
    /**
     * `id` is a number filtering the collection by the id of the external link source.
     */
    id?: number;

    /**
     * `type` is a string filtering by the type of the external link; an `ExternalLinkType` value.
     */
    type?: string;

    /**
     * `mediaType` is a {@link MediaType} filtering the collection by the media type of the links.
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
 * @see https://docs.anilist.co/reference/object/mediaexternallink
 */
export class ExternalLinkSourceCollectionQuery extends AniListOperation {
    /**
     * {@link ExternalLinkSourceCollectionQuery.externalLinkSourceCollection} sends a query request to get
     * the external link sources. AniList types the field as a list, so the resolved value is an array
     * of link sources.
     *
     * @param variables - Optional values from {@link ExternalLinkSourceCollectionVariables}; defaults to an empty object.
     * @returns The {@link ExternalLinkSourceCollectionResponse} data; the resolved value is an array
     * of link sources at runtime.
     * @see https://docs.anilist.co/reference/object/mediaexternallink
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
