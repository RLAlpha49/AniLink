import type { MalPaging } from "./common";

/**
 * MyAnimeList forum types: the board tree returned by `GET /forum/boards`,
 * the topic list returned by `GET /forum/topics`, and the topic detail with
 * its posts and poll returned by `GET /forum/topic/{topic_id}`.
 */

/**
 * {@link MalForumSubboard} is one subboard nested inside a {@link MalForumBoard}.
 *
 * It carries only the subboard's `id` and `title`, matching MyAnimeList's
 * forum boards response.
 *
 * @see https://myanimelist.net/apiconfig/references/api/v2#tag/forum/operation/forum_boards_get
 */
export interface MalForumSubboard {
    /** The subboard's MyAnimeList identifier. */
    id: number;
    /** The subboard's display title. */
    title: string;
    /** Any additional fields returned by MyAnimeList remain available without narrowing. */
    [field: string]: unknown;
}

/**
 * {@link MalForumBoard} is one board of the MyAnimeList forum tree.
 *
 * It is the element type of a {@link MalForumCategory}'s `boards` array,
 * returned by `MalForumOperation.boards` and `MyAnimeListForumApi.boards`.
 *
 * @see https://myanimelist.net/apiconfig/references/api/v2#tag/forum/operation/forum_boards_get
 */
export interface MalForumBoard {
    /** The board's MyAnimeList identifier. */
    id: number;
    /** The board's display title. */
    title: string;
    /** The board's description. */
    description: string;
    /** The board's subboards, when it has any. */
    subboards: MalForumSubboard[];
    /** Any additional fields returned by MyAnimeList remain available without narrowing. */
    [field: string]: unknown;
}

/**
 * {@link MalForumCategory} is one category of the MyAnimeList forum tree.
 *
 * It groups a run of {@link MalForumBoard} entries under a shared `title`, and
 * is the element type of {@link MalForumBoardsResponse} returned by
 * `MalForumOperation.boards` and `MyAnimeListForumApi.boards`.
 *
 * @see https://myanimelist.net/apiconfig/references/api/v2#tag/forum/operation/forum_boards_get
 */
export interface MalForumCategory {
    /** The category's display title. */
    title: string;
    /** The boards filed under this category. */
    boards: MalForumBoard[];
    /** Any additional fields returned by MyAnimeList remain available without narrowing. */
    [field: string]: unknown;
}

/**
 * {@link MalForumBoardsResponse} is the response of the forum boards endpoint.
 *
 * It is the shape returned by `MalForumOperation.boards` and
 * `MyAnimeListForumApi.boards` from `GET /forum/boards`: the full board tree
 * as {@link MalForumCategory} entries.
 *
 * @see https://myanimelist.net/apiconfig/references/api/v2#tag/forum/operation/forum_boards_get
 */
export interface MalForumBoardsResponse {
    /** The forum categories, each carrying its boards. */
    categories: MalForumCategory[];
}

/**
 * {@link MalForumTopicCreator} is the user who created a forum topic or post.
 *
 * It appears as `created_by` and `last_post_created_by` on
 * {@link MalForumTopicSummary} and {@link MalForumTopicPost}.
 *
 * @see https://myanimelist.net/apiconfig/references/api/v2#tag/forum/operation/forum_topics_get
 */
export interface MalForumTopicCreator {
    /** The creator's MyAnimeList user identifier. */
    id: number;
    /** The creator's MyAnimeList user name. */
    name: string;
    /** Any additional fields returned by MyAnimeList remain available without narrowing. */
    [field: string]: unknown;
}

/**
 * {@link MalForumTopicSummary} is one topic entry of the forum topic list.
 *
 * It is the element type of {@link MalForumTopicsResponse} returned by
 * `MalForumOperation.topics` and `MyAnimeListForumApi.topics`.
 *
 * @see https://myanimelist.net/apiconfig/references/api/v2#tag/forum/operation/forum_topics_get
 */
