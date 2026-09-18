import { AniListOperation } from "../AniListOperation";
import { composeDocument } from "../schemas/selection/composeSelection";
import { splitFieldsOption } from "../schemas/selection/fieldsSelection";
import type {
    DeepPick,
    FieldPath,
    FieldsResult,
    FieldsSelection,
} from "../schemas/selection/fieldsSelection";
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
     * `id` is the ID of the thread comment to update.
     */
    id: number;

    /**
     * `threadId` is the ID of the thread to post or update the comment on.
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
     * `locked` is a boolean that determines if the comment is locked.
     */
    locked: boolean;

    /**
     * `asHtml` is a boolean that determines whether the comment text is returned rendered as HTML.
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
     * Updates the thread comment named by `id` and returns the saved comment. The upstream
     * mutation also posts a comment on `threadId` when `id` is omitted, but
     * {@link SaveThreadCommentVariables} requires `id`, so the typed surface is update-only.
     *
     * @param variables - Values from {@link SaveThreadCommentVariables} for the mutation.
     * @returns The {@link ThreadCommentResponse} returned by the mutation.
     * @throws Throws if no authentication token is configured, `id` or `threadId` is missing, a variable has an invalid type, or the mutation request fails.
     * @see https://docs.anilist.co/reference/object/threadcomment
     * @param options - Optional {@link RequestOptions} merged over the instance-level settings for this call only. Pass `fields` to request only a subset of the response — the document is composed from the corresponding selections and the return type narrows to `DeepPick<ThreadCommentResponse, K>`. Omit `fields` for the maximal selection and the full response.
     * @example
     * ```typescript
     * const result = await new SaveThreadCommentMutation("your-token").saveThreadComment({ id: 1, threadId: 1, parentCommentId: 0, comment: "Hello, world!", locked: false, asHtml: true });
     * ```
     */
    async saveThreadComment(
        variables: SaveThreadCommentVariables,
        options?: RequestOptions & { fields?: undefined }
    ): Promise<ThreadCommentResponse>;
    async saveThreadComment(
        variables: SaveThreadCommentVariables,
        options: RequestOptions & { fields: undefined }
    ): Promise<ThreadCommentResponse>;
    async saveThreadComment<K extends FieldPath<ThreadCommentResponse>>(
        variables: SaveThreadCommentVariables,
        options: RequestOptions & { fields: readonly K[] | undefined }
    ): Promise<DeepPick<ThreadCommentResponse, K>>;
    async saveThreadComment(
        variables: SaveThreadCommentVariables,
        options?: RequestOptions & FieldsSelection<ThreadCommentResponse>
    ): FieldsResult<ThreadCommentResponse> {
        const mutation = `
      mutation ($id: Int, $threadId: Int, $parentCommentId: Int, $comment: String, $locked: Boolean, $asHtml: Boolean) {
        SaveThreadComment (id: $id, threadId: $threadId, parentCommentId: $parentCommentId, comment: $comment, locked: $locked) {
          ${ThreadCommentSchema}
        }
      }
    `;
        const { fields, transportOptions } = splitFieldsOption(options);
        return await this.execute<ThreadCommentResponse>(
            composeDocument(mutation, fields, []),
            variables,
            {
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
                transportOptions,
            }
        );
    }
}
