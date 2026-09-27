import { readFile } from "node:fs/promises";
import { join } from "node:path";
import ts from "typescript";
import type {
    RestEndpointMapping,
    RestEndpointRequestContract,
    RestTypeContract,
} from "../../lib/api-compare/openapi";

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
 * Request option interfaces excluded from the response and request contract
 * comparison.
 *
 * MAL operation parameter interfaces are extracted and linked to their wire
 * parameter names in `MAL_REQUEST_CONTRACTS`.
 */
const EXCLUDED_TYPE_NAMES = new Set(["MalRequestOptions"]);

/**
 * Whether an interface is excluded from REST contract extraction.
 *
 * @param name - The exported interface name.
 * @returns Whether the interface is excluded from the comparison.
 */
function isExcludedType(name: string): boolean {
    return EXCLUDED_TYPE_NAMES.has(name);
}

/**
 * Request contracts declared for each mapped MAL endpoint.
 *
 * These describe the names/types the package sends; body types are extracted
 * from the provider's request interfaces below.
 */
const MAL_REQUEST_CONTRACTS: Record<string, RestEndpointRequestContract> = {
    "GET /anime/{anime_id}": {
        paramsTypeName: "MalAnimeGetParams",
        parameters: [
            { name: "anime_id", in: "path", type: "number", sourceProperty: "id" },
            { name: "fields", in: "query", type: "string" },
        ],
    },
    "GET /anime": {
        paramsTypeName: "MalAnimeSearchParams",
        parameters: [
            { name: "q", in: "query", type: "string", sourceProperty: "q" },
            { name: "limit", in: "query", type: "number", sourceProperty: "limit" },
            { name: "offset", in: "query", type: "number", sourceProperty: "offset" },
            { name: "fields", in: "query", type: "string" },
        ],
    },
    "GET /anime/season/{year}/{season}": {
        paramsTypeName: "MalSeasonalParams",
        parameters: [
            { name: "year", in: "path", type: "number", sourceProperty: "year" },
            { name: "season", in: "path", type: "string", sourceProperty: "season" },
            { name: "fields", in: "query", type: "string" },
        ],
    },
    "GET /anime/ranking": {
        paramsTypeName: "MalRankingParams",
        parameters: [
            {
                name: "ranking_type",
                in: "query",
                type: "string",
                sourceProperty: "rankingType",
            },
            { name: "fields", in: "query", type: "string" },
        ],
    },
    "GET /anime/suggestions": {
        parameters: [{ name: "fields", in: "query", type: "string" }],
    },
    "PATCH /anime/{anime_id}/my_list_status": {
        paramsTypeName: "MalAnimeListStatusUpdateParams",
        parameters: [
            { name: "anime_id", in: "path", type: "number", sourceProperty: "id" },
            { name: "fields", in: "query", type: "string" },
        ],
        commonParameters: [{ name: "fields", in: "query", type: "string" }],
        requestBodyTypeName: "MalAnimeListStatusUpdate",
        requestBodyContentType: "application/x-www-form-urlencoded",
        bodyFieldTypeOverrides: { tags: "string" },
    },
    "DELETE /anime/{anime_id}/my_list_status": {
        paramsTypeName: "MalAnimeDeleteParams",
        parameters: [{ name: "anime_id", in: "path", type: "number", sourceProperty: "id" }],
    },
    "GET /manga/{manga_id}": {
        paramsTypeName: "MalMangaGetParams",
        parameters: [
            { name: "manga_id", in: "path", type: "number", sourceProperty: "id" },
            { name: "fields", in: "query", type: "string" },
        ],
    },
    "GET /manga": {
        paramsTypeName: "MalMangaSearchParams",
        parameters: [
            { name: "q", in: "query", type: "string", sourceProperty: "q" },
            { name: "limit", in: "query", type: "number", sourceProperty: "limit" },
            { name: "offset", in: "query", type: "number", sourceProperty: "offset" },
            { name: "fields", in: "query", type: "string" },
        ],
    },
    "GET /manga/ranking": {
        paramsTypeName: "MalMangaRankingParams",
        parameters: [
            {
                name: "ranking_type",
                in: "query",
                type: "string",
                sourceProperty: "rankingType",
            },
            { name: "fields", in: "query", type: "string" },
        ],
    },
    "PATCH /manga/{manga_id}/my_list_status": {
        paramsTypeName: "MalMangaListStatusUpdateParams",
        parameters: [
            { name: "manga_id", in: "path", type: "number", sourceProperty: "id" },
            { name: "fields", in: "query", type: "string" },
        ],
        commonParameters: [{ name: "fields", in: "query", type: "string" }],
        requestBodyTypeName: "MalMangaListStatusUpdate",
        requestBodyContentType: "application/x-www-form-urlencoded",
        bodyFieldTypeOverrides: { tags: "string" },
    },
    "DELETE /manga/{manga_id}/my_list_status": {
        paramsTypeName: "MalMangaDeleteParams",
        parameters: [{ name: "manga_id", in: "path", type: "number", sourceProperty: "id" }],
    },
    "GET /users/{user_name}": {
        paramsTypeName: "MalUserGetParams",
        parameters: [
            { name: "user_id", in: "path", type: "string", sourceProperty: "username" },
            { name: "fields", in: "query", type: "string" },
        ],
    },
    "GET /users/{user_name}/animelist": {
        paramsTypeName: "MalUserAnimeListParams",
        parameters: [
            { name: "user_name", in: "path", type: "string", sourceProperty: "username" },
            { name: "fields", in: "query", type: "string" },
            { name: "status", in: "query", type: "string", sourceProperty: "status" },
            { name: "sort", in: "query", type: "string", sourceProperty: "sort" },
            { name: "limit", in: "query", type: "number", sourceProperty: "limit" },
            { name: "offset", in: "query", type: "number", sourceProperty: "offset" },
        ],
        commonParameters: [{ name: "fields", in: "query", type: "string" }],
    },
    "GET /users/{user_name}/mangalist": {
        paramsTypeName: "MalUserMangaListParams",
        parameters: [
            { name: "user_name", in: "path", type: "string", sourceProperty: "username" },
            { name: "fields", in: "query", type: "string" },
            { name: "status", in: "query", type: "string", sourceProperty: "status" },
            { name: "sort", in: "query", type: "string", sourceProperty: "sort" },
            { name: "limit", in: "query", type: "number", sourceProperty: "limit" },
            { name: "offset", in: "query", type: "number", sourceProperty: "offset" },
        ],
        commonParameters: [{ name: "fields", in: "query", type: "string" }],
    },
    "GET /forum/boards": { parameters: [] },
    "GET /forum/topics": {
        paramsTypeName: "MalForumTopicsParams",
        parameters: [
            { name: "board_id", in: "query", type: "number", sourceProperty: "boardId" },
            {
                name: "subboard_id",
                in: "query",
                type: "number",
                sourceProperty: "subboardId",
            },
            { name: "q", in: "query", type: "string", sourceProperty: "q" },
            {
                name: "topic_user_name",
                in: "query",
                type: "string",
                sourceProperty: "topicUserName",
            },
            { name: "user_name", in: "query", type: "string", sourceProperty: "userName" },
            { name: "sort", in: "query", type: "string", sourceProperty: "sort" },
            { name: "limit", in: "query", type: "number", sourceProperty: "limit" },
            { name: "offset", in: "query", type: "number", sourceProperty: "offset" },
        ],
    },
    "GET /forum/topic/{topic_id}": {
        paramsTypeName: "MalForumTopicParams",
        parameters: [
            { name: "topic_id", in: "path", type: "number", sourceProperty: "id" },
            { name: "limit", in: "query", type: "number", sourceProperty: "limit" },
            { name: "offset", in: "query", type: "number", sourceProperty: "offset" },
        ],
    },
};

