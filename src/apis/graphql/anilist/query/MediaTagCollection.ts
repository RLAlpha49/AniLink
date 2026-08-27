import { AniListOperation } from "../AniListOperation";
import type { RequestOptions } from "../../../../base/RequestHandler";
import { type MediaTagCollectionResponse } from "../interfaces/responses/query/MediaTagCollection";

import { TagSchema } from "../schemas/Tag";

/**
 * {@link MediaTagCollectionVariables} contains variables for the {@link MediaTagCollectionQuery} operation.
 *
 * See {@link MediaTagCollectionQuery} and {@link MediaTagCollectionResponse} for the operation and response shape.
 *
 * Values are validated with `MediaTagCollectionMappings` before dispatch.
 *
 * @see https://docs.anilist.co/reference/object/mediatag
 */
export interface MediaTagCollectionVariables {
    /**
     * `status` is a number representing the status of the media tag.
     */
    status?: number;
}

/**
 * Validation metadata maps variables to runtime types for the {@link MediaTagCollectionQuery.mediaTagCollection} operation.
 *
 * Hoisted to module scope so repeated calls do not rebuild the same
 * validation metadata on every request.
 */
const MediaTagCollectionMappings = {
    status: "number",
};

/**
 * {@link MediaTagCollectionQuery} executes the AniList media-tag collection query through {@link AniListOperation}.
 * Its public operation is {@link MediaTagCollectionQuery.mediaTagCollection}.
 * @see https://docs.anilist.co/reference/object/mediatag
 */
export class MediaTagCollectionQuery extends AniListOperation {
    /**
     * {@link MediaTagCollectionQuery.mediaTagCollection} sends a query request to get media tag collection data.
     *
     * @param variables - Optional values from {@link MediaTagCollectionVariables}; defaults to an empty object.
     * @returns The {@link MediaTagCollectionResponse} returned by the query.
     * @see https://docs.anilist.co/reference/object/mediatag
     * @param options - Optional {@link RequestOptions} merged over the instance-level settings for this call only.
     * @example
     * ```typescript
     * const result = await new MediaTagCollectionQuery().mediaTagCollection({});
     * ```
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
