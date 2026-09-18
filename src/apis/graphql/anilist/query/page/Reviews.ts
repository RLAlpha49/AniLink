import { AniListOperation } from "../../AniListOperation";
import type { RequestOptions } from "../../../../../base/RequestHandler";

import { type ReviewsPageResponse } from "../../interfaces/responses/page/Reviews";
import { ReviewSortMappings } from "../../types/Sort";
import { ReviewSchema } from "../../schemas/responses/query/Review";
import { composeDocument } from "../../schemas/selection/composeSelection";
import { PAGE_ALWAYS, splitFieldsOption } from "../../schemas/selection/fieldsSelection";
import type {
    DeepPick,
    FieldPath,
    FieldsResult,
    FieldsSelection,
} from "../../schemas/selection/fieldsSelection";

/**
 * {@link ReviewsVariables} contains variables for the {@link ReviewsQuery} operation.
 *
 * See {@link ReviewsQuery} and {@link ReviewsPageResponse} for the operation and response shape.
 *
 * Values are validated before dispatch.
 *
 * @see https://docs.anilist.co/reference/object/review
 */
export interface ReviewsVariables {
    /**
     * `page` is a number representing the page number.
     */
    page?: number;

    /**
     * `perPage` is a number representing the number of items per page.
     */
    perPage?: number;

    /**
     * `id` is a number representing the id of the review.
     */
    id?: number;

    /**
     * `mediaId` is a number representing the id of the media.
     */
    mediaId?: number;

    /**
     * `userId` is a number representing the id of the user.
     */
    userId?: number;

    /**
     * `mediaType` is a string representing the type of the media.
     */
    mediaType?: string;

    /**
     * `sort` is an array of strings representing the sort order; `ReviewSort` values.
     */
    sort?: string[];

    /**
     * `asHtml` is a boolean representing whether to return the result as HTML.
     */
    asHtml?: boolean;
}

/**
 * Validation metadata maps variables to runtime types for the `reviews` operation.
 *
 * Hoisted to module scope so repeated calls do not rebuild the same
 * validation metadata on every request.
 */
const ReviewsMappings = {
    page: "number",
    perPage: "number",
    id: "number",
    mediaId: "number",
    userId: "number",
    mediaType: "string",
    sort: ReviewSortMappings,
    asHtml: "boolean",
};

/**
 * {@link ReviewsQuery} executes the paginated AniList reviews query through {@link AniListOperation}.
 * Its public operation is {@link ReviewsQuery.reviews}.
 * @see https://docs.anilist.co/reference/object/review
 */
export class ReviewsQuery extends AniListOperation {
    /**
     * {@link ReviewsQuery.reviews} sends a query request to get a page of reviews.
     *
     * @param variables - Values from {@link ReviewsVariables} for the query; `page` and `perPage` select the
     * slice of results.
     * @returns The {@link ReviewsPageResponse} for the requested page, with pagination metadata.
     * @see https://docs.anilist.co/reference/object/review
     * @param options - Optional {@link RequestOptions} merged over the instance-level settings for this call
     * only. Pass `fields` to request only a subset of the response — the document is composed from the
     * corresponding selections and the return type narrows to `DeepPick<ReviewsPageResponse, K | "pageInfo">`:
     * the always-selected `pageInfo` is part of the narrowed type because the composed document always sends
     * it. Omit `fields` for the maximal selection and the full response.
     * @example
     * ```typescript
     * const result = await new ReviewsQuery().reviews({ mediaId: 1, page: 1 });
     * ```
     */
    async reviews(
        variables: ReviewsVariables,
        options?: RequestOptions & { fields?: undefined }
    ): Promise<ReviewsPageResponse>;
    async reviews(
        variables: ReviewsVariables,
        options: RequestOptions & { fields: undefined }
    ): Promise<ReviewsPageResponse>;
    async reviews<K extends FieldPath<ReviewsPageResponse>>(
        variables: ReviewsVariables,
        options: RequestOptions & { fields: readonly K[] | undefined }
    ): Promise<DeepPick<ReviewsPageResponse, K | "pageInfo">>;
    async reviews(
        variables: ReviewsVariables,
        options?: RequestOptions & FieldsSelection<ReviewsPageResponse>
    ): FieldsResult<ReviewsPageResponse, "pageInfo"> {
        const query = `
      query ($page: Int, $perPage: Int, $id: Int, $mediaId: Int, $userId: Int, $mediaType: MediaType, $sort: [ReviewSort], $asHtml: Boolean) {
        Page (page: $page, perPage: $perPage) {
          pageInfo {
            total
            perPage
            currentPage
            lastPage
            hasNextPage
          }
          reviews (id: $id, mediaId: $mediaId, userId: $userId, mediaType: $mediaType, sort: $sort) {
            ${ReviewSchema}
          }
        }
      }
    `;
        const { fields, transportOptions } = splitFieldsOption(options);
        return await this.execute<ReviewsPageResponse>(
            composeDocument(query, fields, PAGE_ALWAYS),
            variables,
            {
                mappings: ReviewsMappings,
                transportOptions,
            }
        );
    }
}
