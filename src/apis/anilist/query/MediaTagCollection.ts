import { APIWrapper } from "../../../base/APIWrapper";
import type { RequestOptions } from "../../../base/RequestHandler";
import { type MediaTagCollectionResponse } from "../interfaces/responses/query/MediaTagCollection";

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
 * The variable type mappings for the `mediaTagCollection` operation.
 *
 * Hoisted to module scope so repeated calls do not rebuild the same
 * validation metadata on every request.
 */
const MediaTagCollectionMappings = {
    status: "number",
};

/**
 * `MediaTagCollectionQuery` is a class representing a query for media tag collection data.
 * It includes a method to send the media tag collection query and receive the response.
 * @see https://docs.anilist.co/reference/object/mediatag
 */
export class MediaTagCollectionQuery extends APIWrapper {
    /**
     * `mediaTagCollection` is a method that sends a query request to get media tag collection data.
     *
     * @param variables - The variables for the query. If not provided, an empty object will be used.
     * @returns The response from the query request.
     * @see https://docs.anilist.co/reference/object/mediatag
     * @param options - Optional per-request transport settings merged over the instance-level ones for this call only.
     */
    async mediaTagCollection(
        variables: MediaTagCollectionVariables = {},
        options?: RequestOptions
    ): Promise<MediaTagCollectionResponse> {
        const query = `
      query ($status: Int) {
        MediaTagCollection (status: $status) {
          ${TagSchema}
        }
      }
    `;
        return await this.execute<MediaTagCollectionResponse>(query, variables, {
            mappings: MediaTagCollectionMappings,
            transportOptions: options,
        });
    }
}
