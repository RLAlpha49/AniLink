/**
 * `providers/index` is the public barrel for the provider composition seam.
 *
 * It re-exports {@link buildProviderClients} and {@link PROVIDER_FACTORIES} from the provider registry, plus the {@link ProviderClients}, {@link ProviderFactory}, and {@link ProviderId} types that compose {@link AniLink} from the AniList surface (`AniListApi`) and the MyAnimeList surface (`MyAnimeListApi`).
 *
 * @see {@link buildProviderClients}
 * @see {@link PROVIDER_FACTORIES}
 */
export { buildProviderClients, PROVIDER_FACTORIES } from "./registry";
export type { ProviderClients, ProviderFactory, ProviderId } from "./registry";