export interface MalForumTopicSummary {
    /** The topic's MyAnimeList identifier. */
    id: number;
    /** The topic's title. */
    title: string;
    /** The topic's creation timestamp in ISO 8601 form. */
    created_at: string;
    /** The user who created the topic. */
    created_by: MalForumTopicCreator;
    /** The number of posts in the topic. */
    number_of_posts: number;
    /** The timestamp of the topic's most recent post in ISO 8601 form. */
    last_post_created_at: string;
    /** The user who wrote the topic's most recent post. */
    last_post_created_by: MalForumTopicCreator;
    /** Whether the topic is locked to new replies. */
    is_locked: boolean;
    /** Any additional fields returned by MyAnimeList remain available without narrowing. */
    [field: string]: unknown;
}

/**
 * {@link MalForumTopicsResponse} is the response of the forum topic list endpoint.
 *
 * It is the shape returned by `MalForumOperation.topics` and
 * `MyAnimeListForumApi.topics` from `GET /forum/topics`: a page of
 * {@link MalForumTopicSummary} entries plus the {@link MalPaging} node.
 *
 * @see https://myanimelist.net/apiconfig/references/api/v2#tag/forum/operation/forum_topics_get
 */
export interface MalForumTopicsResponse {
    /** The topic entries on this page. */
    data: MalForumTopicSummary[];
    /** The paging node with the next/previous page URLs, when the list continues. */
    paging?: MalPaging;
}

/**
 * The sort orders MyAnimeList accepts for the forum topic list.
 *
 * These are the fixed `sort` query values accepted by `GET /forum/topics`,
 * consumed as the `sort` field of {@link MalForumTopicsParams} on
 * `MalForumOperation.topics` and `MyAnimeListForumApi.topics`. MyAnimeList
 * currently documents only `recent`.
 *
 * @see https://myanimelist.net/apiconfig/references/api/v2#tag/forum/operation/forum_topics_get
 */
export type MalForumTopicSort = "recent";

/**
 * {@link MalForumTopicsParams} is the params object of the forum topic list read.
 *
 * It carries the API's own inputs for `GET /forum/topics` — the `boardId` and
 * `subboardId` filters, the `q` keyword, the creator filters, and the `sort`
 * and paging filters — consumed by `MalForumOperation.topics` and
 * `MyAnimeListForumApi.topics` as the single params object of the unified
 * `(params, options?)` convention.
 *
 * @see https://myanimelist.net/apiconfig/references/api/v2#tag/forum/operation/forum_topics_get
 */
export interface MalForumTopicsParams {
    /** The board to list topics of, when limiting to one board. */
    boardId?: number;
    /** The subboard to list topics of, when limiting to one subboard. */
    subboardId?: number;
    /** The keyword to filter topic titles by. */
    q?: string;
    /** The user name whose created topics to list. */
    topicUserName?: string;
    /** The user name whose posts to list topics by. */
    userName?: string;
    /** The sort order; one of {@link MalForumTopicSort}. */
    sort?: MalForumTopicSort;
    /** The number of entries per page; defaults to 100, capped at 100 by MyAnimeList. */
    limit?: number;
    /** The offset of the first entry; defaults to 0. */
    offset?: number;
}

/**
 * {@link MalForumPostCreator} is the user who wrote a forum post inside a topic detail.
 *
 * It appears as `created_by` on {@link MalForumTopicPost}. MyAnimeList spells
 * the avatar field `forum_avator` — a documented upstream quirk preserved
 * verbatim.
 *
 * @see https://myanimelist.net/apiconfig/references/api/v2#tag/forum/operation/forum_topic_get
 */
export interface MalForumPostCreator {
    /** The author's MyAnimeList user identifier. */
    id: number;
    /** The author's MyAnimeList user name. */
    name: string;
    /** The author's forum avatar URL; MyAnimeList spells this field `forum_avator`. */
    forum_avator: string;
    /** Any additional fields returned by MyAnimeList remain available without narrowing. */
    [field: string]: unknown;
}

/**
 * {@link MalForumTopicPost} is one post inside a forum topic detail.
 *
 * It is the element type of a {@link MalForumTopicDetail}'s `posts` array,
 * returned by `MalForumOperation.topic` and `MyAnimeListForumApi.topic`.
 *
 * @see https://myanimelist.net/apiconfig/references/api/v2#tag/forum/operation/forum_topic_get
 */
