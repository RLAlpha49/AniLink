import { APIWrapper } from "../../../base/APIWrapper";
import { type ExternalLinkSourceCollectionResponse } from "../interfaces/responses/query/ExternalLinkSourceCollection";
import { type MediaType, MediaTypeMappings } from "../types/Type";

/**
 * `ExternalLinkSourceCollectionVariables` is an interface representing the variables for the `ExternalLinkSourceCollectionQuery`.
 * It includes optional id, type, and mediaType.
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
 * `ExternalLinkSourceCollectionQuery` is a class representing a query for external link source collections.
 * It includes a method to get external link source collections.
 * @see https://docs.anilist.co/reference/query
 */
export class ExternalLinkSourceCollectionQuery extends APIWrapper {
    /**
     * `externalLinkSourceCollection` is a method that sends a query request to get external link source collections.
     *
     * @param variables - The variables for the query. If not provided, an empty object will be used.
     * @returns The response from the query request.
     * @see https://docs.anilist.co/reference/query
     */
    async externalLinkSourceCollection(
        variables: ExternalLinkSourceCollectionVariables = {}
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
            mappings: {
                id: "number",
                type: "string",
                mediaType: MediaTypeMappings,
            },
        });
    }
}
