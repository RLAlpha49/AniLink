import { APIWrapper } from "../../../base/APIWrapper";
import { type MediaTagCollectionResponse } from "../interfaces/responses/query/MediaTagCollection";

import { validateVariables } from "../../../base/ValidateVariables";
import { TagSchema } from "../schemas/Tag";

/**
 * `MediaTagCollectionVariables` is an interface representing the variables for the `MediaTagCollectionQuery`.
 * It includes optional parameters for querying media tag collection data.
 * @see https://docs.anilist.co/reference/query
 */
export interface MediaTagCollectionVariables {
    /**
     * `status` is a number representing the status of the media tag.
     */
    status?: number;
}

/**
 * `MediaTagCollectionQuery` is a class representing a query for media tag collection data.
 * It includes a method to send the media tag collection query and receive the response.
 * @see https://docs.anilist.co/reference/query
 */
export class MediaTagCollectionQuery extends APIWrapper {
    /**
     * `mediaTagCollection` is a method that sends a query request to get media tag collection data.
     *
     * @param variables - The variables for the query. If not provided, an empty object will be used.
     * @returns The response from the query request.
     * @see https://docs.anilist.co/reference/query
     */
    async mediaTagCollection(
        variables: MediaTagCollectionVariables = {}
    ): Promise<MediaTagCollectionResponse> {
        const variableTypeMappings = {
            status: "number",
        };

        validateVariables(variables, variableTypeMappings);

        const query = `
      query ($status: Int) {
        MediaTagCollection (status: $status) {
          ${TagSchema}
        }
      }
    `;

        return await this.request(query, variables);
    }
}
