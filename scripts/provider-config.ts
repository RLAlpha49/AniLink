/** Protocols supported by provider-specific build-time tooling. */
export type ProviderProtocol = "graphql" | "rest";

/**
 * Describes the source ownership needed to generate one provider's artifacts.
 *
 * A future provider adds a configuration value instead of adding another
 * provider-specific branch to the AniList generator.
 */
export interface ProviderGenerationConfig {
    /** Stable provider identifier written to generated manifests. */
    readonly id: string;
    /** Wire protocol used by the provider. */
    readonly protocol: ProviderProtocol;
    /** Provider source root relative to `src/`. */
    readonly sourceRoot: string;
    /** Default endpoint shown in generated tooling. */
    readonly endpoint: string;
}

/** Build-time configuration for the existing AniList GraphQL provider. */
export const ANILIST_PROVIDER_CONFIG: ProviderGenerationConfig = {
    id: "anilist",
    protocol: "graphql",
    sourceRoot: "apis/graphql/anilist",
    endpoint: "https://graphql.anilist.co",
};

/** Build-time configuration for the MyAnimeList REST provider. */
export const MAL_PROVIDER_CONFIG: ProviderGenerationConfig = {
    id: "mal",
    protocol: "rest",
    sourceRoot: "apis/rest/mal",
    endpoint: "https://api.myanimelist.net/v2",
};
