import { AniListOperation } from "../AniListOperation";
import type { RequestOptions } from "../../../../base/RequestHandler";
import { type FuzzyDate } from "../interfaces/FuzzyDate";
import { FuzzyDateMappings } from "../types/FuzzyDate";
import { type MediaListStatus, MediaListStatusMappings } from "../types/Status";
import { type MediaListResponse } from "../interfaces/responses/query/MediaList";
import { FuzzyDateSchema } from "../schemas/FuzzyDate";

/**
 * {@link UpdateMediaListEntriesVariables} contains variables for the {@link UpdateMediaListEntriesMutation} operation.
 *
 * See {@link UpdateMediaListEntriesMutation} and {@link MediaListResponse} for the operation and response shape.
 *
 * @see https://docs.anilist.co/reference/object/medialist
 */
export interface UpdateMediaListEntriesVariables {
    /**
     * `status` is a {@link MediaListStatus} representing the status of the media list entries.
     */
    status?: MediaListStatus;

    /**
     * `score` is a number representing the score of the media list entries.
     */
    score?: number;

    /**
     * `scoreRaw` is a number representing the raw score of the media list entries.
     */
    scoreRaw?: number;

    /**
     * `progress` is a number representing the progress of the media list entries.
     */
    progress?: number;

    /**
     * `progressVolumes` is a number representing the progress volumes of the media list entries.
     */
    progressVolumes?: number;

    /**
     * `repeat` is a number representing the repeat status of the media list entries.
     */
    repeat?: number;

    /**
     * `priority` is a number representing the priority of the media list entries.
     */
    priority?: number;

    /**
     * `private` is a boolean representing the privacy status of the media list entries.
     */
    private?: boolean;

    /**
     * `notes` is a string representing the notes of the media list entries.
     */
    notes?: string;

    /**
     * `hiddenFromStatusLists` is a boolean representing whether the media list entries are hidden from status lists.
     */
    hiddenFromStatusLists?: boolean;

    /**
     * `advancedScores` is an array of numbers representing the advanced scores of the media list entries.
     */
    advancedScores?: number[];

    /**
     * `startedAt` is a `FuzzyDateInput` representing when the media list entries started.
     */
    startedAt?: FuzzyDate;

    /**
     * `completedAt` is a `FuzzyDateInput` representing when the media list entries were completed.
     */
    completedAt?: FuzzyDate;

    /**
     * `ids` is an array of numbers representing the ids of the media list entries.
     */
    ids: number[];
}

/**
 * Validation metadata maps {@link UpdateMediaListEntriesVariables} to runtime types for the
 * `updateMediaListEntries` operation.
 *
 * Hoisted to module scope so repeated calls do not rebuild the same
 * validation metadata on every request.
 */
const UpdateMediaListEntriesMappings = {
    status: MediaListStatusMappings,
    score: "number",
    scoreRaw: "number",
    progress: "number",
    progressVolumes: "number",
    repeat: "number",
    priority: "number",
    private: "boolean",
    notes: "string",
    hiddenFromStatusLists: "boolean",
    advancedScores: "number[]",
    startedAt: FuzzyDateMappings,
    completedAt: FuzzyDateMappings,
    ids: "number[]",
};

/**
 * {@link UpdateMediaListEntriesMutation} executes the AniList mutation through {@link AniListOperation}.
 * Its public operation is {@link UpdateMediaListEntriesMutation.updateMediaListEntries}; variables use
 * {@link UpdateMediaListEntriesVariables}; validation metadata is kept local to the operation.
 * @see https://docs.anilist.co/reference/object/medialist
 */
export class UpdateMediaListEntriesMutation extends AniListOperation {
    /**
     * {@link UpdateMediaListEntriesMutation.updateMediaListEntries} sends a mutation request to update media list entries.
     *
     * @param variables - Values from {@link UpdateMediaListEntriesVariables} for the mutation.
     * @returns The updated {@link MediaListResponse} entries returned by the mutation.
     * @throws Throws if no authentication token is configured, `ids` is missing or invalid, or the mutation request fails.
     * @see https://docs.anilist.co/reference/object/medialist
     * @param options - Optional {@link RequestOptions} merged over the instance-level settings for this call only.
     * @example
     * ```typescript
     * const result = await new UpdateMediaListEntriesMutation("your-token").updateMediaListEntries({ ids: [1], status: "CURRENT", progress: 1 });
     * ```
     */
    async updateMediaListEntries(
        variables: UpdateMediaListEntriesVariables,
        options?: RequestOptions
    ): Promise<MediaListResponse[]> {
        const mutation = `
      mutation ($status: MediaListStatus, $score: Float, $scoreRaw: Int, $progress: Int, $progressVolumes: Int, $repeat: Int, $priority: Int, $private: Boolean, $notes: String, $hiddenFromStatusLists: Boolean, $advancedScores: [Float], $startedAt: FuzzyDateInput, $completedAt: FuzzyDateInput, $ids: [Int]) {
        UpdateMediaListEntries(status: $status, score: $score, scoreRaw: $scoreRaw, progress: $progress, progressVolumes: $progressVolumes, repeat: $repeat, priority: $priority, private: $private, notes: $notes, hiddenFromStatusLists: $hiddenFromStatusLists, advancedScores: $advancedScores, startedAt: $startedAt, completedAt: $completedAt, ids: $ids) {
          id
          status
          score
          progress
          progressVolumes
          repeat
          priority
          private
          notes
          hiddenFromStatusLists
          advancedScores
          startedAt {
            ${FuzzyDateSchema}
          }
          completedAt {
            ${FuzzyDateSchema}
          }
        }
      }
    `;
        return await this.execute<MediaListResponse[]>(mutation, variables, {
            requirements: [
                {
                    kind: "all",
                    names: ["ids"],
                    message: "The UpdateMediaListEntries mutation requires an ids variable.",
                },
            ],
            mappings: UpdateMediaListEntriesMappings,
            requiresAuth: true,
            transportOptions: options,
        });
    }
}
