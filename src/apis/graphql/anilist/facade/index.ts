/**
 * AniList provider facade.
 *
 * Adding an operation touches three sites: the operation class under `query/`
 * or `mutation/`, its entry in the declarative registry in `registry.ts`, and
 * its declaration on one of the group types under `facade/` (composed into
 * {@link AniListApi} below). Instance wiring in `wiring.ts` is automatic from
 * the registry, and the group modules carry a compile-time
 * `Record<RegistryXxxKeys, true>` parity constant so the registry
 * and the typed surface cannot drift without failing `tsc`.
 */
import type { AniListCustom } from "./custom-group";
import type { AniListQueries } from "./query-group";
import type { AniListMutations } from "./mutation-group";
import type { AniListHelpers } from "./helpers-group";
import { buildAniListWiring } from "../wiring";
import type { RequestAuthInput, RequestOptions } from "../../../../base/RequestHandler";

export {
    AniLinkApiError,
    AniLinkAuthError,
    AniLinkError,
    AniLinkErrorCodes,
    AniLinkGraphQLError,
    AniLinkNetworkError,
    AniLinkRestError,
    AniLinkValidationError,
} from "../../../../errors";
export type { AniLinkErrorCode, RateLimitInfo } from "../../../../errors";

/**
 * Transport settings accepted by an {@link AniLink} client: `timeout`, `signal`,
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
 * Builds the {@link AniListApi} facade from the operation classes.
 *
 * @param authToken - The authentication material shared by every operation instance. A plain string is treated as a bearer token; a structured {@link RequestAuthInput} carries explicit headers for schemes such as Basic auth or a provider API key.
 * @param options - Timeout, cancellation, and debugging settings; an {@link AniLinkOptions} merged over the defaults.
 * @returns The composed {@link AniListApi}.
 */
export function buildAniListApi(
    authToken?: RequestAuthInput,
    options?: AniLinkOptions
): AniListApi {
    return buildAniListWiring(authToken, options);
}

/**
 * The AniList API surface exposed at `aniLink.anilist`, composed from the
 * {@link AniListCustom}, {@link AniListQueries}, {@link AniListMutations}, and
 * {@link AniListHelpers} group types under `facade/`.
 */
export type AniListApi = AniListCustom & AniListQueries & AniListMutations & AniListHelpers;
