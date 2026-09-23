/**
 * Generate the AniList facade group files from the operation registry.
 *
 * `src/apis/graphql/anilist/facade/query-group.ts` and
 * `src/apis/graphql/anilist/facade/mutation-group.ts` are generated: every
 * member signature derives from the bound method on the operation class
 * registered in `registry.ts`, and the curated JSDoc prose (container briefs,
 * summaries, `@returns` prose, `@example` blocks) lives in
 * `generate-facade-groups.config.ts`.
 *
 * Usage:
 *   npm run facade:generate             # write updated files
 *   npm run facade:generate -- --check  # exit 1 when any file is stale
 */
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { format, resolveConfig } from "prettier";
import { FACADE_OPERATION_DOCS, type FacadeOperationDoc } from "./generate-facade-groups.config";
import {
    ANILIST_OPERATION_REGISTRY,
    type OperationCategory,
    type RegistryFacadeOperationKey,
} from "../src/apis/graphql/anilist/registry";

const REPO_ROOT = resolve(import.meta.dirname, "..");
const ANILIST_DIR = join(REPO_ROOT, "src/apis/graphql/anilist");

/**
 * Read-through cache for source files, so repeated class and type lookups
 * read each file only once during a generation pass.
 */
const sourceCache = new Map<string, string>();

/**
 * Read a UTF-8 source file through {@link sourceCache}.
 *
 * @param path - Absolute path of the file to read.
 * @returns The file's text.
 */
function readSource(path: string): string {
    let source = sourceCache.get(path);
    if (source === undefined) {
        source = readFileSync(path, "utf8");
        sourceCache.set(path, source);
    }
    return source;
}

/**
 * Escape a parsed identifier for safe interpolation into a `RegExp` body.
 *
 * Registry names come from `registry.ts` source text; a metacharacter in a
 * future name would silently break the interpolated regexes instead of
 * failing generation.
 *
 * @param identifier - The identifier to escape.
 * @returns The identifier with every RegExp metacharacter backslash-escaped.
 */
