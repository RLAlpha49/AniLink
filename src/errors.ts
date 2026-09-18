/**
 * Shared re-export module for the AniLink error family and the core transport
 * types every provider barrel must expose consistently.
 *
 * Both provider subpath barrels (`src/anilist.ts`, `src/mal.ts`) and the root
 * entry (`src/AniLink.ts`) pull the error hierarchy from here so the set is
 * maintained in one place instead of being hand-copied across modules. The
 * AniList facade (`src/apis/graphql/anilist/facade/index.ts`) imports the
 * same error classes directly from `base/AniLinkError` — the facade sits
 * inside the package graph, so the barrel adds no indirection there — but
 * the exported set is identical, so consumers see one error surface either
 * way. The core transport types (`RequestAuth`, `RequestAuthInput`,
 * `RequestOptions`) are re-exported here too so the two provider barrels
 * expose the same transport-type surface from a single source — a consumer
 * importing from `anilink-api-wrapper/anilist` and
 * `anilink-api-wrapper/mal` no longer sees a different transport surface for
 * no documented reason.
 */
export {
    AniLinkApiError,
    AniLinkAuthError,
    AniLinkError,
    AniLinkErrorCodes,
    AniLinkGraphQLError,
    AniLinkNetworkError,
    AniLinkRestError,
    AniLinkValidationError,
} from "./base/AniLinkError";
export type { AniLinkErrorCode, RateLimitInfo } from "./base/AniLinkError";
export type { AniLinkNetworkErrorOptions, GraphQLUpstreamError } from "./base/AniLinkError";

export type { RequestAuth, RequestAuthInput, RequestOptions } from "./base/RequestHandler";
