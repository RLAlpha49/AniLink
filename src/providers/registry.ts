import {
    buildAniListApi,
    type AniLinkOptions,
    type AniListApi,
} from "../apis/graphql/anilist/facade";
import { buildMyAnimeListApi } from "../apis/rest/mal/wiring";
import {
    resolveAniListCredentials,
    type AniLinkCredentials,
    type AniListCredentials,
    type MalCredentials,
} from "../base/credentials";
import type { RequestOptions } from "../base/RequestHandler";
import type { MyAnimeListApi } from "../apis/rest/mal/facade";

/** Provider identifiers composed by the public `AniLink` client. */
export type ProviderId = "anilist" | "mal";

/** The typed provider clients exposed by one `AniLink` instance. */
export interface ProviderClients {
    /** The AniList GraphQL provider client. */
    anilist: AniListApi;
    /** The MyAnimeList REST provider client. */
    mal: MyAnimeListApi;
}

/** A provider factory that receives only that provider's credential slot. */
export type ProviderFactory<TCredentials, TClient> = (
    credentials?: TCredentials,
    legacyOptions?: RequestOptions
) => TClient;

const buildAniListClient: ProviderFactory<AniListCredentials, AniListApi> = (
    credentials,
    legacyOptions
) => {
    const resolved = resolveAniListCredentials(credentials);
    return buildAniListApi(resolved.auth as string | undefined, resolved.options ?? legacyOptions);
};

const buildMalClient: ProviderFactory<MalCredentials, MyAnimeListApi> = (credentials) =>
    buildMyAnimeListApi(credentials);

/** The provider factories used by the composition seam. */
export const PROVIDER_FACTORIES = {
    anilist: buildAniListClient,
    mal: buildMalClient,
} as const;

/**
 * Builds every public provider client from isolated credential slots.
 *
 * The optional `legacyOptions` argument exists only for the positional
 * `new AniLink(token, options)` constructor form. Provider-scoped credentials
 * carry their own transport settings and never share them with another slot.
 *
 * @param credentials - Per-provider credential slots.
 * @param legacyOptions - Transport settings for the legacy AniList form.
 * @returns Typed clients for every registered provider.
 * @example
 * ```typescript
 * const clients = buildProviderClients({
 *     anilist: { authToken: "anilist-token" },
 *     mal: { accessToken: "mal-token" },
 * });
 * ```
 */
export function buildProviderClients(
    credentials: AniLinkCredentials = {},
    legacyOptions?: AniLinkOptions
): ProviderClients {
    return {
        anilist: PROVIDER_FACTORIES.anilist(credentials.anilist, legacyOptions),
        mal: PROVIDER_FACTORIES.mal(credentials.mal),
    };
}