function escapeRegExp(identifier: string): string {
    return identifier.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Repository-relative output paths, keyed by group kind. */
const OUTPUTS = {
    query: "src/apis/graphql/anilist/facade/query-group.ts",
    mutation: "src/apis/graphql/anilist/facade/mutation-group.ts",
} as const;

/** One declarative entry collected from the typed operation registry. */
interface RegistryEntry {
    category: OperationCategory;
    name: string;
    className: string;
    methodName: string;
    fieldsEnabled: boolean;
    alwaysKeys: readonly string[];
}

/** Shape returned by the source parser retained for focused parser tests. */
type ParsedRegistryEntry = Omit<RegistryEntry, "alwaysKeys">;

/** The derived signature facts for one bound operation method. */
interface MethodInfo {
    hasVariables: boolean;
    variablesType: string | null;
    variablesOptional: boolean;
    responseType: string;
    see: string | null;
    /** Whether the operation accepts a `fields` selection option, as declared by the registry entry's `fieldsEnabled` flag. */
    hasFields: boolean;
    /** Root-level keys the operation always selects, quoted for a type union (e.g. `"id" | "idMal"`); parsed from the class's composeDocument argument. */
    alwaysKeys: string[];
    /** Identifier-to-module map of the class file's own imports (class-relative). */
    imports: Map<string, string>;
    /** Types declared inside the class file itself (not imported). */
    declaredLocally: Set<string>;
    /** AniList-relative module path of the class (e.g. `query/page/Users`). */
    classModule: string;
    /**
     * The type name bounding the narrowing overload's `FieldPath`, when the
     * class declares one beyond the response type (e.g. a document-bounded
     * alias). `null` when the bound is the response type itself.
     */
    fieldPathType: string | null;
    /** The response element type selected by the narrowing overload's `DeepPick`. */
    selectionType: string;
}

/**
 * The signature facts other generators need for one operation, without the
 * facade-rendering internals.
 */
export interface OperationSignature {
    /** The facade section the operation is exposed under. */
    category: "query" | "page" | "mutation";
    /** The facade key the bound method is exposed under. */
    name: string;
    /** The variables interface name, or `""` for operations without variables. */
    variablesType: string;
    /** The response type name (array suffix allowed). */
    responseType: string;
}

/**
 * Collect the signature facts for every registered operation.
 *
 * The single shared metadata source for generators: the facade group
 * generator renders its members from these facts, and the operation-reference
 * generator consumes them instead of re-parsing the generated facade source
 * with regexes — so a formatting change in one generator can never silently
 * break the other's discovery.
 *
 * @returns One signature per registry entry, in declaration order.
 * @throws {Error} When a class method cannot be found or parsed.
 */
export function collectOperationSignatures(): OperationSignature[] {
    return collectRegistryEntries().map((entry) => {
        const method = loadMethodInfo(entry);
        return {
            category: entry.category,
            name: entry.name,
            variablesType: method.hasVariables ? (method.variablesType ?? "") : "",
            responseType: method.responseType,
        };
    });
}

/**
 * Collect entries from the typed operation registry.
 *
 * Operation class references, method names, fields flags, and always-key
 * arrays come directly from the exported registry values.
 *
 * @returns All registry entries in declaration order.
 */
export function collectRegistryEntries(): RegistryEntry[] {
    return (Object.keys(ANILIST_OPERATION_REGISTRY) as OperationCategory[]).flatMap((category) =>
        ANILIST_OPERATION_REGISTRY[category].map((entry) => ({
            category,
            name: entry.name,
            className: entry.operationClass.name,
            methodName: entry.methodName,
            fieldsEnabled: entry.fieldsEnabled,
            alwaysKeys: entry.alwaysKeys,
        }))
    );
}

/**
 * Parse registry source text for focused parser tests.
 *
 * Production generation reads {@link ANILIST_OPERATION_REGISTRY} directly.
 * This helper remains exported for tests against synthetic registry source.
 *
 * @param registrySource - The full text of `registry.ts`.
 * @returns All registry entries in declaration order.
 * @throws {Error} When a category group or the registry object cannot be found,
 *   or when an `op`/`opAs` call in a category block is not parsed by the entry
 *   regex (a call shape the regex does not cover would otherwise be silently
 *   dropped from generation).
 */
export function parseRegistrySource(registrySource: string): ParsedRegistryEntry[] {
    const objectStart = registrySource.indexOf("ANILIST_OPERATION_REGISTRY");
    const objectEnd = registrySource.indexOf("} as const", objectStart);
    if (objectStart < 0 || objectEnd < 0) {
        throw new Error("Could not locate ANILIST_OPERATION_REGISTRY in registry.ts.");
    }
    const objectText = registrySource.slice(objectStart, objectEnd);

    const entries: ParsedRegistryEntry[] = [];
    for (const category of ["query", "page", "mutation"] as const) {
        const categoryMatch = new RegExp(`${category}:\\s*\\[([\\s\\S]*?)\\]`).exec(objectText);
        if (!categoryMatch) {
            throw new Error(`Could not locate the "${category}" group in registry.ts.`);
        }
        const entryRegex =
            /\b(?:opAs|op)\(\s*"([^"]+)"\s*,\s*(\w+)\s*(?:,\s*"([^"]+)"\s*)?(?:,\s*\{\s*fieldsEnabled:\s*(true|false)\s*,?\s*(?:alwaysKeys:\s*\w+\s*,?\s*)?\}\s*)?\)/g;
        const parsed = [...categoryMatch[1].matchAll(entryRegex)].map((entry) => ({
            category,
            name: entry[1],
            className: entry[2],
            methodName: entry[3] ?? entry[1],
            fieldsEnabled: entry[4] === "true",
        }));
        // Count guard: every op/opAs call in the block must be parsed. A call
        // shape the regex does not cover (e.g. an options object the
        // fieldsEnabled regex does not match) would otherwise be silently
        // dropped from generation — a wrong public facade with no error.
        const rawCalls = categoryMatch[1].match(/\b(?:opAs|op)\(/g) ?? [];
        if (parsed.length !== rawCalls.length) {
            throw new Error(
                `Registry "${category}" block has ${rawCalls.length} op/opAs calls but only ${parsed.length} parsed. ` +
                    "An entry shape is not covered by the entry regex; extend the regex or fix the registry."
            );
        }
        entries.push(...parsed);
    }
    return entries;
}

/**
 * Resolve the class module path for a registry entry's operation class.
 *
 * @param className - The imported operation class name.
 * @returns The AniList-relative module path (e.g. `query/User`).
 * @throws {Error} When the class is not imported by `registry.ts`.
 */
function classModuleFor(entry: RegistryEntry): string {
    const className = entry.className;
    const classDirectory =
        entry.category === "mutation"
            ? join(ANILIST_DIR, "mutation")
            : entry.category === "page"
              ? join(ANILIST_DIR, "query", "page")
              : join(ANILIST_DIR, "query");
    const classDeclaration = new RegExp(`export\\s+class\\s+${escapeRegExp(className)}\\b`);
    for (const file of readdirSync(classDirectory).filter((name) => name.endsWith(".ts"))) {
        const classPath = join(classDirectory, file);
        if (classDeclaration.test(readSource(classPath))) {
            return relative(ANILIST_DIR, classPath).replace(/\\/g, "/").replace(/\.ts$/, "");
        }
    }
    throw new Error(`Operation class ${className} was not found under ${classDirectory}.`);
}

/**
 * Extract the derived signature facts from one operation class method.
 *
 * @param entry - The registry entry declaring the method.
 * @returns The method's variables/response types, optionality, first `@see`
 * URL, and the class file's import map for response-type resolution.
 * @throws {Error} When the class file or the bound method cannot be found.
 */
function loadMethodInfo(entry: RegistryEntry): MethodInfo {
    const classModule = classModuleFor(entry);
    const classPath = join(ANILIST_DIR, `${classModule}.ts`);
    const source = readSource(classPath);

    const signatureRegex = new RegExp(
        `async\\s+${escapeRegExp(entry.methodName)}\\s*\\(([\\s\\S]*?)\\)\\s*:\\s*Promise<([^>]+)>`
    );
    const signature = signatureRegex.exec(source);
    if (!signature) {
        throw new Error(`Method ${entry.className}.${entry.methodName} not found in ${classPath}.`);
    }

    const parameters = signature[1].replace(/\s+/g, " ").trim();
    let hasVariables = false;
    let variablesType: string | null = null;
    let variablesOptional = false;
    for (const parameter of parameters.split(",")) {
        const parameterMatch = /^(\w+)(\?)?\s*:\s*([\w[\]]+)(\s*=\s*\{\})?$/.exec(parameter.trim());
        if (!parameterMatch) continue;
        if (parameterMatch[1] === "variables") {
            hasVariables = true;
            variablesType = parameterMatch[3];
            variablesOptional = Boolean(parameterMatch[2]) || Boolean(parameterMatch[4]);
        }
    }

    const before = source.slice(0, signature.index);
    const jsdocEnd = before.lastIndexOf("*/");
    const jsdocStart = before.lastIndexOf("/**", jsdocEnd);
    const jsdoc = before.slice(jsdocStart, jsdocEnd);
    const seeMatch = /@see\s+(\S+)/.exec(jsdoc);

    const imports = new Map<string, string>();
    for (const importMatch of source.matchAll(
        /import\s*(?:type\s+)?\{([\s\S]*?)\}\s*from\s*"([^"]+)"/g
    )) {
        for (const specifier of importMatch[1].split(",")) {
            const identifier = specifier
                .trim()
                .replace(/^type\s+/, "")
                .split(/\s+as\s+/)[0]
                .trim();
            if (identifier) imports.set(identifier, importMatch[2]);
        }
    }

    const declaredLocally = new Set<string>();
    for (const declaration of source.matchAll(/export\s+(?:interface|type)\s+(\w+)/g)) {
        declaredLocally.add(declaration[1]);
    }

    // Validate the registry flag against the method's parameter shape, not
    // the presence or formatting of a selection-module import.
    const methodSupportsFields = /\bfields\s*\??\s*:/.test(signature[1]);
    if (entry.fieldsEnabled !== methodSupportsFields) {
        throw new Error(
            `Registry entry "${entry.category}:${entry.name}" declares fieldsEnabled: ${entry.fieldsEnabled} ` +
                `but its class method ${entry.className}.${entry.methodName} ${methodSupportsFields ? "accepts" : "does not accept"} a fields parameter. ` +
                "Fix the registry flag or method signature so they agree."
        );
    }
    const hasFields = entry.fieldsEnabled;

    // The registry references the same key arrays the operation classes pass
    // to composeDocument, so generated types use runtime values directly.
    const alwaysKeys = entry.alwaysKeys.map((key) => JSON.stringify(key));

    // The narrowing overload may bound its `FieldPath` by a narrower type than
    // the response (e.g. a document-bounded alias omitting keys the maximal
    // document never selects). When the bound equals the response element
    // type — the un-bounded case every other operation has — store `null` so
    // the facade keeps emitting `FieldPath<Response>` unchanged. A bound the
    // strict regex cannot capture (a union, a qualified name, different
    // spacing) must throw rather than fall back to the wide response bound:
    // the silent fallback would emit a facade promising paths the composer
    // rejects — the exact drift this generator exists to prevent.
    const responseType = signature[2].trim();
    const fieldPathMatch = new RegExp(
        `async\\s+${escapeRegExp(entry.methodName)}<K extends FieldPath<(\\w+)>>`
    ).exec(source);
    if (hasFields && !fieldPathMatch) {
        throw new Error(
            `Method ${entry.className}.${entry.methodName} has a fields surface but its FieldPath bound was not recognized in ${classPath}. ` +
                "Expected async methodName<K extends FieldPath<TypeName>>; extend the generator regex for other bound shapes."
        );
    }
    const responseElement = responseType.replace(/\[\]$/, "");
    const fieldPathType =
        fieldPathMatch && fieldPathMatch[1] !== responseElement ? fieldPathMatch[1] : null;
    const selectionMatch = new RegExp(
        `async\\s+${escapeRegExp(entry.methodName)}<K extends FieldPath<\\w+>>[\\s\\S]*?Promise<DeepPick<(\\w+),`
    ).exec(source);
    if (hasFields && !selectionMatch) {
        throw new Error(
            `Method ${entry.className}.${entry.methodName} has an unrecognized DeepPick response in ${classPath}.`
        );
    }
    const selectionType = selectionMatch?.[1] ?? responseElement;

    return {
        hasVariables,
        variablesType,
        variablesOptional,
        responseType,
        see: seeMatch ? seeMatch[1] : null,
        hasFields,
        alwaysKeys,
        imports,
        declaredLocally,
        classModule,
        fieldPathType,
        selectionType,
    };
}

