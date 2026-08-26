/**
 * Response interfaces generated from the schema fragments under
 * `src/apis/anilist/schemas/` and the committed AniList schema snapshot.
 * Run `npm run interfaces:generate` after changing a fragment;
 * do not edit the generated block by hand.
 */
// @generated-start
// Content between the generation markers is produced by scripts/generate-interfaces.ts; do not edit by hand.

/**
 * `BasicUser` — the minimal user shape embedded in likes and replies.
 *
 * Generated from the schema fragments; do not edit by hand.
 * @see https://docs.anilist.co/reference/object/user
 */
export interface BasicUser {
    /**
     * The id of the user
     */
    id: number;

    /**
     * The name of the user
     */
    name: string;

    /**
     * The user's avatar images
     */
    avatar: {
        /**
         * The avatar of user at its largest size
         */
        large: string;
    };
}

/**
 * `BasicThread` — the minimal thread shape embedded in notifications.
 *
 * Generated from the schema fragments; do not edit by hand.
 * @see https://docs.anilist.co/reference/object/thread
 */
export interface BasicThread {
    /**
     * The id of the thread
     */
    id: number;

    /**
     * The title of the thread
     */
    title: string;

    /**
     * The text body of the thread (Markdown)
     */
    body: string;

    /**
     * The url for the thread page on the AniList website
     */
    siteUrl: string;
}

/**
 * `BasicComment` — the minimal thread-comment shape embedded in notifications.
 *
 * Generated from the schema fragments; do not edit by hand.
 * @see https://docs.anilist.co/reference/object/threadcomment
 */
export interface BasicComment {
    /**
     * The id of the comment
     */
    id: number;

    /**
     * The user id of the comment's owner
     */
    userId: number;

    /**
     * The id of thread the comment belongs to
     */
    threadId: number;
}

// @generated-end
