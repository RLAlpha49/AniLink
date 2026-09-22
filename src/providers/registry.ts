import {
    buildAniListApi,
    type AniLinkOptions,
    type AniListApi,
} from "../apis/graphql/anilist/facade";
import { buildMyAnimeListApi } from "../apis/rest/mal/wiring";
import {
    resolveAniListCredentials,
    resolveMalCredentials,
    type AniLinkCredentials,
    type AniListCredentials,
    type MalCredentials,
    type ProviderCredentials,
} from "../base/credentials";
import type { RequestOptions } from "../base/RequestHandler";
import type { ResponseCache } from "../base/responseCache";
import type { MyAnimeListApi } from "../apis/rest/mal/facade";

/**
 * {@link ProviderId} is the union of provider identifiers composed by {@link AniLink} and {@link ProviderClients}.
 *
 * It keys {@link PROVIDER_FACTORIES} and {@link AniLinkCredentials}, isolating each provider's credentials and transport settings.
 *
 * @see {@link ProviderClients}
 * @see {@link buildProviderClients}
 */
export type ProviderId = "anilist" | "mal";

/**
 * {@link ProviderClients} is the typed provider clients exposed by one {@link AniLink} instance.
 *
 * It composes {@link AniListApi} under `anilist` and {@link MyAnimeListApi} under `mal`, each built from its own credential slot via {@link PROVIDER_FACTORIES} and {@link buildProviderClients}. The `stateOwners` field carries the per-provider state owner objects the clients were built with, so callers (notably {@link AniLink}'s `getTransportState`) can snapshot each client's shared transport state without pre-wiring hooks.
 *
 * @see {@link AniLink}
 * @see {@link buildProviderClients}
 */
export interface ProviderClients {
    /** The AniList GraphQL provider client, a {@link AniListApi} built from {@link AniListCredentials}. */
    anilist: AniListApi;
    /** The MyAnimeList REST provider client, a {@link MyAnimeListApi} built from {@link MalCredentials} via {@link buildMyAnimeListApi}. */
    mal: MyAnimeListApi;
    /** The per-provider state owners the clients key their shared transport state (breaker, budget, pacing) through. */
    stateOwners: { anilist: object; mal: object };
    /**
     * The per-provider response caches resolved from each slot's transport
     * options, when enabled — the instances {@link AniLink}'s transport-state
     * snapshot reads the cache counters through, so a consumer wiring the
     * cache through a credentials slot (where the instance is constructed
     * for them) still reaches `stats()` via `getTransportState()`. Optional
     * so external `ProviderClients` consumers (custom registries, test
     * doubles) constructed before the field existed keep compiling; a
     * missing value reads as no cache in the snapshot.
     */
    responseCaches?: { anilist: ResponseCache | undefined; mal: ResponseCache | undefined };
}

/**
 * {@link ProviderFactory} is a provider factory that receives only that provider's credential slot.
 *
 * It is the shape of each entry in {@link PROVIDER_FACTORIES} and is invoked by {@link buildProviderClients} with isolated {@link AniListCredentials} or {@link MalCredentials} plus optional {@link RequestOptions} and the provider's state owner.
 *
 * @typeParam TCredentials - The credential slot for the provider, such as {@link AniListCredentials} or {@link MalCredentials}.
 * @typeParam TClient - The client produced, such as {@link AniListApi} or {@link MyAnimeListApi}.
 * @param credentials - The provider's credential slot.
 * @param legacyOptions - Transport settings for the legacy `new AniLink(token, options)` form; only the AniList factory consumes this.
 * @param stateOwner - The provider's state owner, keying the client's shared transport state (breaker, budget, pacing).
 * @returns The typed client for the provider.
 * @see {@link PROVIDER_FACTORIES}
 * @see {@link buildProviderClients}
 */
export type ProviderFactory<TCredentials, TClient> = (
    credentials?: TCredentials,
    legacyOptions?: RequestOptions,
    stateOwner?: object
) => TClient;

const buildAniListClient: ProviderFactory<AniListCredentials, AniListApi> = (
    credentials,
    legacyOptions,
    stateOwner
) => {
    const resolved = resolveAniListCredentials(credentials);
    // The raw slot rides along so the wiring can read the automatic
    // token-refresh fields (`refreshToken`, `clientId`, `clientSecret`,
    // `onTokenRefresh`) the resolver strips from the transport options —
    // the same raw-slot flow `buildMyAnimeListApi` uses for MAL. The options
    // precedence (the slot's own transport settings win over the legacy
    // options) is shared with the cache lookup in
    // {@link buildProviderClients} through {@link effectiveAniListOptions},
    // so the two sites cannot drift.
    return buildAniListApi(
        resolved.auth,
        effectiveAniListOptions(credentials, legacyOptions),
        stateOwner,
        credentials
    );
};

const buildMalClient: ProviderFactory<MalCredentials, MyAnimeListApi> = (
    credentials,
    _legacyOptions,
    stateOwner
) => buildMyAnimeListApi(credentials, stateOwner);

