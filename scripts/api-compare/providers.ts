/**
 * Per-provider configuration for the schema-comparison pipeline.
 *
 * Adding a new provider means adding an entry here (plus a schema snapshot at
 * `schemaPath`) — no changes to the CLI or comparison core are required.
 */
export interface ProviderConfig {
    /** CLI identifier used with the `--provider` flag. */
    name: string;
    /** Human-readable provider name used in log and report output. */
    label: string;
    /** Repository-relative path of the provider's schema or OpenAPI snapshot. */
    schemaPath: string;
    /** Repository-relative root of the provider's package source. */
    sourceRoot: string;
    /** Repository-relative directory where comparison reports are written. */
    reportDirectory: string;
    /** Comparison protocol: GraphQL introspection or OpenAPI contract. */
    protocol: "graphql" | "openapi";
    /** GraphQL endpoint used for `--live` comparisons and `update-schema`. */
    graphqlUrl?: string;
    /** Reference page embedding the OpenAPI document, for OpenAPI providers. */
    openApiUrl?: string;
}

/**
 * Registry of every provider the schema-comparison CLI can target, keyed by
 * the value passed to `--provider`. Adding a provider means adding an entry
 * here plus a schema snapshot at its `schemaPath`.
 */
export const providerConfigs: Record<string, ProviderConfig> = {
    anilist: {
        name: "anilist",
        label: "AniList",
        schemaPath: "scripts/api-compare/anilist-schema.json",
        sourceRoot: "src/apis/graphql/anilist",
        reportDirectory: "artifacts/anilist-api-compare",
        protocol: "graphql",
        graphqlUrl: "https://graphql.anilist.co",
    },
    mal: {
        name: "mal",
        label: "MyAnimeList",
        schemaPath: "scripts/api-compare/mal-openapi.json",
        sourceRoot: "src/apis/rest/mal",
        reportDirectory: "artifacts/mal-api-compare",
        protocol: "openapi",
        openApiUrl: "https://myanimelist.net/apiconfig/references/api/v2",
    },
};

/**
 * Resolves a provider by CLI name.
 *
 * @param name - Provider identifier from `--provider`; required, so a
 *   missing flag is an explicit usage error rather than a silent default.
 * @returns The matching {@link ProviderConfig}.
 * @throws {Error} When `name` is missing or not a key in {@link providerConfigs}.
 */
export function resolveProvider(name: string): ProviderConfig {
    const config = providerConfigs[name];
    if (!config) {
        throw new Error(
            `Unknown or missing provider "${name}". Pass --provider with one of: ${Object.keys(providerConfigs).join(", ")}`
        );
    }
    return config;
}
