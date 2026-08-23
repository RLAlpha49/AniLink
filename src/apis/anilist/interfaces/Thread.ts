import { type ThreadResponse } from "./responses/query/Thread";
import { type ThreadCommentResponse } from "./responses/query/ThreadComment";

/**
 * `Thread` is a type alias representing a single thread returned by thread-related
 * queries and mutations. The GraphQL selection sets flatten the thread object with
 * one flat field list, so the full `ThreadResponse` shape describes the member.
 * @see https://docs.anilist.co/reference/object/thread
 */
export type Thread = ThreadResponse;

/**
 * `ThreadComment` is a type alias representing a single thread comment returned by
 * thread-comment-related queries and mutations. The GraphQL selection sets flatten
 * the thread comment object with one flat field list, so the full
 * `ThreadCommentResponse` shape describes the member.
 * @see https://docs.anilist.co/reference/object/threadcomment
 */
export type ThreadComment = ThreadCommentResponse;
