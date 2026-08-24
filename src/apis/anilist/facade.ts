/**
 * AniList provider facade.
 *
 * Adding an operation touches four sites: the operation class under `query/`
 * or `mutation/`, its declaration on `AniListApi` in
 * `anilist-api-type.ts`, and its instance wiring in `anilist-wiring.ts`.
 */
import type { AniListApi } from "./anilist-api-type";
import { buildAniListWiring } from "./anilist-wiring";
import type { RequestOptions } from "../../base/RequestHandler";

export {
    AniLinkApiError,
    AniLinkAuthError,
    AniLinkError,
    AniLinkErrorCodes,
    AniLinkGraphQLError,
    AniLinkNetworkError,
    AniLinkValidationError,
} from "../../base/AniLinkError";
export type { AniLinkErrorCode, RateLimitInfo } from "../../base/AniLinkError";

/** Transport settings accepted by an `AniLink` client: `timeout`, `signal`, automatic retries under the default policy (`retry: false` opts out), opt-in `paceWithRateLimit` pacing and `circuitBreaker` fast-fail, lifecycle hooks, and `exposeRawAxiosError`. */
export type AniLinkOptions = RequestOptions;

/**
 * Builds the AniList facade from the operation classes.
 *
 * @param authToken - The authentication token shared by every operation instance.
 * @param options - Timeout, cancellation, and debugging settings for API requests.
 * @returns The composed AniList API surface.
 */
export function buildAniListApi(authToken?: string, options?: AniLinkOptions): AniListApi {
    return buildAniListWiring(authToken, options);
}

export type { AniListApi };
