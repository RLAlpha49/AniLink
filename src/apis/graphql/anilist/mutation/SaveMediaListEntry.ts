import { AniListOperation } from "../AniListOperation";
import type { RequestOptions } from "../../../../base/RequestHandler";

import { type FuzzyDateInput, FuzzyDateMappings } from "../types/FuzzyDate";
import { type MediaListStatus, MediaListStatusMappings } from "../types/Status";
import { type MediaListResponse } from "../interfaces/responses/query/MediaList";
import { FuzzyDateSchema } from "../schemas/FuzzyDate";

/**
 * {@link SaveMediaListEntryVariables} contains variables for the {@link SaveMediaListEntryMutation} operation.
 *
 * See the {@link SaveMediaListEntryMutation} operation and {@link MediaListResponse} for the response shape.
 *
 * Values are validated before dispatch.
 *
 * @see https://docs.anilist.co/reference/object/medialist
 */
export interface SaveMediaListEntryVariables {
    /**
     * `id` is a number representing the id of the media list entry.
     */
    id?: number;

    /**
     * `mediaId` is a number representing the id of the media associated with the media list entry.
     */
    mediaId: number;

    /**
     * `status` is a {@link MediaListStatus} representing the status of the media list entry.
     */
    status?: MediaListStatus;

    /**
     * `score` is a number representing the score of the media list entry.
     */
    score?: number;

    /**
     * `scoreRaw` is a number representing the raw score of the media list entry.
     */
    scoreRaw?: number;

    /**
     * `progress` is a number representing the progress of the media list entry.
     */
    progress?: number;

    /**
     * `progressVolumes` is a number representing the progress volumes of the media list entry.
     */
    progressVolumes?: number;

    /**
     * `repeat` is a number representing the repeat status of the media list entry.
     */
    repeat?: number;

    /**
     * `priority` is a number representing the priority of the media list entry.
     */
    priority?: number;

    /**
     * `private` is a boolean representing the privacy status of the media list entry.
     */
    private?: boolean;

    /**
     * `notes` is a string representing the notes of the media list entry.
     */
    notes?: string;

    /**
     * `hiddenFromStatusLists` is a boolean representing whether the media list entry is hidden from status lists.
     */
    hiddenFromStatusLists?: boolean;

    /**
     * `customLists` is an array of strings representing the custom lists of the media list entry.
     */
    customLists?: string[];

    /**
     * `advancedScores` is an array of numbers representing the advanced scores of the media list entry.
     */
    advancedScores?: number[];

    /**
     * `startedAt` is a {@link FuzzyDateInput} representing when the media list entry started.
     */
    startedAt?: FuzzyDateInput;

    /**
     * `completedAt` is a {@link FuzzyDateInput} representing when the media list entry was completed.
     */
    completedAt?: FuzzyDateInput;
}

/**
 * Validation metadata maps {@link SaveMediaListEntryVariables} to runtime types for the
 * `saveMediaListEntry` operation.
 *
 * Hoisted to module scope so repeated calls do not rebuild the same
 * validation metadata on every request.
 */
const SaveMediaListEntryMappings = {
    id: "number",
    mediaId: "number",
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
    customLists: "string[]",
    advancedScores: "number[]",
    startedAt: FuzzyDateMappings,
    completedAt: FuzzyDateMappings,
};

/**
 * {@link SaveMediaListEntryMutation} executes the AniList mutation through {@link AniListOperation}.
 * Its public operation is {@link SaveMediaListEntryMutation.saveMediaListEntry}; variables use
 * {@link SaveMediaListEntryVariables}; validation metadata is kept local to the operation.
 * @see https://docs.anilist.co/reference/object/medialist
 */
export class SaveMediaListEntryMutation extends AniListOperation {
    /**
     * {@link SaveMediaListEntryMutation.saveMediaListEntry} sends a mutation request to save a media list entry.
     *
     * @param variables - Values from {@link SaveMediaListEntryVariables} for the mutation.
     * @returns The {@link MediaListResponse} returned by the mutation.
     * @throws Throws if no authentication token is configured, `mediaId` is missing or invalid, or the mutation request fails.
     * @see https://docs.anilist.co/reference/object/medialist
     * @param options - Optional {@link RequestOptions} merged over the instance-level settings for this call only.
     * @example
     * ```typescript
     * const result = await new SaveMediaListEntryMutation("your-token").saveMediaListEntry({ mediaId: 1, status: "COMPLETED" });
     * ```
     */
    async saveMediaListEntry(
        variables: SaveMediaListEntryVariables,
        options?: RequestOptions
    ): Promise<MediaListResponse> {
        const mutation = `
      mutation ($id: Int, $mediaId: Int, $status: MediaListStatus, $score: Float, $scoreRaw: Int, $progress: Int, $progressVolumes: Int, $repeat: Int, $priority: Int, $private: Boolean, $notes: String, $hiddenFromStatusLists: Boolean, $customLists: [String], $advancedScores: [Float], $startedAt: FuzzyDateInput, $completedAt: FuzzyDateInput) {
        SaveMediaListEntry(id: $id, mediaId: $mediaId, status: $status, score: $score, scoreRaw: $scoreRaw, progress: $progress, progressVolumes: $progressVolumes, repeat: $repeat, priority: $priority, private: $private, notes: $notes, hiddenFromStatusLists: $hiddenFromStatusLists, customLists: $customLists, advancedScores: $advancedScores, startedAt: $startedAt, completedAt: $completedAt) {
          id
          mediaId
          status
          score
          progress
          progressVolumes
          repeat
          priority
          private
          notes
          hiddenFromStatusLists
          customLists
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
        return await this.execute<MediaListResponse>(mutation, variables, {
            requirements: [
                {
                    kind: "all",
                    names: ["mediaId"],
                    message: "The SaveMediaListEntry mutation requires a mediaId variable.",
                },
            ],
            mappings: SaveMediaListEntryMappings,
            requiresAuth: true,
            transportOptions: options,
        });
    }
}
