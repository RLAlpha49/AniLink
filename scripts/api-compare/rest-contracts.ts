import { readFile } from "node:fs/promises";
import { join } from "node:path";
import ts from "typescript";
import type { RestEndpointMapping, RestTypeContract } from "../../lib/api-compare/openapi";

/**
 * The provider source trees whose type contracts are compared against their
 * OpenAPI specs, keyed by provider name.
 *
 * Adding a REST provider means adding an entry here plus endpoint mappings.
 */
const PROVIDER_SOURCE_ROOTS: Record<string, string> = {
    mal: "src/apis/rest/mal",
};

/**
 * Package interfaces intentionally excluded from the contract comparison.
 *
 * - `MalRequestOptions` and the per-operation params interfaces are request
 *   shapes, not response contracts; their query parameters are validated by
 *   the integration suite instead. Every params interface follows the
 *   `Mal<Thing>Params` naming convention, so the convention itself is the
 *   exclusion — a new params type is excluded automatically and cannot
 *   silently slip a request shape into the response-contract comparison.
 * - `MalAnimeListStatusUpdate` / `MalMangaListStatusUpdate` are form-encoded
 *   request bodies; the spec declares them inline per-operation rather than
 *   as named components, so they are verified by the live integration tests.
 */
const EXCLUDED_TYPE_NAMES = new Set([
    "MalRequestOptions",
    "MalAnimeListStatusUpdate",
    "MalMangaListStatusUpdate",
]);

/**
 * Whether an interface is a request shape excluded from the response-contract
 * comparison: the named exclusions plus every `Mal<Thing>Params` type.
 *
 * @param name - The exported interface name.
 * @returns Whether the interface is excluded from the comparison.
 */
function isExcludedType(name: string): boolean {
    return EXCLUDED_TYPE_NAMES.has(name) || (name.startsWith("Mal") && name.endsWith("Params"));
}

/**
 * The package types compared against the MAL OpenAPI spec, each mapped to the
 * endpoint whose response schema governs it.
 *
 * Adding a wrapped MAL endpoint means adding its response interface here.
 */
export const MAL_ENDPOINT_MAPPINGS: RestEndpointMapping[] = [
    { typeName: "MalAnime", path: "/anime/{anime_id}", method: "get" },
    {
        typeName: "MalSeasonalAnime",
        path: "/anime/season/{year}/{season}",
        method: "get",
        dataItems: true,
    },
    { typeName: "MalSeasonalAnimeResponse", path: "/anime/season/{year}/{season}", method: "get" },
    { typeName: "MalRankingEntry", path: "/anime/ranking", method: "get", dataItems: true },
    { typeName: "MalAnimeRankingResponse", path: "/anime/ranking", method: "get" },
    { typeName: "MalSuggestion", path: "/anime/suggestions", method: "get", dataItems: true },
    { typeName: "MalAnimeSuggestionsResponse", path: "/anime/suggestions", method: "get" },
    {
        typeName: "MalAnimeListStatus",
        path: "/anime/{anime_id}/my_list_status",
        method: "patch",
    },
    { path: "/anime/{anime_id}/my_list_status", method: "delete" },
    { typeName: "MalManga", path: "/manga/{manga_id}", method: "get" },
    { typeName: "MalMangaListStatus", path: "/manga/{manga_id}/my_list_status", method: "patch" },
    { path: "/manga/{manga_id}/my_list_status", method: "delete" },
    { typeName: "MalUser", path: "/users/{user_name}", method: "get" },
    {
        typeName: "MalUserAnimeListEntry",
        path: "/users/{user_name}/animelist",
        method: "get",
        dataItems: true,
    },
    { typeName: "MalUserAnimeListResponse", path: "/users/{user_name}/animelist", method: "get" },
    {
        typeName: "MalUserMangaListEntry",
        path: "/users/{user_name}/mangalist",
        method: "get",
        dataItems: true,
    },
    { typeName: "MalUserMangaListResponse", path: "/users/{user_name}/mangalist", method: "get" },
];

/**
 * The endpoint mappings per REST provider, keyed by the provider name used
 * in `providerConfigs`.
 *
 * Adding a REST provider means adding an entry here.
 */
export const REST_PROVIDER_MAPPINGS: Record<string, { endpoints: RestEndpointMapping[] }> = {
    mal: { endpoints: MAL_ENDPOINT_MAPPINGS },
};