/** Cache for {@link findDeclaringModule}. */
const declaringModuleCache = new Map<string, string>();

/**
 * Find the AniList-relative module that declares an exported type.
 *
 * Used to resolve variables-type overrides, whose declaring module may
 * differ from the operation class module.
 *
 * @param typeName - The exported interface or type name.
 * @returns The AniList-relative module path.
 * @throws {Error} When no module under the AniList tree declares the type.
 */
function findDeclaringModule(typeName: string): string {
    if (declaringModuleCache.has(typeName)) return declaringModuleCache.get(typeName)!;
    const walk = (directory: string): string | null => {
        for (const entry of readdirSync(directory, { withFileTypes: true }).sort((a, b) =>
            a.name.localeCompare(b.name)
        )) {
            const entryPath = join(directory, entry.name);
            if (entry.isDirectory()) {
                const found = walk(entryPath);
                if (found) return found;
            } else if (entry.name.endsWith(".ts")) {
                const source = readSource(entryPath);
                if (new RegExp(`export\\s+(?:interface|type)\\s+${typeName}\\b`).test(source)) {
                    return relative(ANILIST_DIR, entryPath)
                        .replace(/\\/g, "/")
                        .replace(/\.ts$/, "");
                }
            }
        }
        return null;
    };
    const found = walk(ANILIST_DIR);
    if (!found) {
        throw new Error(`No module under src/apis/graphql/anilist declares "${typeName}".`);
    }
    declaringModuleCache.set(typeName, found);
    return found;
}

