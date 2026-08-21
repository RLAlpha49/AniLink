import { type FuzzyDate } from "../../FuzzyDate";
import { type Media } from "../../Media";
import { FuzzyDateSchema } from "../../../schemas/FuzzyDate";
import { MediaSchema } from "../../../schemas/responses/query/Media";

/**
 * `MediaListCollectionResponse` is an interface representing the response from a media list collection query.
 * It includes the `MediaListCollection` object with its lists and hasNextChunk status.
 * @see https://docs.anilist.co/reference/object/medialistcollection
 */
export interface MediaListCollectionResponse {
    /**
     * `lists` is an array of objects, each representing a list with entries, name, isCustomList, isSplitCompletedList, and status.
     */
    lists: Array<{
        /**
         * `entries` is an array of objects, each representing a media list entry.
         * Each entry includes the id, userId, mediaId, status, score, progress, progressVolumes, repeat, priority, private, notes, hiddenFromStatusLists, customLists, advancedScores, startedAt, completedAt, updatedAt, createdAt, and media.
         */
        entries: Array<{
            /**
             * `id` is a number representing the id of the media list entry.
             */
            id: number;

            /**
             * `userId` is a number representing the id of the user associated with the media list entry.
             */
            userId: number;

            /**
             * `mediaId` is a number representing the id of the media associated with the media list entry.
             */
            mediaId: number;

            /**
             * `status` is a string representing the status of the media list entry.
             */
            status: string;

            /**
             * `score` is a number representing the score of the media list entry.
             */
            score: number;

            /**
             * `progress` is a number representing the progress of the media list entry.
             */
            progress: number;

            /**
             * `progressVolumes` is a number representing the progress volumes of the media list entry.
             */
            progressVolumes: number;

            /**
             * `repeat` is a number representing the repeat status of the media list entry.
             */
            repeat: number;

            /**
             * `priority` is a number representing the priority of the media list entry.
             */
            priority: number;

            /**
             * `private` is a boolean representing the privacy status of the media list entry.
             */
            private: boolean;

            /**
             * `notes` is a string representing the notes of the media list entry.
             */
            notes: string;

            /**
             * `hiddenFromStatusLists` is a boolean representing whether the media list entry is hidden from status lists.
             */
            hiddenFromStatusLists: boolean;

            /**
             * `customLists` is an array of booleans representing the custom lists of the media list entry.
             */
            customLists: boolean[];

            /**
             * `advancedScores` is an array of numbers representing the advanced scores of the media list entry.
             */
            advancedScores: number[];

            /**
             * `startedAt` is an instance of `FuzzyDate` representing the date when the media list entry started.
             */
            startedAt: FuzzyDate;

            /**
             * `completedAt` is an instance of `FuzzyDate` representing the date when the media list entry was completed.
             */
            completedAt: FuzzyDate;

            /**
             * `updatedAt` is a number representing the timestamp when the media list entry was last updated.
             */
            updatedAt: number;

            /**
             * `createdAt` is a number representing the timestamp when the media list entry was created.
             */
            createdAt: number;

            /**
             * `media` is an instance of `Media` representing the media associated with the media list entry.
             */
            media: Media;
        }>;
        /**
         * `name` is a string representing the name of the list in the media list collection.
         */
        name: string;

        /**
         * `isCustomList` is a boolean indicating whether the list is a custom list.
         */
        isCustomList: boolean;

        /**
         * `isSplitCompletedList` is a boolean indicating whether the list is a split completed list.
         */
        isSplitCompletedList: boolean;

        /**
         * `status` is a string representing the status of the list in the media list collection.
         */
        status: string;
    }>;
    /**
     * `hasNextChunk` is a boolean indicating whether more chunks remain in the media list collection.
     * When `true`, advance the `chunk` variable and re-issue the query to fetch the next chunk.
     * Use the shared `paginateChunks` helper (see `src/base/Paginator.ts`) to walk chunks with a guard.
     */
    hasNextChunk: boolean;
}
