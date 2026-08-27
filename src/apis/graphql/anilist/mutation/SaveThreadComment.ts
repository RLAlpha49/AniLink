import { AniListOperation } from "../AniListOperation";
import type { RequestOptions } from "../../../../base/RequestHandler";
import { type ThreadCommentResponse } from "../interfaces/responses/query/ThreadComment";
import { ThreadCommentSchema } from "../schemas/responses/query/ThreadComment";

/**
 * {@link SaveThreadCommentVariables} contains variables for the {@link SaveThreadCommentMutation} operation.
 *
 * See the {@link SaveThreadCommentMutation} operation and {@link ThreadCommentResponse} for the response shape.
 *
 * Values are validated before dispatch.
 *
 * @see https://docs.anilist.co/reference/object/threadcomment
 */
export interface SaveThreadCommentVariables {
    /**
     * `id` is the ID of the thread.
     */
    id: number;

    /**
     * `threadId` is the ID of the thread.
     */
    threadId: number;

    /**
     * `parentCommentId` is the ID of the parent comment.
     */
    parentCommentId: number;

    /**
     * `comment` is the comment to be saved.
     */
    comment: string;

    /**
     * `locked` is a boolean that determines if the thread is locked.
     */
    locked: boolean;

    /**
     * `asHtml` is a boolean that determines if the response is in HTML format.
     */
    asHtml: boolean;
}

/**
 * Validation metadata maps {@link SaveThreadCommentVariables} to runtime types for the
 * `saveThreadComment` operation.
 *
 * Hoisted to module scope so repeated calls do not rebuild the same
 * validation metadata on every request.
 */
const SaveThreadCommentMappings = {
    id: "number",
    threadId: "number",
    parentCommentId: "number",
    comment: "string",
    locked: "boolean",
    asHtml: "boolean",
};

/**
 * {@link SaveThreadCommentMutation} executes the AniList mutation through {@link AniListOperation}.
 * Its public operation is {@link SaveThreadCommentMutation.saveThreadComment}; variables use
 * {@link SaveThreadCommentVariables}; validation metadata is kept local to the operation.
 * @see https://docs.anilist.co/reference/object/threadcomment
 */
export class SaveThreadCommentMutation extends AniListOperation {
    /**
     * {@link SaveThreadCommentMutation.saveThreadComment} sends a mutation request to save a thread comment.
     *
     * @param variables - Values from {@link SaveThreadCommentVariables} for the mutation.
     * @returns The {@link ThreadCommentResponse} returned by the mutation.
     * @throws Throws if no authentication token is configured, `id` or `threadId` is missing, a variable has an invalid type, or the mutation request fails.
     * @see https://docs.anilist.co/reference/object/threadcomment
     * @param options - Optional {@link RequestOptions} merged over the instance-level settings for this call only.
     * @example
     * ```typescript
     * const result = await new SaveThreadCommentMutation("your-token").saveThreadComment({ id: 1, threadId: 1, parentCommentId: 0, comment: "Hello, world!", locked: false, asHtml: true });
     * ```
     */
    async saveThreadComment(
        variables: SaveThreadCommentVariables,
        options?: RequestOptions
    ): Promise<ThreadCommentResponse> {
        const mutation = `
      mutation ($id: Int, $threadId: Int, $parentCommentId: Int, $comment: String, $locked: Boolean, $asHtml: Boolean) {
        SaveThreadComment (id: $id, threadId: $threadId, parentCommentId: $parentCommentId, comment: $comment, locked: $locked) {
          ${ThreadCommentSchema}
        }
      }
    `;
        return await this.execute<ThreadCommentResponse>(mutation, variables, {
            requirements: [
                {
                    kind: "any",
                    names: ["id", "threadId"],
                    message:
                        "The SaveThreadComment mutation requires an id or a threadId variable.",
                },
            ],
            mappings: SaveThreadCommentMappings,
            requiresAuth: true,
            transportOptions: options,
        });
    }
}