/**
 * Resolve the facade-relative import path for a response type.
 *
 * The response type is looked up in the operation class file's own imports;
 * types declared inside the class file itself resolve to the class module;
 * inline primitives (e.g. `string`, `string[]`) resolve to no import.
 *
 * @param responseType - The response type name (array suffix allowed).
 * @param method - The derived method info carrying the class import map and source.
 * @returns The facade-relative module path, or `null` when no import is needed.
 */
function resolveResponseModule(responseType: string, method: MethodInfo): string | null {
    const baseType = responseType.replace(/\[\]$/, "");
    const classRelative = method.imports.get(baseType);
    if (classRelative) {
        const classDir = dirname(join(ANILIST_DIR, method.classModule));
        const resolved = resolve(classDir, classRelative);
        return `../${relative(ANILIST_DIR, resolved).replace(/\\/g, "/")}`;
    }
    if (method.declaredLocally.has(baseType)) {
        return `../${method.classModule}`;
    }
    return null;
}

/** Read the compile-time checked prose entry for a typed registry operation. */
function operationDocFor(entry: RegistryEntry): FacadeOperationDoc {
    const key = `${entry.category}:${entry.name}` as RegistryFacadeOperationKey;
    return FACADE_OPERATION_DOCS[key];
}

/** The uniform `@param options` prose shared by every member. */
const OPTIONS_PARAM_PROSE =
    "@param options - Optional per-request transport settings ({@link RequestOptions}) merged over the instance-level ones for this call only.";

/** The uniform `@throws` prose shared by every mutation member. */
const MUTATION_THROWS_PROSE =
    "If the client is unauthenticated, variables fail validation, or the request fails.";

/**
 * Render one facade member (JSDoc plus signature) as source lines.
 *
 * @param entry - The registry entry for the member.
 * @param doc - The curated prose for the member.
 * @param method - The derived signature facts.
 * @param indent - The member's indentation width (8 for query/mutation, 12 for page).
 * @returns The rendered source lines.
 * @throws {Error} When neither the class method nor the config carries a `@see` URL.
 */
