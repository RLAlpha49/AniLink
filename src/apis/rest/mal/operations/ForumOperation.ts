import { RestOperation } from "../../RestOperation";
import { MAL_API_BASE_URL } from "../constants";
import type {
    MalForumBoardsResponse,
    MalForumTopicParams,
    MalForumTopicResponse,
    MalForumTopicsParams,
    MalForumTopicsResponse,
    MalRequestOptions,
} from "../types";

/**
 * {@link MalForumOperation} is the REST operation adapter for the MyAnimeList forum endpoints.
 *
 * It extends {@link RestOperation} and is composed into `MyAnimeListApi` by
 * `buildMyAnimeListApi`. It provides the forum reads `boards`, `topics`, and
 * `topic` for `GET /forum/boards`, `GET /forum/topics`, and
 * `GET /forum/topic/{topic_id}`. These endpoints do not require an access
 * token.
 *
 * @see https://myanimelist.net/apiconfig/references/api/v2#tag/forum/operation/forum_boards_get
 * @see https://myanimelist.net/apiconfig/references/api/v2#tag/forum/operation/forum_topics_get
 * @see https://myanimelist.net/apiconfig/references/api/v2#tag/forum/operation/forum_topic_get
 */
export class MalForumOperation extends RestOperation {
    /** The base URL for MyAnimeList API v2, from {@link MAL_API_BASE_URL}. */
    protected readonly baseUrl = MAL_API_BASE_URL;

    /**
     * {@link MalForumOperation.boards} gets the MyAnimeList forum board tree.
     *
     * It calls `GET /forum/boards` through `RestOperation.execute` and returns
     * a {@link MalForumBoardsResponse} containing {@link MalForumCategory}
     * entries, each with {@link MalForumBoard} entries and subboards. The
     * facade exposes this method as `MyAnimeListForumApi.boards`. It does not
     * require an access token.
     *
     * @param options - Optional transport settings; a {@link MalRequestOptions} merged over the instance defaults.
     * @returns The forum board tree, a {@link MalForumBoardsResponse}.
     * @throws A normalized `AniLinkError` when the request fails.
     * @example
     * ```typescript
     * const api = new AniLink({ mal: { accessToken: "mal-token" } }).mal;
     * const boards = await api.forum.boards();
     * console.log(boards.categories[0]?.boards[0]?.title);
     * ```
     * @see https://myanimelist.net/apiconfig/references/api/v2#tag/forum/operation/forum_boards_get
     */
    public async boards(options: MalRequestOptions = {}): Promise<MalForumBoardsResponse> {
        const { fields: _ignoredFields, ...transportOptions } = options;
        void _ignoredFields;
        return await this.execute<MalForumBoardsResponse>("/forum/boards", {
            transportOptions,
        });
    }

    /**
     * {@link MalForumOperation.topics} gets the MyAnimeList forum topic list, one page at a time.
     *
     * It calls `GET /forum/topics` through `RestOperation.execute` with the
     * `board_id`/`subboard_id` board filters, the `q` keyword, the
     * `topic_user_name`/`user_name` creator filters, and the `sort` and
     * `limit`/`offset` paging filters, returning a
     * {@link MalForumTopicsResponse} page of {@link MalForumTopicSummary}
     * entries. The facade exposes this method as `MyAnimeListForumApi.topics`.
     * It does not require an access token.
     *
     * @param params - The topic-list read inputs; a {@link MalForumTopicsParams} carrying the optional board, keyword, creator, sort, and paging filters.
     * @param options - Optional transport settings; a {@link MalRequestOptions} merged over the instance defaults.
     * @returns The topic list page, a {@link MalForumTopicsResponse}.
     * @throws A normalized `AniLinkError` when the request fails.
     * @example
     * ```typescript
     * const api = new AniLink({ mal: { accessToken: "mal-token" } }).mal;
     * const topics = await api.forum.topics({ q: "one piece" });
     * console.log(topics.data[0]?.title);
     * ```
     * @see https://myanimelist.net/apiconfig/references/api/v2#tag/forum/operation/forum_topics_get
     */
    public async topics(
        params: MalForumTopicsParams = {},
        options: MalRequestOptions = {}
    ): Promise<MalForumTopicsResponse> {
        const { boardId, subboardId, q, topicUserName, userName, sort, limit, offset } = params;
        const { fields: _ignoredFields, ...transportOptions } = options;
        void _ignoredFields;
        return await this.execute<MalForumTopicsResponse>("/forum/topics", {
            transportOptions,
            // `buildQueryString` skips undefined/null values, so the optional
            // filters can be passed straight through.
            query: {
                board_id: boardId,
                subboard_id: subboardId,
                q,
                topic_user_name: topicUserName,
                user_name: userName,
                sort,
                limit,
                offset,
            },
        });
    }

    /**
     * {@link MalForumOperation.topic} gets one forum topic with its posts and poll.
     *
     * It calls `GET /forum/topic/{id}` through `RestOperation.execute` with
     * the `limit`/`offset` post-paging filters and returns a
     * {@link MalForumTopicResponse} whose `data` carries the topic's
     * {@link MalForumTopicDetail}, which contains the title, posts, and poll.
     * The facade exposes this method as `MyAnimeListForumApi.topic`. It does
     * not require an access token.
     *
     * @param params - The topic read inputs; a {@link MalForumTopicParams} carrying the topic ID plus the optional post-paging filters.
     * @param options - Optional transport settings; a {@link MalRequestOptions} merged over the instance defaults.
     * @returns The topic detail page, a {@link MalForumTopicResponse}.
     * @throws A normalized `AniLinkError` when the request fails.
     * @example
     * ```typescript
     * const api = new AniLink({ mal: { accessToken: "mal-token" } }).mal;
     * const topic = await api.forum.topic({ id: 23744 });
     * console.log(topic.data.title, topic.data.posts[0]?.body);
     * ```
     * @see https://myanimelist.net/apiconfig/references/api/v2#tag/forum/operation/forum_topic_get
     */
    public async topic(
        params: MalForumTopicParams,
        options: MalRequestOptions = {}
    ): Promise<MalForumTopicResponse> {
        const { id, limit, offset } = params;
        const { fields: _ignoredFields, ...transportOptions } = options;
        void _ignoredFields;
        return await this.execute<MalForumTopicResponse>("/forum/topic/{id}", {
            transportOptions,
            // `buildQueryString` skips undefined/null values, so the optional
            // filters can be passed straight through.
            query: { limit, offset },
            pathParams: { id },
        });
    }
}