export interface MalForumTopicPost {
    /** The post's MyAnimeList identifier. */
    id: number;
    /** The post's position within its topic. */
    number: number;
    /** The post's creation timestamp in ISO 8601 form. */
    created_at: string;
    /** The user who wrote the post. */
    created_by: MalForumPostCreator;
    /** The post's body text. */
    body: string;
    /** The post's signature block. */
    signature: string;
    /** Any additional fields returned by MyAnimeList remain available without narrowing. */
    [field: string]: unknown;
}

/**
 * {@link MalForumPollOption} is one option of a forum topic poll.
 *
 * It is the element type of a {@link MalForumPoll}'s `options` array.
 *
 * @see https://myanimelist.net/apiconfig/references/api/v2#tag/forum/operation/forum_topic_get
 */
export interface MalForumPollOption {
    /** The option's identifier. */
    id: number;
    /** The option's display text. */
    text: string;
    /** The number of votes the option has received. */
    votes: number;
    /** Any additional fields returned by MyAnimeList remain available without narrowing. */
    [field: string]: unknown;
}

/**
 * {@link MalForumPoll} is the poll attached to a forum topic.
 *
 * It appears as the single `poll` object on {@link MalForumTopicDetail}.
 *
 * @see https://myanimelist.net/apiconfig/references/api/v2#tag/forum/operation/forum_topic_get
 */
export interface MalForumPoll {
    /** The poll's identifier. */
    id: number;
    /** The poll's question. */
    question: string;
    /** Whether the poll is closed to new votes. */
    closed: boolean;
    /** The poll's options with their vote counts. */
    options: MalForumPollOption[];
    /** Any additional fields returned by MyAnimeList remain available without narrowing. */
    [field: string]: unknown;
}

/**
 * {@link MalForumTopicDetail} is the topic detail returned by the forum topic endpoint.
 *
 * It is the `data` entry of {@link MalForumTopicResponse} returned by
 * `MalForumOperation.topic` and `MyAnimeListForumApi.topic` from
 * `GET /forum/topic/{topic_id}`: the topic's title, its posts, and its poll.
 *
 * @see https://myanimelist.net/apiconfig/references/api/v2#tag/forum/operation/forum_topic_get
 */
export interface MalForumTopicDetail {
    /** The topic's title. */
    title: string;
    /** The topic's posts on this page. */
    posts: MalForumTopicPost[];
    /** The topic's poll, when one is attached. */
    poll?: MalForumPoll;
    /** Any additional fields returned by MyAnimeList remain available without narrowing. */
    [field: string]: unknown;
}

/**
 * {@link MalForumTopicResponse} is the response of the forum topic detail endpoint.
 *
 * It is the shape returned by `MalForumOperation.topic` and
 * `MyAnimeListForumApi.topic` from `GET /forum/topic/{topic_id}`: the topic's
 * {@link MalForumTopicDetail} under `data` plus the {@link MalPaging} node for
 * paging through its posts.
 *
 * @see https://myanimelist.net/apiconfig/references/api/v2#tag/forum/operation/forum_topic_get
 */
export interface MalForumTopicResponse {
    /** The topic's detail: title, posts, and poll. */
    data: MalForumTopicDetail;
    /** The paging node with the next/previous post-page URLs, when the topic continues. */
    paging?: MalPaging;
}

/**
 * {@link MalForumTopicParams} is the params object of the forum topic detail read.
 *
 * It carries the API's own inputs for `GET /forum/topic/{topic_id}` — the
 * topic `id` path segment plus the `limit` and `offset` post-paging filters —
 * consumed by `MalForumOperation.topic` and `MyAnimeListForumApi.topic` as
 * the single params object of the unified `(params, options?)` convention.
 *
 * @see https://myanimelist.net/apiconfig/references/api/v2#tag/forum/operation/forum_topic_get
 */
export interface MalForumTopicParams {
    /** The MyAnimeList forum topic ID. */
    id: number;
    /** The number of posts per page; defaults to 100, capped at 100 by MyAnimeList. */
    limit?: number;
    /** The offset of the first post; defaults to 0. */
    offset?: number;
}
