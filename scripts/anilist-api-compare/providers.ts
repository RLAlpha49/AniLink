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
    /** Repository-relative path of the provider's schema introspection snapshot. */
    schemaPath: string;
    /** Repository-relative root of the provider's package source. */
    sourceRoot: string;
    /** Repository-relative directory where comparison reports are written. */
    reportDirectory: string;
    /** GraphQL endpoint used for `--live` comparisons and `update-schema`. */
    graphqlUrl?: string;
}

/**
 * Provider name selected when the CLI is invoked without `--provider`.
 *
 * Matches the `name` field of the AniList entry in {@link providerConfigs}.
 */
export const DEFAULT_PROVIDER_NAME = "anilist";

/**
 * Registry of every provider the schema-comparison CLI can target, keyed by
 * the value passed to `--provider`. Adding a provider means adding an entry
 * here plus a schema snapshot at its `schemaPath`.
 */
export const providerConfigs: Record<string, ProviderConfig> = {
    anilist: {
        name: "anilist",
        label: "AniList",
        schemaPath: "scripts/anilist-api-compare/anilist-schema.json",
        sourceRoot: "src/apis/graphql/anilist",
        reportDirectory: "artifacts/anilist-api-compare",
        graphqlUrl: "https://graphql.anilist.co",
    },
};

/**
 * Resolves a provider by CLI name, falling back to the default provider when
 * no `--provider` flag is given.
 *
 * @param name - Provider identifier from `--provider`, or `undefined` to
 *   select {@link DEFAULT_PROVIDER_NAME}.
 * @returns The matching {@link ProviderConfig}.
 * @throws {Error} When `name` is not a key in {@link providerConfigs}.
 */
export function resolveProvider(name?: string): ProviderConfig {
    const key = name ?? DEFAULT_PROVIDER_NAME;
    const config = providerConfigs[key];
    if (!config) {
        throw new Error(
            `Unknown provider "${name}". Available providers: ${Object.keys(providerConfigs).join(", ")}`
        );
    }
    return config;
}
