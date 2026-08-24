import { APIWrapper } from "../../../base/APIWrapper";
import { type DeleteResult } from "../types/DeleteResult";

/**
 * `DeleteReviewVariables` is an interface that contains the variables that are required for the `DeleteReview` mutation.
 * It includes the review ID.
 * @see https://docs.anilist.co/reference/mutation
 */
export interface DeleteReviewVariables {
    /**
     * `id` is the ID of the review.
     */
    id: number;
}

/**
 * `DeleteReviewMutation` is a class representing a mutation to delete a review.
 * It includes a method to delete a review.
 * @see https://docs.anilist.co/reference/object/deleted
 */
export class DeleteReviewMutation extends APIWrapper {
    /**
     * `deleteReview` is a method that sends a mutation request to delete a review.
     *
     * The response is `{ deleted: boolean }`. A `true` value means the review was deleted by this
     * call; a `false` value means the review was not present (already deleted or never existed).
     * The mutation is therefore safe to retry after a partial failure: a `false` result confirms
     * the target is gone rather than reporting an error.
     *
     * @param variables - An object of type `DeleteReviewVariables` representing the variables for the mutation.
     * @returns A Promise that resolves to `{ deleted }`, where `deleted` is `true` when the review was deleted by this call and `false` when it was already absent.
     * @throws Will throw an error if the mutation request fails or if the provided variables do not pass the validation checks.
     * @see https://docs.anilist.co/reference/object/deleted
     */
    async deleteReview(variables: DeleteReviewVariables): Promise<DeleteResult> {
        const mutation = `
      mutation ($id: Int) {
        DeleteReview(id: $id) {
          deleted
        }
      }
    `;
        return await this.execute<DeleteResult>(mutation, variables, {
            requirements: [
                {
                    kind: "all",
                    names: ["id"],
                    message: "The DeleteReview mutation requires an id variable.",
                },
            ],
            mappings: {
                id: "number",
            },
            requiresAuth: true,
        });
    }
}