function renderMember(
    entry: RegistryEntry,
    doc: FacadeOperationDoc,
    method: MethodInfo,
    indent: number
): string[] {
    const pad = " ".repeat(indent);
    const variablesType = doc.variablesType ?? method.variablesType;
    const seeUrl = doc.see ?? method.see;
    if (!seeUrl) {
        throw new Error(`No @see URL found for ${entry.category}:${entry.name}.`);
    }

    const lines: string[] = [`${pad}/**`];
    for (const summaryLine of doc.summary.split("\n")) {
        lines.push(`${pad} * ${summaryLine}`.trimEnd());
    }
    if (doc.blankAfterSummary) lines.push(`${pad} *`);

    if (method.hasVariables && variablesType) {
        const paramProse = doc.paramVariables
            ? doc.paramVariables.replace(/\{variables\}/g, variablesType)
            : `The {@link ${variablesType}} for the ${
                  entry.category === "mutation" ? "mutation" : "query"
              }.`;
        lines.push(`${pad} * @param {${variablesType}} variables - ${paramProse}`);
    }
    lines.push(`${pad} * ${OPTIONS_PARAM_PROSE}`);

    const returnsLines = doc.returns.split("\n");
    lines.push(`${pad} * @returns {Promise<${method.responseType}>} ${returnsLines[0]}`);
    for (const continuation of returnsLines.slice(1)) {
        lines.push(`${pad} * ${continuation}`);
    }
    if (entry.category === "mutation") {
        lines.push(`${pad} * @throws ${MUTATION_THROWS_PROSE}`);
    }
    if (doc.deprecated) {
        lines.push(`${pad} * @deprecated ${doc.deprecated}`);
    }
    lines.push(`${pad} *`);
    lines.push(`${pad} * @example`);
    for (const exampleLine of doc.example.split("\n")) {
        lines.push(`${pad} * ${exampleLine}`.trimEnd());
    }
    lines.push(`${pad} * @see ${seeUrl}`);
    lines.push(`${pad} */`);

    if (method.hasVariables && variablesType) {
        const optionalMarker = method.variablesOptional ? "?" : "";
        if (method.hasFields) {
            // A `fields` operation carries a three-member intersection: the
            // default call returns the full response, a call with `fields:
            // undefined` (the conditional pattern) also returns the full
            // response, and a call with `fields` narrows to `DeepPick<Response,
            // K | Always>` — the always-selected keys join the pick because the
            // composed document always sends them. Array responses keep their
            // element-wise pick. The narrowing overload's `FieldPath` bound is
            // the class's own bound when it declares one beyond the response
            // type (a document-bounded alias), so the facade cannot promise
            // paths the composer would reject.
            const response = method.responseType;
            const arrayMatch = /^(\w+)\[\]$/.exec(response);
            const element = arrayMatch ? arrayMatch[1] : response;
            const alwaysUnion = method.alwaysKeys.length
                ? ` | ${method.alwaysKeys.join(" | ")}`
                : "";
            const narrow = arrayMatch
                ? `DeepPick<${method.selectionType}, K${alwaysUnion}>[]`
                : `DeepPick<${method.selectionType}, K${alwaysUnion}>`;
            lines.push(
                `${pad}${entry.name}: ((variables${optionalMarker}: ${variablesType}, options?: RequestOptions & { fields?: undefined }) => Promise<${response}>) &`
            );
            lines.push(
                `${pad}    ((variables: ${variablesType}, options: RequestOptions & { fields: undefined }) => Promise<${response}>) &`
            );
            lines.push(`${pad}    (<K extends FieldPath<${method.fieldPathType ?? element}>>(`);
            lines.push(`${pad}        variables: ${variablesType},`);
            lines.push(
                `${pad}        options: RequestOptions & { fields: readonly K[] | undefined }`
            );
            lines.push(`${pad}    ) => Promise<${narrow}>);`);
        } else {
            lines.push(
                `${pad}${entry.name}: (variables${optionalMarker}: ${variablesType}, options?: RequestOptions) => Promise<${method.responseType}>;`
            );
        }
    } else {
        lines.push(
            `${pad}${entry.name}: (options?: RequestOptions) => Promise<${method.responseType}>;`
        );
    }
    return lines;
}

/**
 * Build the deterministic import block for one group file.
 *
 * @param imports - Module path to imported type names.
 * @returns The rendered import lines.
 */