/**
 * The effective transport options one provider slot resolves to — the
 * single resolution both the provider factory and the cache lookup in
 * {@link buildProviderClients} read, so the cache instance the snapshot
 * reports is by construction the one the client uses.
 *
 * @param slot - The provider's credential slot, when present.
 * @param legacyOptions - The legacy `new AniLink(token, options)` transport
 * settings, forwarded only to the AniList slot.
 * @returns The slot's own transport options when it carries any, otherwise
 * the legacy options, otherwise `undefined`.
 */
const effectiveAniListOptions = (
    slot: AniListCredentials | undefined,
    legacyOptions?: RequestOptions
): RequestOptions | undefined => resolveAniListCredentials(slot).options ?? legacyOptions;

/**
 * {@link PROVIDER_FACTORIES} is the provider factories used by the composition seam.
 *
 * It maps each {@link ProviderId} to a {@link ProviderFactory} that builds the AniList surface ({@link AniListApi}) or the MyAnimeList surface ({@link MyAnimeListApi}) from isolated {@link AniLinkCredentials} slots via {@link buildProviderClients} and {@link AniLink}.
 *
 * @see {@link ProviderId}
 * @see {@link buildProviderClients}
 */
export const PROVIDER_FACTORIES = {
    anilist: buildAniListClient,
    mal: buildMalClient,
} as const;

/**
 * {@link buildProviderClients} builds every public provider client from isolated credential slots.
 *
 * It invokes each {@link ProviderFactory} in {@link PROVIDER_FACTORIES} with its own {@link AniLinkCredentials} slot, producing {@link ProviderClients} with the AniList surface ({@link AniListApi}) and the MyAnimeList surface ({@link MyAnimeListApi}). The optional `legacyOptions` argument exists only for the positional `new AniLink(token, options)` constructor form; provider-scoped credentials carry their own {@link RequestOptions} and never share them with another slot. Each client is built with its own state owner, returned on the `stateOwners` field so the caller can snapshot the clients' shared transport state.
 *
 * @param credentials - Per-provider credential slots; an {@link AniLinkCredentials} object.
 * @param legacyOptions - Transport settings for the legacy AniList form; forwarded only to the AniList factory.
 * @returns Typed clients for every registered provider, a {@link ProviderClients} object.
 * @see {@link PROVIDER_FACTORIES}
 * @see {@link ProviderClients}
 * @example
 * ```typescript
 * const clients = buildProviderClients({
 *     anilist: { authToken: "anilist-token" },
 *     mal: { accessToken: "mal-token" },
 * });
 * const anime = await clients.mal.anime.get({ id: 21 });
 * ```
 */
export function buildProviderClients(
    credentials: AniLinkCredentials = {},
    legacyOptions?: AniLinkOptions
): ProviderClients {
    const clientHookError = credentials.onHookError;
    const clientDiagnostics = credentials.diagnostics;
    // Applies the client-level onHookError and diagnostics defaults to one
    // provider slot; a slot that defines its own value keeps it.
    const withDefaultHook = <T extends ProviderCredentials>(slot: T | undefined): T | undefined => {
        if (clientHookError === undefined && clientDiagnostics === undefined) {
            return slot;
        }
        const needsHook = clientHookError !== undefined && slot?.onHookError === undefined;
        const needsDiagnostics = clientDiagnostics !== undefined && slot?.diagnostics === undefined;
        if (!needsHook && !needsDiagnostics) {
            return slot;
        }
        return {
            ...slot,
            ...(needsHook ? { onHookError: clientHookError } : {}),
            ...(needsDiagnostics ? { diagnostics: clientDiagnostics } : {}),
        } as T;
    };

    // One state owner per provider, created here so the composition seam
    // (and {@link AniLink}'s transport-state snapshot) can reach the object
    // each client keys its shared breaker/budget/pacing state through.
    const anilistStateOwner: object = {};
    const malStateOwner: object = {};

    // The per-provider resolved transport options' response caches, when
    // enabled, so the transport-state snapshot can read the cache counters
    // without the consumer holding the cache instance. The AniList slot
    // resolves its own options first (the raw slot's transport settings
    // win over the legacy options); the MAL slot likewise. A slot without a
    // cache stays `undefined`.
    const anilistCache = effectiveAniListOptions(credentials.anilist, legacyOptions)?.responseCache;
    const malCache = resolveMalCredentials(credentials.mal).options?.responseCache;

    // Explicit construction keeps every factory call fully typed: a
    // factory signature change fails here at compile time instead of
    // surfacing at runtime behind a cast. legacyOptions is forwarded only
    // to the AniList factory, matching the legacy `new AniLink(token,
    // options)` contract.
    return {
        anilist: PROVIDER_FACTORIES.anilist(
            withDefaultHook(credentials.anilist),
            legacyOptions,
            anilistStateOwner
        ),
        mal: PROVIDER_FACTORIES.mal(withDefaultHook(credentials.mal), undefined, malStateOwner),
        stateOwners: { anilist: anilistStateOwner, mal: malStateOwner },
        responseCaches: { anilist: anilistCache, mal: malCache },
    };
}
