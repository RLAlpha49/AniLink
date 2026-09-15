import { AniListOperation } from "../AniListOperation";
import type { RequestOptions } from "../../../../base/RequestHandler";
import { type ReviewResponse } from "../interfaces/responses/query/Review";
import { type MediaType } from "../types/Type";
import { type ReviewSort, ReviewSortMappings } from "../types/Sort";
import { ReviewSchema } from "../schemas/responses/query/Review";
import { composeDocument } from "../schemas/selection/composeSelection";
import { splitFieldsOption } from "../schemas/selection/fieldsSelection";
import type {
    DeepPick,
    FieldPath,
    FieldsResult,
    FieldsSelection,
} from "../schemas/selection/fieldsSelection";

/**
 * Keys selected in every composed review document.
 *
 * `id` is always selected: the handle callers need to follow up with any other call.
 */
export const REVIEW_ALWAYS: readonly string[] = ["id"];

/**
 * {@link ReviewVariables} contains variables for the {@link ReviewQuery} operation.
 *
 * See {@link ReviewQuery} and {@link ReviewResponse} for the operation and response shape.
 *
 * Values are validated before dispatch.
 *
 * @see https://docs.anilist.co/reference/object/review
 */
export interface ReviewVariables {
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
     * `mediaType` is a {@link MediaType} representing the type of the media.
     */
    mediaType?: MediaType;

    /**
     * `sort` is an array of {@link ReviewSort} values representing the sort order of the review.
     */
    sort?: ReviewSort[];

    /**
     * `asHtml` is a boolean indicating whether to return the result as HTML.
     */
    asHtml?: boolean;
}

/**
 * Validation metadata maps variables to runtime types for the {@link ReviewQuery.review} operation.
 *
 * Hoisted to module scope so repeated calls do not rebuild the same
 * validation metadata on every request.
 */
const ReviewMappings = {
    id: "number",
    mediaId: "number",
    userId: "number",
    mediaType: "string",
    sort: ReviewSortMappings,
    asHtml: "boolean",
};

/**
 * {@link ReviewQuery} executes the AniList review query through {@link AniListOperation}.
 * Its public operation is {@link ReviewQuery.review}.
 * @see https://docs.anilist.co/reference/object/review
 */
export class ReviewQuery extends AniListOperation {
    /**
     * {@link ReviewQuery.review} sends a query request to get review data.
     *
     * @param variables - Values from {@link ReviewVariables} for the query; at least one variable other
     * than `asHtml` must be set.
     * @returns The {@link ReviewResponse} returned by the query.
     * @see https://docs.anilist.co/reference/object/review
     * @param options - Optional {@link RequestOptions} merged over the instance-level settings for this call
     * only. Pass `fields` to request only a subset of the response — the document is composed from the
     * corresponding selections and the return type narrows to `DeepPick<ReviewResponse, K | "id">`:
     * the always-selected `id` is part of the narrowed type because the composed document always sends it.
     * Omit `fields` for the maximal selection and the full response.
     * @example
     * ```typescript
     * const result = await new ReviewQuery().review({ mediaId: 1 });
     * ```
     */
    async review(variables: ReviewVariables, options?: RequestOptions): Promise<ReviewResponse>;
    async review(
        variables: ReviewVariables,
        options: RequestOptions & { fields: undefined }
    ): Promise<ReviewResponse>;
    async review<K extends FieldPath<ReviewResponse>>(
        variables: ReviewVariables,
        options: RequestOptions & { fields: readonly K[] | undefined }
    ): Promise<DeepPick<ReviewResponse, K | "id">>;
    async review(
        variables: ReviewVariables,
        options?: RequestOptions & FieldsSelection<ReviewResponse>
    ): FieldsResult<ReviewResponse, "id"> {
        const query = `
      query ($id: Int, $mediaId: Int, $userId: Int, $mediaType: MediaType, $sort: [ReviewSort], $asHtml: Boolean) {
        Review (id: $id, mediaId: $mediaId, userId: $userId, mediaType: $mediaType, sort: $sort) {
          ${ReviewSchema}
        }
      }
    `;
        const { fields, transportOptions } = splitFieldsOption(options);
        return await this.execute<ReviewResponse>(
            composeDocument(query, fields, REVIEW_ALWAYS),
            variables,
            {
                requirements: [
                    {
                        kind: "notOnly",
                        names: ["asHtml"],
                        message: "The Review query requires at least one filter variable.",
                    },
                ],
                mappings: ReviewMappings,
                transportOptions,
            }
        );
    }
}