function renderImports(imports: Map<string, string[]>): string[] {
    const lines: string[] = [];
    for (const modulePath of [...imports.keys()].sort()) {
        const names = [...imports.get(modulePath)!].sort();
        const specifiers = names.map((name) => `type ${name}`).join(", ");
        lines.push(`import { ${specifiers} } from "${modulePath}";`);
    }
    return lines;
}

/** The compile-time parity assert block emitted into `query-group.ts`. */
const QUERY_PARITY_BLOCK = `/**
 * Compile-time exhaustiveness check between this facade group and the
 * operation registry. The bidirectional type assertions ensure that
 * \`RegistryQueryKeys\` and \`Exclude<keyof AniListQueries["query"], "page">\`
 * are the same set, and that \`RegistryPageKeys\` and
 * \`keyof AniListQueries["query"]["page"]\` are the same set. A key added or
 * removed in either place produces a type error. The registry is the source
 * of truth; this asserts the typed surface keeps pace.
 */
const _assertQueryParity: RegistryQueryKeys = null as unknown as Exclude<
    keyof AniListQueries["query"],
    "page"
>;
const _assertQueryParityReverse: Exclude<keyof AniListQueries["query"], "page"> =
    null as unknown as RegistryQueryKeys;
const _assertPageParity: RegistryPageKeys =
    null as unknown as keyof AniListQueries["query"]["page"];
const _assertPageParityReverse: keyof AniListQueries["query"]["page"] =
    null as unknown as RegistryPageKeys;`;

/** The compile-time parity assert block emitted into `mutation-group.ts`. */
const MUTATION_PARITY_BLOCK = `/**
 * Compile-time exhaustiveness check between this facade group and the
 * operation registry. The bidirectional type assertion ensures that
 * \`RegistryMutationKeys\` and \`keyof AniListMutations["mutation"]\` are the
 * same set: a key added or removed in either place produces a type error. The
 * registry is the source of truth; this asserts the typed surface keeps pace.
 */
const _assertMutationParity: RegistryMutationKeys =
    null as unknown as keyof AniListMutations["mutation"];
const _assertMutationParityReverse: keyof AniListMutations["mutation"] =
    null as unknown as RegistryMutationKeys;`;

/** The generated-file notice appended to both file headers. */
const GENERATED_NOTE = ` *
 * GENERATED FILE — do not edit by hand; regenerate with \`npm run facade:generate\`.
 * Signatures derive from the operation registry and operation classes; curated
 * JSDoc prose lives in scripts/generate-facade-groups.config.ts.`;

/**
 * Render the `query` container JSDoc (brief list) for `AniListQueries`.
 *
 * @param entries - The registry query entries, in declaration order.
 * @returns The rendered JSDoc lines (unindented; the caller applies padding).
 */
function renderQueryContainerDoc(entries: RegistryEntry[]): string[] {
    const lines = [
        "Query methods for fetching data from the AniList API.",
        "@public",
        "@type {Object}",
    ];
    for (const entry of entries) {
        const doc = operationDocFor(entry);
        lines.push(`@property {Function} ${entry.name} - ${doc.brief}`);
    }
    lines.push("@property {Object} page - Fetches pages of data from the AniList API.");
    lines.push("@see https://docs.anilist.co/reference/query");
    return lines;
}

/**
 * Render the nested `page` container JSDoc for `AniListQueries`.
 *
 * @param entries - The registry page entries, in declaration order.
 * @returns The rendered JSDoc lines (unindented; the caller applies padding).
 */
function renderPageContainerDoc(entries: RegistryEntry[]): string[] {
    const lines = [
        "{@link AniListQueries} groups the paginated query operations. All page queries mirror the single-object queries above",
        "with the addition of `page` and `perPage` variables, and return a `*PageResponse` carrying the items",
        "plus `PageInfo` pagination metadata. Drive them with `paginate` or",
        "`paginatePages` to walk all pages automatically.",
        "",
        "@public",
        "@type {Object}",
    ];
    for (const entry of entries) {
        const doc = operationDocFor(entry);
        lines.push(`@property {Function} ${entry.name} - ${doc.brief}`);
    }
    return lines;
}

/**
 * Render the `mutation` container JSDoc for `AniListMutations`.
 *
 * @param entries - The registry mutation entries, in declaration order.
 * @returns The rendered JSDoc lines (unindented; the caller applies padding).
 */
function renderMutationContainerDoc(entries: RegistryEntry[]): string[] {
    const lines = [
        "Mutation methods for updating data on the AniList API.",
        "@public",
        "@type {Object}",
    ];
    for (const entry of entries) {
        const doc = operationDocFor(entry);
        lines.push(`@property {Function} ${entry.name} - ${doc.brief}`);
    }
    lines.push("");
    lines.push("Must be authenticated for all mutations.");
    return lines;
}