const MAL_ENDPOINT_MAPPING_ENTRIES: RestEndpointMapping[] = [
    { typeName: "MalAnime", path: "/anime/{anime_id}", method: "get" },
    { typeName: "MalAnimeSearchEntry", path: "/anime", method: "get", dataItems: true },
    { typeName: "MalAnimeSearchResponse", path: "/anime", method: "get" },
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
    { typeName: "MalMangaSearchEntry", path: "/manga", method: "get", dataItems: true },
    { typeName: "MalMangaSearchResponse", path: "/manga", method: "get" },
    {
        typeName: "MalMangaRankingEntry",
        path: "/manga/ranking",
        method: "get",
        dataItems: true,
    },
    { typeName: "MalMangaRankingResponse", path: "/manga/ranking", method: "get" },
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
    { typeName: "MalForumBoardsResponse", path: "/forum/boards", method: "get" },
    { typeName: "MalForumTopicSummary", path: "/forum/topics", method: "get", dataItems: true },
    { typeName: "MalForumTopicsResponse", path: "/forum/topics", method: "get" },
    {
        typeName: "MalForumTopicDetail",
        path: "/forum/topic/{topic_id}",
        method: "get",
        dataItems: true,
    },
    { typeName: "MalForumTopicResponse", path: "/forum/topic/{topic_id}", method: "get" },
];

