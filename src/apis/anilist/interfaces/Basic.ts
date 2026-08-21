/**
 * `BasicUser` is an interface representing a basic user.
 * It includes the id, name, and avatar each having their own properties.
 * @see https://docs.anilist.co/reference/object/user
 */
export interface BasicUser {
    /**
     * `id` is a number representing the unique identifier of the user.
     */
    id: number;

    /**
     * `name` is a string representing the name of the user.
     */
    name: string;

    /**
     * `avatar` is an object representing the avatar of the user.
     * It includes a large size avatar.
     */
    avatar: {
        /**
         * `large` is a string representing the URL of the large size avatar of the user.
         */
        large: string;
    };
}

/**
 * `BasicThread` is an interface representing a basic thread.
 * It includes the id, title, body, and site url each having their own properties.
 * @see https://docs.anilist.co/reference/object/thread
 */
export interface BasicThread {
    /**
     * `id` is a number representing the unique identifier of the thread.
     */
    id: number;

    /**
     * `title` is a string representing the title of the thread.
     */
    title: string;

    /**
     * `body` is a string representing the body content of the thread.
     */
    body: string;

    /**
     * `siteUrl` is a string representing the URL of the site where the thread is posted.
     */
    siteUrl: string;
}

/**
 * `BasicComment` is an interface representing a basic comment.
 * It includes the id, user id, and thread id each having their own properties.
 * @see https://docs.anilist.co/reference/object/threadcomment
 */
export interface BasicComment {
    /**
     * `id` is a number representing the unique identifier of the comment.
     */
    id: number;

    /**
     * `userId` is a number representing the unique identifier of the user who made the comment.
     */
    userId: number;

    /**
     * `threadId` is a number representing the unique identifier of the thread where the comment is posted.
     */
    threadId: number;
}
