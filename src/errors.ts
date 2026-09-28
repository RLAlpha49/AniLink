/**
 * Shared re-exports for AniLink errors and core transport types.
 *
 * Both provider subpath barrels (`src/anilist.ts`, `src/mal.ts`) and the root
 * entry (`src/AniLink.ts`) import the error hierarchy from this module. The
 * AniList facade (`src/apis/graphql/anilist/facade/index.ts`) imports the
 * classes directly from `base/AniLinkError` because it is inside the package
 * and does not need the barrel. Both paths export the same error classes.
 *
 * This module also re-exports `RequestAuth`, `RequestAuthInput`, and
 * `RequestOptions`. The provider barrels use these exports so consumers get
 * the same transport types from `anilist` and `mal`.
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