/**
 * Assemble the raw (pre-Prettier) content of both group files.
 *
 * @param entries - All registry entries.
 * @returns Repository-relative output path to raw file content.
 * @throws {Error} When a member's class method or config prose cannot be resolved.
 */
function buildRawFiles(entries: RegistryEntry[]): Map<string, string> {
    const queryEntries = entries.filter((entry) => entry.category === "query");
    const pageEntries = entries.filter((entry) => entry.category === "page");
    const mutationEntries = entries.filter((entry) => entry.category === "mutation");

    const queryImports = new Map<string, string[]>([
        ["../../../../base/RequestHandler", ["RequestOptions"]],
        ["../registry", ["RegistryPageKeys", "RegistryQueryKeys"]],
        ["../schemas/selection/fieldsSelection", ["DeepPick", "FieldPath"]],
    ]);
    const mutationImports = new Map<string, string[]>([
        ["../../../../base/RequestHandler", ["RequestOptions"]],
        ["../registry", ["RegistryMutationKeys"]],
        ["../schemas/selection/fieldsSelection", ["DeepPick", "FieldPath"]],
    ]);

    /** Register one type import on a group's import map. */
    const addImport = (imports: Map<string, string[]>, modulePath: string, name: string): void => {
        const existing = imports.get(modulePath);
        if (existing) {
            if (!existing.includes(name)) existing.push(name);
        } else {
            imports.set(modulePath, [name]);
        }
    };

    /** Derive the facade-relative module for a variables type (override-aware). */
    const variablesModule = (doc: FacadeOperationDoc, method: MethodInfo): string => {
        const type = doc.variablesType ?? method.variablesType;
        if (!type) throw new Error("variablesModule called without a variables type.");
        if (doc.variablesType) return `../${findDeclaringModule(doc.variablesType)}`;
        return `../${method.classModule}`;
    };

    const queryMemberLines: string[] = [];
    for (const entry of queryEntries) {
        const doc = operationDocFor(entry);
        const method = loadMethodInfo(entry);
        queryMemberLines.push(...renderMember(entry, doc, method, 8));
        queryMemberLines.push("");
        if (method.hasVariables && (doc.variablesType ?? method.variablesType)) {
            addImport(
                queryImports,
                variablesModule(doc, method),
                doc.variablesType ?? method.variablesType!
            );
        }
        const responseModule = resolveResponseModule(method.responseType, method);
        if (responseModule) {
            addImport(queryImports, responseModule, method.responseType.replace(/\[\]$/, ""));
        }
        for (const type of [method.fieldPathType, method.selectionType]) {
            if (type === null) continue;
            const modulePath = resolveResponseModule(type, method);
            if (modulePath) addImport(queryImports, modulePath, type);
        }
    }

    const pageMemberLines: string[] = [];
    for (const entry of pageEntries) {
        const doc = operationDocFor(entry);
        const method = loadMethodInfo(entry);
        pageMemberLines.push(...renderMember(entry, doc, method, 12));
        pageMemberLines.push("");
        if (method.hasVariables && (doc.variablesType ?? method.variablesType)) {
            addImport(
                queryImports,
                variablesModule(doc, method),
                doc.variablesType ?? method.variablesType!
            );
        }
        const responseModule = resolveResponseModule(method.responseType, method);
        if (responseModule) {
            addImport(queryImports, responseModule, method.responseType.replace(/\[\]$/, ""));
        }
        for (const type of [method.fieldPathType, method.selectionType]) {
            if (type === null) continue;
            const modulePath = resolveResponseModule(type, method);
            if (modulePath) addImport(queryImports, modulePath, type);
        }
    }

    const mutationMemberLines: string[] = [];
    for (const entry of mutationEntries) {
        const doc = operationDocFor(entry);
        const method = loadMethodInfo(entry);
        mutationMemberLines.push(...renderMember(entry, doc, method, 8));
        mutationMemberLines.push("");
        if (method.hasVariables && (doc.variablesType ?? method.variablesType)) {
            addImport(
                mutationImports,
                variablesModule(doc, method),
                doc.variablesType ?? method.variablesType!
            );
        }
        const responseModule = resolveResponseModule(method.responseType, method);
        if (responseModule) {
            addImport(mutationImports, responseModule, method.responseType.replace(/\[\]$/, ""));
        }
        for (const type of [method.fieldPathType, method.selectionType]) {
            if (type === null) continue;
            const modulePath = resolveResponseModule(type, method);
            if (modulePath) addImport(mutationImports, modulePath, type);
        }
    }

    // Drop the trailing blank separator after the last member of each section.
    if (queryMemberLines.length > 0) queryMemberLines.pop();
    if (pageMemberLines.length > 0) pageMemberLines.pop();
    if (mutationMemberLines.length > 0) mutationMemberLines.pop();

    const queryLines: string[] = [
        "/**",
        " * The `query` member (query + page operations) of the `AniListApi` type.",
        GENERATED_NOTE,
        " */",
        ...renderImports(queryImports),
        "",
        QUERY_PARITY_BLOCK,
        "",
        "/**",
        " * Typed AniList query operations exposed by `AniListApi`.",
        " *",
        " * @see https://docs.anilist.co/reference/query",
        " */",
        "export type AniListQueries = {",
        "    /**",
    ];
    for (const line of renderQueryContainerDoc(queryEntries)) {
        queryLines.push(`     * ${line}`.trimEnd());
    }
    queryLines.push("     */", "    query: {", ...queryMemberLines, "        /**");
    for (const line of renderPageContainerDoc(pageEntries)) {
        queryLines.push(`         * ${line}`.trimEnd());
    }
    queryLines.push(
        "         */",
        "        page: {",
        ...pageMemberLines,
        "        };",
        "    };",
        "};"
    );

    const mutationLines: string[] = [
        "/**",
        " * The `mutation` member of the `AniListApi` type.",
        GENERATED_NOTE,
        " */",
        ...renderImports(mutationImports),
        "",
        MUTATION_PARITY_BLOCK,
        "",
        "/**",
        " * Typed AniList mutation operations exposed by `AniListApi`.",
        " *",
        " * @see https://docs.anilist.co/reference/mutation",
        " */",
        "export type AniListMutations = {",
        "    /**",
    ];
    for (const line of renderMutationContainerDoc(mutationEntries)) {
        mutationLines.push(`     * ${line}`.trimEnd());
    }
    mutationLines.push("     */", "    mutation: {", ...mutationMemberLines, "    };", "};");

    return new Map<string, string>([
        [OUTPUTS.query, queryLines.join("\n") + "\n"],
        [OUTPUTS.mutation, mutationLines.join("\n") + "\n"],
    ]);
}

