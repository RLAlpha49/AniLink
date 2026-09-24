/**
 * `providers/index` is the public barrel for the provider composition seam.
 *
 * It re-exports {@link buildProviderClients} and {@link PROVIDER_FACTORIES} from the provider registry, plus the {@link ProviderClients}, {@link ProviderFactory}, and {@link ProviderId} types. The provider identifiers and client properties derive from the factory registry, whose entries carry their credential resolvers.
 *
 * @see {@link buildProviderClients}
 * @see {@link PROVIDER_FACTORIES}
 */
export { buildProviderClients, PROVIDER_FACTORIES } from "./registry";
export type {
    ProviderClients,
    ProviderCredentialSlots,
    ProviderFactory,
    ProviderId,
} from "./registry";
