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
    type ResolvedProviderCredentials,
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
export type ProviderId = keyof typeof PROVIDER_FACTORIES;

/**
 * {@link ProviderClients} is the typed provider clients exposed by one {@link AniLink} instance.
 *
 * Its provider properties derive from the return types of {@link PROVIDER_FACTORIES}. The `stateOwners` and `responseCaches` fields use the same provider keys, so each client and its transport metadata are added together by {@link buildProviderClients}.
 *
 * @see {@link AniLink}
 * @see {@link buildProviderClients}
 */
type ProviderClientMap = {
    [Provider in ProviderId]: ReturnType<(typeof PROVIDER_FACTORIES)[Provider]>;
};

export interface ProviderClients extends ProviderClientMap {
    /** The per-provider state owners the clients key their shared transport state through. */
    stateOwners: Record<ProviderId, object>;
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
    responseCaches?: Record<ProviderId, ResponseCache | undefined>;
}

/**
 * {@link ProviderFactory} is a provider factory that receives only that provider's credential slot.
 *
 * It is the callable shape of each entry in {@link PROVIDER_FACTORIES}. Each registry entry also carries the resolver for its credential slot.
 *
 * @typeParam TCredentials - The credential slot accepted by this provider.
 * @typeParam TClient - The client produced by this provider.
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

type RegisteredProviderFactory<TCredentials, TClient> = ProviderFactory<TCredentials, TClient> & {
    readonly resolveCredentials: (credentials?: TCredentials) => ResolvedProviderCredentials;
    readonly acceptsLegacyOptions: boolean;
};

const registerProviderFactory = <TCredentials, TClient>(
    factory: ProviderFactory<TCredentials, TClient>,
    resolveCredentials: (credentials?: TCredentials) => ResolvedProviderCredentials,
    acceptsLegacyOptions = false
): RegisteredProviderFactory<TCredentials, TClient> =>
    Object.assign(factory, { resolveCredentials, acceptsLegacyOptions });

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
    // precedence is repeated by the cache lookup through the resolver
    // registered alongside this factory.
    return buildAniListApi(
        resolved.auth,
        resolved.options ?? legacyOptions,
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
 * {@link PROVIDER_FACTORIES} is the provider factory registry used by the composition seam.
 *
 * Each callable factory carries its credential resolver and declares whether it accepts legacy transport options. {@link ProviderId} and the provider properties in {@link ProviderClients} derive from this registry.
 *
 * @see {@link ProviderId}
 * @see {@link buildProviderClients}
 */
export const PROVIDER_FACTORIES = {
    anilist: registerProviderFactory(buildAniListClient, resolveAniListCredentials, true),
    mal: registerProviderFactory(buildMalClient, resolveMalCredentials),
} as const;

/**
 * The per-provider credential slots accepted by {@link AniLinkCredentials}.
 * Each slot's type comes from its registered factory parameter.
 *
 * @see {@link PROVIDER_FACTORIES}
 */
export type ProviderCredentialSlots = {
    [Provider in ProviderId]?: Parameters<(typeof PROVIDER_FACTORIES)[Provider]>[0];
};

/**
 * {@link buildProviderClients} builds every public provider client from isolated credential slots.
 *
 * It invokes each factory with its matching {@link AniLinkCredentials} slot and returns one client and state owner per registry key. The optional `legacyOptions` argument exists only for the positional `new AniLink(token, options)` constructor form; the AniList factory consumes it, while provider-scoped credentials take precedence and other factories do not receive it.
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

    const clients: Partial<ProviderClientMap> = {};
    const stateOwners = {} as Record<ProviderId, object>;
    const responseCaches = {} as Record<ProviderId, ResponseCache | undefined>;

    for (const providerId of Object.keys(PROVIDER_FACTORIES) as ProviderId[]) {
        const factory = PROVIDER_FACTORIES[providerId] as unknown as RegisteredProviderFactory<
            ProviderCredentials,
            unknown
        >;
        const slot = withDefaultHook(credentials[providerId] as ProviderCredentials | undefined);
        const stateOwner: object = {};
        const client = factory(
            slot,
            factory.acceptsLegacyOptions ? legacyOptions : undefined,
            stateOwner
        );
        const effectiveOptions =
            factory.resolveCredentials(slot).options ??
            (factory.acceptsLegacyOptions ? legacyOptions : undefined);

        (clients as Record<ProviderId, unknown>)[providerId] = client;
        stateOwners[providerId] = stateOwner;
        responseCaches[providerId] = effectiveOptions?.responseCache;
    }

    return { ...clients, stateOwners, responseCaches } as ProviderClients;
}
