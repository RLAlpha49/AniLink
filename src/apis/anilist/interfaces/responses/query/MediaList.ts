import { type Media } from "../../Media";
import { type FuzzyDate } from "../../FuzzyDate";
import { type BasicUser } from "../../Basic";

/**
 * `MediaListResponse` is an interface representing the response from a media list query.
 * It includes the id, user id, media id, status, score, progress, progress volumes, repeat, priority, private status, notes, hidden from status lists status, custom lists, advanced scores, started at date, completed at date, updated at timestamp, created at timestamp, media, and user.
 * @see https://docs.anilist.co/reference/object/medialist
 */
export interface MediaListResponse {
    /**
     * `id` is a number representing the id of the media list.
     */
    id: number;

    /**
     * `userId` is a number representing the id of the user associated with the media list.
     */
    userId: number;

    /**
     * `mediaId` is a number representing the id of the media associated with the media list.
     */
    mediaId: number;

    /**
     * `status` is a string representing the status of the media list.
     */
    status: string;

    /**
     * `score` is a number representing the score of the media list.
     */
    score: number;

    /**
     * `progress` is a number representing the progress of the media list.
     */
    progress: number;

    /**
     * `progressVolumes` is a number representing the progress volumes of the media list.
     */
    progressVolumes: number;

    /**
     * `repeat` is a number representing the repeat status of the media list.
     */
    repeat: number;

    /**
     * `priority` is a number representing the priority of the media list.
     */
    priority: number;

    /**
     * `private` is a boolean representing the privacy status of the media list.
     */
    private: boolean;

    /**
     * `notes` is a string representing the notes of the media list.
     */
    notes: string;

    /**
     * `hiddenFromStatusLists` is a boolean representing whether the media list is hidden from status lists.
     */
    hiddenFromStatusLists: boolean;

    /**
     * `customLists` is an array representing the custom lists of the media list.
     * A string array when queried with `asArray: true`, otherwise a map of list names to membership flags.
     */
    customLists: string[] | boolean[];

    /**
     * `advancedScores` is an array representing the advanced scores of the media list.
     */
    advancedScores: number[];

    /**
     * `startedAt` is a date representing when the media list started.
     */
    startedAt: FuzzyDate;

    /**
     * `completedAt` is a date representing when the media list was completed.
     */
    completedAt: FuzzyDate;

    /**
     * `updatedAt` is a number representing the timestamp when the media list was last updated.
     */
    updatedAt: number;

    /**
     * `createdAt` is a number representing the timestamp when the media list was created.
     */
    createdAt: number;

    /**
     * `media` is an instance of `Media` representing the media associated with the media list.
     */
    media: Media;

    /**
     * `user` is an instance representing the user associated with the media list.
     */
    user: BasicUser;
}
