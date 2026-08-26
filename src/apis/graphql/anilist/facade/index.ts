/**
 * AniList provider facade.
 *
 * Adding an operation touches four sites: the operation class under `query/`
 * or `mutation/`, its declaration on one of the group types under `facade/`
 * (composed into `AniListApi` below), and its instance wiring in
 * `wiring.ts`.
 */
import type { AniListCustom } from "./custom-group";
import type { AniListQueries } from "./query-group";
import type { AniListMutations } from "./mutation-group";
import type { AniListHelpers } from "./helpers-group";
import { buildAniListWiring } from "../wiring";
import type { RequestOptions } from "../../../../base/RequestHandler";

export {
    AniLinkApiError,
    AniLinkAuthError,
    AniLinkError,
    AniLinkErrorCodes,
    AniLinkGraphQLError,
    AniLinkNetworkError,
    AniLinkRestError,
    AniLinkValidationError,
} from "../../../../base/AniLinkError";
export type { AniLinkErrorCode, RateLimitInfo } from "../../../../base/AniLinkError";

/**
 * Transport settings accepted by an `AniLink` client: `timeout`, `signal`,
 * automatic retries under the default policy (`retry: false` opts out), opt-in
 * `paceWithRateLimit` pacing and `circuitBreaker` fast-fail, lifecycle hooks,
 * and `exposeRawAxiosError`.
 *
 * Every operation method also accepts an optional trailing `options` argument
 * of this type. It is merged shallowly over the instance-level settings for
 * that one call — a field set on the per-request object wins, and unset fields
 * keep the instance value:
 *
 * ```typescript
 * const aniLink = new AniLink("token", { timeout: 5_000 });
 *
 * // Uses the instance timeout of 5 seconds.
 * await aniLink.anilist.query.media({ id: 1, type: "ANIME" });
 *
 * // Raises the timeout for this call only; everything else stays instance-scoped.
 * await aniLink.anilist.query.mediaListCollection(
 *     { userId: 542244, type: "ANIME" },
 *     { timeout: 30_000 }
 * );
 * ```
 */
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

/**
 * The AniList API surface exposed at `aniLink.anilist`, composed from the
 * group types under `facade/`.
 */
export type AniListApi = AniListCustom & AniListQueries & AniListMutations & AniListHelpers;
