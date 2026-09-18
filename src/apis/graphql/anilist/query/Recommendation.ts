import { AniListOperation } from "../AniListOperation";
import type { RequestOptions } from "../../../../base/RequestHandler";
import { type RecommendationResponse } from "../interfaces/responses/query/Recommendation";
import { type RecommendationSort, RecommendationSortMappings } from "../types/Sort";
import { RecommendationSchema } from "../schemas/responses/query/Recommendation";
import { composeDocument } from "../schemas/selection/composeSelection";
import { splitFieldsOption } from "../schemas/selection/fieldsSelection";
import type {
    DeepPick,
    FieldPath,
    FieldsResult,
    FieldsSelection,
} from "../schemas/selection/fieldsSelection";

/**
 * Keys selected in every composed recommendation document.
 *
 * `id` is always selected: the handle callers need to follow up with any other call.
 */
export const RECOMMENDATION_ALWAYS: readonly string[] = ["id"];

/**
 * {@link RecommendationVariables} contains variables for the {@link RecommendationQuery} operation.
 *
 * See {@link RecommendationQuery} and {@link RecommendationResponse} for the operation and response shape.
 *
 * Values are validated before dispatch.
 *
 * @see https://docs.anilist.co/reference/object/recommendation
 */
export interface RecommendationVariables {
    /**
     * `id` is a number representing the id of the recommendation.
     */
    id?: number;

    /**
     * `mediaId` is a number representing the id of the media.
     */
    mediaId?: number;

    /**
     * `mediaRecommendationId` is a number representing the id of the media recommendation.
     */
    mediaRecommendationId?: number;

    /**
     * `userId` is a number representing the id of the user.
     */
    userId?: number;

    /**
     * `rating` is a number representing the rating of the recommendation.
     */
    rating?: number;

    /**
     * `onList` is a boolean indicating whether the recommendation is on the list.
     */
    onList?: boolean;

    /**
     * `rating_greater` is a number representing the rating greater than the recommendation.
     */
    rating_greater?: number;

    /**
     * `rating_lesser` is a number representing the rating lesser than the recommendation.
     */
    rating_lesser?: number;

    /**
     * `sort` is an array of {@link RecommendationSort} values representing the sort order of the recommendation.
     */
    sort?: RecommendationSort[];

    /**
     * `asHtml` is a boolean indicating whether to return the result as HTML.
     */
    asHtml?: boolean;
}

/**
 * Validation metadata maps variables to runtime types for the {@link RecommendationQuery.recommendation} operation.
 *
 * Hoisted to module scope so repeated calls do not rebuild the same
 * validation metadata on every request.
 */
const RecommendationMappings = {
    id: "number",
    mediaId: "number",
    mediaRecommendationId: "number",
    userId: "number",
    rating: "number",
    onList: "boolean",
    rating_greater: "number",
    rating_lesser: "number",
    sort: RecommendationSortMappings,
    asHtml: "boolean",
};

/**
 * {@link RecommendationQuery} executes the AniList recommendation query through {@link AniListOperation}.
 * Its public operation is {@link RecommendationQuery.recommendation}.
 * @see https://docs.anilist.co/reference/object/recommendation
 */
export class RecommendationQuery extends AniListOperation {
    /**
     * {@link RecommendationQuery.recommendation} sends a query request to get recommendation data.
     *
     * @param variables - Values from {@link RecommendationVariables} for the query; at least one variable
     * other than `asHtml` must be set.
     * @returns The {@link RecommendationResponse} returned by the query.
     * @see https://docs.anilist.co/reference/object/recommendation
     * @param options - Optional {@link RequestOptions} merged over the instance-level settings for this call
     * only. Pass `fields` to request only a subset of the response — the document is composed from the
     * corresponding selections and the return type narrows to `DeepPick<RecommendationResponse, K | "id">`:
     * the always-selected `id` is part of the narrowed type because the composed document always sends it.
     * Omit `fields` for the maximal selection and the full response.
     * @example
     * ```typescript
     * const result = await new RecommendationQuery().recommendation({ mediaId: 1 });
     * ```
     */
    async recommendation(
        variables: RecommendationVariables,
        options?: RequestOptions & { fields?: undefined }
    ): Promise<RecommendationResponse>;
    async recommendation(
        variables: RecommendationVariables,
        options: RequestOptions & { fields: undefined }
    ): Promise<RecommendationResponse>;
    async recommendation<K extends FieldPath<RecommendationResponse>>(
        variables: RecommendationVariables,
        options: RequestOptions & { fields: readonly K[] | undefined }
    ): Promise<DeepPick<RecommendationResponse, K | "id">>;
    async recommendation(
        variables: RecommendationVariables,
        options?: RequestOptions & FieldsSelection<RecommendationResponse>
    ): FieldsResult<RecommendationResponse, "id"> {
        const query = `
      query ($id: Int, $mediaId: Int, $mediaRecommendationId: Int, $userId: Int, $rating: Int, $onList: Boolean, $rating_greater: Int, $rating_lesser: Int, $sort: [RecommendationSort], $asHtml: Boolean) {
        Recommendation (id: $id, mediaId: $mediaId, mediaRecommendationId: $mediaRecommendationId, userId: $userId, rating: $rating, onList: $onList, rating_greater: $rating_greater, rating_lesser: $rating_lesser, sort: $sort) {
          ${RecommendationSchema}
        }
      }
    `;
        const { fields, transportOptions } = splitFieldsOption(options);
        return await this.execute<RecommendationResponse>(
            composeDocument(query, fields, RECOMMENDATION_ALWAYS),
            variables,
            {
                requirements: [
                    {
                        kind: "notOnly",
                        names: ["asHtml"],
                        message: "The Recommendation query requires at least one filter variable.",
                    },
                ],
                mappings: RecommendationMappings,
                transportOptions,
            }
        );
    }
}
