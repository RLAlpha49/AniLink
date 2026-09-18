/**
 * AniList provider facade.
 *
 * Adding an operation touches two sites: the operation class under `query/`
 * or `mutation/` and its entry in the declarative registry in `registry.ts`.
 * Run `npm run facade:generate` to refresh the derived group types (composed
 * into {@link AniListApi} below). Instance wiring in `wiring.ts` is automatic
 * from the registry, and the group modules are generated from the registry
 * and carry compile-time parity asserts so the registry and the typed
 * surface cannot drift without failing `tsc`.
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
} from "../../../../base/AniLinkError";
export type { AniLinkErrorCode, RateLimitInfo } from "../../../../base/AniLinkError";

/**
 * Transport settings accepted by an {@link AniLink} client: `timeout`, `signal`,
 * automatic retries under the default policy (`retry: false` opts out),
 * `paceWithRateLimit` pacing (on by default), opt-in `circuitBreaker` fast-fail,
 * lifecycle hooks, and `exposeRawAxiosError`.
 *
 * Every operation method also accepts an optional trailing `options` argument
 * of this type. It is merged over the instance-level settings for that one
 * call — a field set on the per-request object wins, and unset fields keep
 * the instance value. The nested `retry`, `circuitBreaker`, and `retryBudget`
 * objects merge field-by-field, so a per-request `{ retry: { maxRetries: 0 } }`
 * keeps the instance's other retry knobs:
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
 * @param stateOwner - Stable per-client object keying the shared transport state (breaker, budget, pacing); when omitted, a fresh one is allocated for this client.
 * @returns The composed {@link AniListApi}.
 */
export function buildAniListApi(
    authToken?: RequestAuthInput,
    options?: AniLinkOptions,
    stateOwner?: object
): AniListApi {
    return buildAniListWiring(authToken, options, stateOwner);
}

/**
 * The AniList API surface exposed at `aniLink.anilist`, composed from the
 * {@link AniListCustom}, {@link AniListQueries}, {@link AniListMutations}, and
 * {@link AniListHelpers} group types under `facade/`.
 */
export type AniListApi = AniListCustom & AniListQueries & AniListMutations & AniListHelpers;