/**
 * Extract a provider's type contracts from its source tree.
 *
 * Walks the provider's REST source root (skipping the excluded request-shape
 * interfaces) and parses every exported interface into a flat field map,
 * mirroring the AniList contract extraction in
 * `lib/api-compare/typescript-contracts.ts`.
 *
 * @param repositoryRoot - Repository root containing the provider source tree.
 * @param provider - Provider name whose source root is walked.
 * @returns The extracted contracts, keyed by interface name.
 * @throws {Error} When the provider is unknown or the source tree cannot be read.
 */
export async function discoverRestContracts(
    repositoryRoot: string,
    provider: string
): Promise<Record<string, RestTypeContract>> {
    const sourceRoot = PROVIDER_SOURCE_ROOTS[provider];
    if (!sourceRoot) {
        throw new Error(`No REST source root configured for provider "${provider}"`);
    }
    const contracts: Record<string, RestTypeContract> = {};
    const files = await collectTypeScriptFiles(join(repositoryRoot, sourceRoot));
    for (const sourcePath of files) {
        const sourceText = await readFile(sourcePath, "utf8");
        Object.assign(contracts, extractContracts(sourcePath, sourceText));
    }
    return contracts;
}

/**
 * Parse one source file's exported interfaces into contracts.
 *
 * @param sourcePath - Absolute path of the source file.
 * @param sourceText - The file's contents.
 * @returns The file's contracts, keyed by interface name.
 */
function extractContracts(
    sourcePath: string,
    sourceText: string
): Record<string, RestTypeContract> {
    const file = ts.createSourceFile(sourcePath, sourceText, ts.ScriptTarget.Latest, true);
    const contracts: Record<string, RestTypeContract> = {};

    for (const statement of file.statements) {
        if (!ts.isInterfaceDeclaration(statement)) continue;
        if (!hasExportModifier(statement)) continue;
        const name = statement.name.text;
        if (isExcludedType(name)) continue;
        const fields: RestTypeContract["fields"] = {};
        for (const member of statement.members) {
            if (!ts.isPropertySignature(member)) continue;
            const propertyName =
                member.name && ts.isIdentifier(member.name) ? member.name.text : undefined;
            if (!propertyName || !member.type) continue;
            const normalized = normalizeType(member.type);
            fields[propertyName] = {
                type: normalized.type,
                optional: Boolean(member.questionToken),
                array: normalized.array,
            };
        }
        contracts[name] = { name, sourcePath, fields };
    }
    return contracts;
}

/** Check whether a declaration carries an `export` modifier. */
function hasExportModifier(statement: ts.InterfaceDeclaration): boolean {
    return Boolean(
        statement.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword)
    );
}

/**
 * Normalize a TypeScript type node to a comparison type.
 *
 * @param type - The declared type node.
 * @returns The base type name and whether it is an array.
 */
function normalizeType(type: ts.TypeNode): { type: string; array: boolean } {
    if (ts.isArrayTypeNode(type)) {
        return { ...normalizeType(type.elementType), array: true };
    }
    if (ts.isUnionTypeNode(type)) {
        const nonNull = type.types.find(
            (item) =>
                item.kind !== ts.SyntaxKind.NullKeyword &&
                item.kind !== ts.SyntaxKind.UndefinedKeyword
        );
        if (nonNull) return normalizeType(nonNull);
    }
    const keywordKinds = new Map<ts.SyntaxKind, string>([
        [ts.SyntaxKind.StringKeyword, "string"],
        [ts.SyntaxKind.NumberKeyword, "number"],
        [ts.SyntaxKind.BooleanKeyword, "boolean"],
    ]);
    const keyword = keywordKinds.get(type.kind);
    if (keyword) return { type: keyword, array: false };
    if (ts.isTypeReferenceNode(type)) {
        return { type: type.typeName.getText(), array: false };
    }
    return { type: "unknown", array: false };
}

/** Recursively collect TypeScript files below a directory in name order. */
async function collectTypeScriptFiles(directoryPath: string): Promise<string[]> {
    const { readdir } = await import("node:fs/promises");
    const files: string[] = [];
    const entries = (await readdir(directoryPath, { withFileTypes: true })).sort((left, right) =>
        left.name.localeCompare(right.name)
    );
    for (const entry of entries) {
        const entryPath = join(directoryPath, entry.name);
        if (entry.isDirectory()) {
            files.push(...(await collectTypeScriptFiles(entryPath)));
        } else if (entry.name.endsWith(".ts")) {
            files.push(entryPath);
        }
    }
    return files;
}