/**
 * Format generated content with the repository's Prettier configuration.
 *
 * @param content - Raw generated content.
 * @param outputPath - Repository-relative output path used for config resolution.
 * @returns The formatted content.
 */
async function formatWithPrettier(content: string, outputPath: string): Promise<string> {
    const config = await resolveConfig(join(REPO_ROOT, outputPath));
    return format(content, { ...(config ?? {}), filepath: join(REPO_ROOT, outputPath) });
}

/**
 * Generate the formatted content of both facade group files.
 *
 * Reads the registry and operation classes, validates the curated config, and
 * returns Prettier-formatted output for each file without touching disk.
 *
 * @returns Repository-relative output path to formatted content.
 * @throws {Error} When the registry, a class method, or the config is invalid.
 */
export async function generateFacadeGroupFiles(): Promise<Map<string, string>> {
    const rawFiles = buildRawFiles(collectRegistryEntries());
    const formatted = new Map<string, string>();
    for (const [path, raw] of rawFiles) {
        formatted.set(path, await formatWithPrettier(raw.replace(/\r\n/g, "\n"), path));
    }
    return formatted;
}

/**
 * Generate or check both facade group files.
 *
 * In normal mode this writes changed files. With `--check`, it only reports
 * stale outputs and returns a non-zero status for CI.
 *
 * @returns Process-style status code: `0` when current, `1` when stale in check mode.
 */
async function main(): Promise<number> {
    const check = process.argv.includes("--check");
    const generated = await generateFacadeGroupFiles();

    const changed: string[] = [];
    for (const [path, content] of generated) {
        let current: string | undefined;
        try {
            current = readFileSync(join(REPO_ROOT, path), "utf8").replace(/\r\n/g, "\n");
        } catch {
            current = undefined;
        }
        if (current !== content) changed.push(path);
        if (!check) writeFileSync(join(REPO_ROOT, path), content, "utf8");
    }

    if (changed.length === 0) {
        console.log(`Generated facade groups up to date (${generated.size} files checked).`);
        return 0;
    }
    if (check) {
        console.error(`Generated facade groups are stale. Rerun 'npm run facade:generate':`);
        for (const path of changed) console.error(`  ${path}`);
        return 1;
    }
    console.log(`Updated ${changed.length} generated facade group file(s):`);
    for (const path of changed) console.log(`  ${path}`);
    return 0;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
    void main().then((exitCode) => {
        process.exitCode = exitCode;
    });
}