/**
 * The package types compared against the MAL OpenAPI spec, with each endpoint's
 * request contract attached to its response mappings.
 *
 * Add new endpoints to the request inventory above and add their response
 * mappings here.
 */
export const MAL_ENDPOINT_MAPPINGS: RestEndpointMapping[] = attachRequestContracts(
    MAL_ENDPOINT_MAPPING_ENTRIES
);

function attachRequestContracts(mappings: RestEndpointMapping[]): RestEndpointMapping[] {
    const endpoints = new Set<string>();
    const mapped = mappings.map((mapping) => {
        const endpoint = `${mapping.method.toUpperCase()} ${mapping.path}`;
        const requestContract = MAL_REQUEST_CONTRACTS[endpoint];
        if (!requestContract) {
            throw new Error(`No MAL request contract configured for ${endpoint}`);
        }
        endpoints.add(endpoint);
        return { ...mapping, requestContract };
    });

    const unusedContracts = Object.keys(MAL_REQUEST_CONTRACTS).filter(
        (endpoint) => !endpoints.has(endpoint)
    );
    if (unusedContracts.length > 0) {
        throw new Error(
            `MAL request contracts have no endpoint mappings: ${unusedContracts.join(", ")}`
        );
    }
    return mapped;
}

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
 * Walks the provider's REST source root, skips request options, and parses
 * exported response, request-parameter, and request-body interfaces into flat
 * field maps. This mirrors the AniList contract extraction in
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
    const interfacesByName = new Map(
        file.statements
            .filter(ts.isInterfaceDeclaration)
            .map((statement) => [statement.name.text, statement])
    );

    const collectFields = (
        statement: ts.InterfaceDeclaration,
        fields: RestTypeContract["fields"],
        visited = new Set<string>()
    ): void => {
        if (visited.has(statement.name.text)) return;
        visited.add(statement.name.text);

        for (const heritage of statement.heritageClauses ?? []) {
            if (heritage.token !== ts.SyntaxKind.ExtendsKeyword) continue;
            for (const type of heritage.types) {
                if (!ts.isIdentifier(type.expression)) continue;
                const base = interfacesByName.get(type.expression.text);
                if (base) collectFields(base, fields, visited);
            }
        }

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
    };

    for (const statement of file.statements) {
        if (!ts.isInterfaceDeclaration(statement)) continue;
        if (!hasExportModifier(statement)) continue;
        const name = statement.name.text;
        if (isExcludedType(name)) continue;
        const fields: RestTypeContract["fields"] = {};
        collectFields(statement, fields);
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
