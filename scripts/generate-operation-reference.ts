/**
 * Build-time generator for the AniLink operation reference.
 *
 * Usage:
 *   npm run docs:operations             # write the manifests
 *   npm run docs:operations -- --check  # exit 1 when any manifest is stale
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, statSync } from "node:fs";
import { dirname, relative, resolve, join } from "node:path";
import { pathToFileURL } from "node:url";
import { ANILIST_PROVIDER_CONFIG } from "./provider-config";
import { collectOperationSignatures, parseRegistrySource } from "./generate-facade-groups";

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------

/** A single request parameter or response field. */
export interface ParamField {
    /** Parameter or field name. */
    name: string;
    /** TypeScript type as written in source (readable form). */
    type: string;
    /** Whether the parameter is required. */
    required: boolean;
    /** JSDoc description. */
    description: string;
    /** Allowed values when the parameter maps to an enum. */
    enumValues?: string[];
    /** Nested fields when the parameter maps to an input object. */
    nestedFields?: ParamField[];
}

/** One thrown-error entry. */
export interface ThrowsEntry {
    /** Error class name. */
    error: string;
    /** Condition text. */
    condition: string;
}

/** One upstream or TypeDoc link. */
export interface OpLink {
    /** Link label. */
    label: string;
    /** Absolute URL. */
    url: string;
}

/** A single public operation in the reference manifest. */
export interface ReferenceOperation {
    /** Provider identifier. */
    provider: "anilist" | "mal";
    /** Wire protocol. */
    protocol: "graphql" | "rest";
    /** Resource domain used for sidebar grouping. */
    domain: string;
    /** Namespace path, e.g. `anilist.query.media` or `mal.anime.get`. */
    namespace: string;
    /** Public operation name. */
    name: string;
    /** Category within the provider surface. */
    category: "query" | "mutation" | "page" | "custom" | "rest";
    /** Signature line. */
    signature: string;
    /** Purpose extracted from JSDoc. */
    purpose: string;
    /** Auth requirement text. */
    auth: string;
    /** Request parameters. */
    request: ParamField[];
    /** Response type name. */
    responseType: string;
    /** Response fields with descriptions. */
    response: ParamField[];
    /** Thrown errors. */
    errors: ThrowsEntry[];
    /** Runnable example (JSDoc `@example` body). */
    example: string;
    /** Links (TypeDoc + upstream reference). */
    links: OpLink[];
}

/** The full manifest written to `operations.json`. */
export interface ReferenceManifest {
    /** ISO timestamp for the generation run. */
    generatedAt: string;
    /** Operations across all providers. */
    operations: ReferenceOperation[];
}

/** A provider/category slice of the complete operation-reference manifest. */
export interface ReferenceSectionManifest {
    /** ISO timestamp shared with the complete manifest. */
    generatedAt: string;
    /** Provider represented by this section. */
    provider: ReferenceOperation["provider"];
    /** Category represented by this section. */
    category: ReferenceOperation["category"];
    /** Operations in this provider/category section. */
    operations: ReferenceOperation[];
}

const ROOT = resolve(import.meta.dirname, "..");
const SRC = join(ROOT, "src");
const TYPEDOC_BASE = "https://anilink.alpha49.com/typedoc/";

/** Read a file as UTF-8 text, returning "" if missing. */
function readFileText(p: string): string {
    try {
        return readFileSync(p, "utf8");
    } catch {
        return "";
    }
}

/** Collapse a string to a single trimmed line of description text. */
function cleanDescription(desc: string): string {
    return desc
        .replace(/^\`[^\`]+\`\s+is\s+/i, "")
        .replace(
            /\{\@(?:link|see)\s+([^}|]+)(?:\|([^}]*))?\}/g,
            (_m, target: string, label?: string) => (label ?? target).trim()
        )
        .replace(/\s+/g, " ")
        .trim();
}

/** Strip JSDoc comment decoration, returning the inner text. */
function jsdocInner(jsdoc: string): string {
    return jsdoc
        .replace(/^\s*\/\*\*/, "")
        .replace(/\*\/\s*$/, "")
        .replace(/^\s*\*\s?/gm, "")
        .trim();
}

/** Extract the main description text from a JSDoc block (text before any @tag). */
function jsdocMainText(jsdoc: string): string {
    const inner = jsdocInner(jsdoc);
    const tagIdx = inner.search(/^\s*@/m);
    const main = tagIdx >= 0 ? inner.slice(0, tagIdx) : inner;
    return cleanDescription(main);
}

/** Extract the `@example` code block body from a JSDoc block. */
function jsdocExample(jsdoc: string): string {
    const inner = jsdocInner(jsdoc);
    const m = /@example\s*\n+```(?:typescript|ts)?\n([\s\S]*?)```/.exec(inner);
    return m ? m[1].trimEnd() : "";
}

/** Extract all `@see` URLs from a JSDoc block. */
function jsdocSeeUrls(jsdoc: string): string[] {
    const inner = jsdocInner(jsdoc);
    const out: string[] = [];
    const re = /@see\s+(https?:\/\/\S+)/g;
    let m = re.exec(inner);
    while (m !== null) {
        out.push(m[1]);
        m = re.exec(inner);
    }
    return out;
}

/** Find the JSDoc block (`/** ... *\/`) immediately preceding `lineIndex`. */
function findJsdocAbove(lines: string[], lineIndex: number): string {
    let i = lineIndex - 1;
    while (i >= 0 && lines[i].trim() === "") i--;
    if (i < 0 || !lines[i].includes("*/")) return "";
    const end = i;
    let start = end;
    while (start >= 0 && !lines[start].includes("/**")) start--;
    if (start < 0) return "";
    return lines.slice(start, end + 1).join("\n");
}

/** Match braces starting at `openIdx` (which must point at `{`); return index of the closing `}`. */
function matchBrace(text: string, openIdx: number): number {
    let depth = 0;
    let i = openIdx;
    while (i < text.length) {
        const ch = text[i];
        if (ch === "`") {
            i = skipTemplateLiteral(text, i);
            continue;
        }
        if (ch === "{") depth++;
        else if (ch === "}") {
            depth--;
            if (depth === 0) return i;
        }
        i++;
    }
    return -1;
}

/** Skip a template literal starting at the backtick at `start`. */
function skipTemplateLiteral(text: string, start: number): number {
    let i = start + 1;
    while (i < text.length) {
        const ch = text[i];
        if (ch === "\\") {
            i += 2;
            continue;
        }
        if (ch === "`") return i + 1;
        if (ch === "$" && text[i + 1] === "{") {
            i = skipTemplateExpr(text, i + 1);
            continue;
        }
        i++;
    }
    return i;
}

/** Skip a `${...}` expression starting at the `{` at `start`. */
function skipTemplateExpr(text: string, start: number): number {
    let depth = 0;
    let i = start;
    while (i < text.length) {
        const ch = text[i];
        if (ch === "`") {
            i = skipTemplateLiteral(text, i);
            continue;
        }
        if (ch === "{") depth++;
        else if (ch === "}") {
            depth--;
            if (depth === 0) return i + 1;
        }
        i++;
    }
    return i;
}

// ---------------------------------------------------------------------------
// Interface / type parsing
// ---------------------------------------------------------------------------

interface RawMember {
    name: string;
    rawType: string;
    required: boolean;
    description: string;
}

/** Parse an interface body into raw members. */
function parseInterfaceMembers(filePath: string, interfaceName: string): RawMember[] {
    const content = readFileText(filePath);
    const re = new RegExp(String.raw`export interface ${interfaceName}\s*\{`);
    const m = re.exec(content);
    if (!m) return [];
    const openIdx = content.indexOf("{", m.index);
    const closeIdx = matchBrace(content, openIdx);
    if (closeIdx < 0) return [];
    const body = content.slice(openIdx + 1, closeIdx);
    const bodyLines = body.split("\n");
    const members: RawMember[] = [];
    for (let i = 0; i < bodyLines.length; i++) {
        const line = bodyLines[i];
        const memberMatch = /^(\s*)(\w+)\??\s*:\s*([^;]+);/.exec(line);
        if (!memberMatch) continue;
        const name = memberMatch[2];
        const optional = /\w+\?\s*:/.test(line);
        const rawType = memberMatch[3].trim();
        const description = memberDescriptionAbove(bodyLines, i);
        members.push({ name, rawType, required: !optional, description });
    }
    return members;
}

/** Find the JSDoc description for the member at `bodyLines[index]`. */
function memberDescriptionAbove(bodyLines: string[], index: number): string {
    let j = index - 1;
    while (j >= 0 && bodyLines[j].trim() === "") j--;
    if (j < 0 || !bodyLines[j].includes("*/")) return "";
    const end = j;
    let start = end;
    while (start >= 0 && !bodyLines[start].includes("/**")) start--;
    if (start < 0) return "";
    return jsdocMainText(bodyLines.slice(start, end + 1).join("\n"));
}

/** Convert RawMember[] to ParamField[] (readable types). */
function toParamFields(members: RawMember[]): ParamField[] {
    return members.map((mem) => ({
        name: mem.name,
        type: mem.rawType,
        required: mem.required,
        description: mem.description,
    }));
}

/** Find the file containing `export interface <interfaceName>` starting from a hint file's directory. */
function findInterfaceFile(hintFilePath: string, interfaceName: string): string | null {
    const hintRe = new RegExp(String.raw`export interface ${interfaceName}\s*\{`);
    if (hintRe.test(readFileText(hintFilePath))) {
        return hintFilePath;
    }
    const dir = dirname(hintFilePath);
    const candidates = [dir, dirname(dir)];
    for (const d of candidates) {
        if (!existsSync(d)) continue;
        for (const name of readdirSync(d)) {
            if (!name.endsWith(".ts")) continue;
            const full = join(d, name);
            const content = readFileText(full);
            if (hintRe.test(content)) {
                return full;
            }
        }
    }
    return null;
}

/** Check whether a file contains `export interface <interfaceName>`. */
function interfaceInFile(filePath: string, interfaceName: string): boolean {
    if (!interfaceName) return false;
    const content = readFileText(filePath);
    return new RegExp(String.raw`export interface ${interfaceName}\s*\{`).test(content);
}

// ---------------------------------------------------------------------------
// Response-shape extraction
// ---------------------------------------------------------------------------

/** Directories searched for response type definitions. */
const RESPONSE_SEARCH_DIRS = [
    "apis/graphql/anilist/schemas",
    "apis/graphql/anilist/schemas/responses",
    "apis/graphql/anilist/interfaces",
    "apis/rest/mal",
];

/** Find the file declaring `export interface <name>` under the AniList/MAL type trees. */
function findResponseTypeFile(typeName: string): string | null {
    for (const rel of RESPONSE_SEARCH_DIRS) {
        const dir = join(SRC, rel);
        if (!existsSync(dir)) continue;
        const found = searchDirForInterface(dir, typeName, 0);
        if (found) return found;
    }
    return null;
}

/** Recursively search a directory for an interface declaration. */
function searchDirForInterface(dir: string, typeName: string, depth: number): string | null {
    if (depth > 4) return null;
    for (const name of readdirSync(dir)) {
        const full = join(dir, name);
        const stat = statSync(full);
        if (stat.isDirectory()) {
            const found = searchDirForInterface(full, typeName, depth + 1);
            if (found) return found;
        } else if (name.endsWith(".ts")) {
            const content = readFileText(full);
            if (new RegExp(String.raw`export interface ${typeName}\s*\{`).test(content)) {
                return full;
            }
        }
    }
    return null;
}

/** Extract response fields for a type name, following one level of nesting. */
function extractResponseFields(typeName: string, depth = 0): ParamField[] {
    if (depth > 2 || !typeName) return [];
    const file = findResponseTypeFile(typeName);
    if (!file) return [];
    const members = parseInterfaceMembers(file, typeName);
    return members.map((mem) => {
        const field: ParamField = {
            name: mem.name,
            type: mem.rawType,
            required: mem.required,
            description: mem.description,
        };
        const nestedMatch = /^([A-Z]\w*)$/.exec(mem.rawType);
        if (nestedMatch && depth === 0) {
            const nested = extractResponseFields(nestedMatch[1], depth + 1);
            if (nested.length > 0) field.nestedFields = nested;
        }
        return field;
    });
}

// ---------------------------------------------------------------------------
// AniList GraphQL operation discovery
// ---------------------------------------------------------------------------

interface RawOp {
    category: "query" | "mutation" | "page" | "custom";
    name: string;
    variablesType: string;
    responseType: string;
    description: string;
}

/**
 * Discover the AniList operations from the shared generator metadata.
 *
 * Signature facts (name, variables type, response type) come from
 * {@link collectOperationSignatures} — the same source the facade group
 * generator renders from — instead of re-parsing the generated facade source
 * with regexes, so a formatting change in the facade generator can never
 * silently drop operations here. The `custom` entry is not a registry
 * operation and is still read from `custom-group.ts`. Descriptions fall back
 * to the facade JSDoc main text, read positionally from the facade files.
 */
function discoverAniListOperations(sourceRoot: string): RawOp[] {
    const ops: RawOp[] = [];
    for (const signature of collectOperationSignatures()) {
        const facade = resolveAniListFacade(
            { ...signature, description: "", responseType: signature.responseType },
            sourceRoot
        );
        const description = facade
            ? jsdocMainText(findFacadePropertyJsdoc(facade.facadeFile, facade.propName))
            : "";
        ops.push({
            category: signature.category,
            name: signature.name,
            variablesType: signature.variablesType,
            responseType: signature.responseType,
            description,
        });
    }
    // The `custom` passthrough is not a registry operation; read it from its
    // facade module as before.
    ops.push(...discoverOperationsInFile(join(sourceRoot, "facade", "custom-group.ts")));
    return ops;
}

/**
 * Read the `custom` passthrough entry from its facade module.
 *
 * Only the `custom` operation is discovered from facade text: it is not a
 * registry operation, so the shared signature metadata does not cover it.
 * Every registered operation arrives via {@link collectOperationSignatures}.
 */
function discoverOperationsInFile(filePath: string): RawOp[] {
    const content = readFileText(filePath);
    const lines = content.split("\n");
    const ops: RawOp[] = [];
    for (let i = 0; i < lines.length; i++) {
        if (/^\s*custom\s*:/.test(lines[i])) {
            ops.push({
                category: "custom",
                name: "custom",
                variablesType: "",
                responseType: "any",
                description: jsdocMainText(findJsdocAbove(lines, i)),
            });
        }
    }
    return ops;
}

/** Resolve the source class, method, and file for an AniList operation. */
function resolveAniListSourceInfo(
    op: RawOp,
    sourceRoot: string
): { className: string; methodName: string; sourceFile: string } | null {
    const registryCandidates = resolveRegistryCandidates(op, sourceRoot);
    if (registryCandidates.length > 0) {
        return pickCandidate(registryCandidates, op, sourceRoot);
    }
    const wiringCandidates = resolveWiringCandidates(op, sourceRoot);
    return pickCandidate(wiringCandidates, op, sourceRoot);
}

/** Resolve candidate class/method pairs from `registry.ts` entries. */
function resolveRegistryCandidates(
    op: RawOp,
    sourceRoot: string
): Array<{ methodName: string; className: string }> {
    const registryPath = join(sourceRoot, "registry.ts");
    if (!existsSync(registryPath)) return [];
    const content = readFileText(registryPath);
    return parseRegistrySource(content)
        .filter((entry) => entry.name === op.name && entry.category === op.category)
        .map(({ className, methodName }) => ({ className, methodName }));
}

/** Resolve candidate class/method pairs from `wiring.ts` bindings. */
function resolveWiringCandidates(
    op: RawOp,
    sourceRoot: string
): Array<{ methodName: string; className: string }> {
    const content = readFileText(join(sourceRoot, "wiring.ts"));
    if (!content) return [];
    const escapedName = op.name.replace(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);
    const re = new RegExp(String.raw`${escapedName}:\s+(\w+)\.(\w+)\.bind`, "g");
    const candidates: Array<{ methodName: string; className: string }> = [];
    let m = re.exec(content);
    while (m !== null) {
        const instanceVar = m[1];
        const methodName = m[2];
        const escapedInst = instanceVar.replace(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);
        const newRe = new RegExp(String.raw`const ${escapedInst}\s*=\s*new\s+(\w+)`);
        const nm = newRe.exec(content);
        if (nm) candidates.push({ methodName, className: nm[1] });
        m = re.exec(content);
    }
    return candidates;
}

/** Pick the first candidate whose class file exists, preferring a variables-interface match. */
function pickCandidate(
    candidates: Array<{ methodName: string; className: string }>,
    op: RawOp,
    sourceRoot: string
): { className: string; methodName: string; sourceFile: string } | null {
    for (const cand of candidates) {
        const sourceFile = findClassFile(cand.className, op.category, sourceRoot);
        if (sourceFile && interfaceInFile(sourceFile, op.variablesType)) {
            return { ...cand, sourceFile };
        }
    }
    for (const cand of candidates) {
        const sourceFile = findClassFile(cand.className, op.category, sourceRoot);
        if (sourceFile) return { ...cand, sourceFile };
    }
    return null;
}

/** Find the source file containing `export class <className>` for a given category. */
function findClassFile(
    className: string,
    category: RawOp["category"],
    sourceRoot: string
): string | null {
    const dirs: string[] = [];
    if (category === "query") {
        dirs.push(join(sourceRoot, "query"), join(sourceRoot, "query", "page"));
    } else if (category === "page") {
        dirs.push(join(sourceRoot, "query", "page"));
    } else if (category === "mutation") {
        dirs.push(join(sourceRoot, "mutation"));
    } else {
        return null;
    }
    for (const dir of dirs) {
        if (!existsSync(dir)) continue;
        for (const name of readdirSync(dir)) {
            if (!name.endsWith(".ts")) continue;
            const full = join(dir, name);
            const content = readFileText(full);
            if (new RegExp(String.raw`export class ${className}\b`).test(content)) return full;
        }
    }
    return null;
}

/** Extract the JSDoc block above `async <methodName>(` in a source file. */
function findMethodJsdoc(filePath: string, methodName: string): string {
    const content = readFileText(filePath);
    const lines = content.split("\n");
    const methodRe = new RegExp(String.raw`async ${methodName}\s*\(`);
    for (let i = 0; i < lines.length; i++) {
        if (methodRe.test(lines[i])) return findJsdocAbove(lines, i);
    }
    return "";
}

/**
 * Resolve the public-facing facade property for an AniList operation.
 *
 * The catalog documents the call shape a user types in their own code
 * (e.g. `aniLink.anilist.query.user({ id: 1 })`), so it reads JSDoc
 * from the facade type file — not from the implementation class —
 * because only the facade carries the public `await aniLink.…` example.
 *
 * @returns Absolute path to the facade file and the property name to
 *   match on, or `null` if the operation has no facade entry (e.g.
 *   internal helpers).
 */
function resolveAniListFacade(
    op: RawOp,
    sourceRoot: string
): { facadeFile: string; propName: string } | null {
    if (op.category === "custom") {
        return { facadeFile: join(sourceRoot, "facade", "custom-group.ts"), propName: "custom" };
    }
    if (op.category === "page") {
        return { facadeFile: join(sourceRoot, "facade", "query-group.ts"), propName: op.name };
    }
    if (op.category === "query") {
        return { facadeFile: join(sourceRoot, "facade", "query-group.ts"), propName: op.name };
    }
    if (op.category === "mutation") {
        return { facadeFile: join(sourceRoot, "facade", "mutation-group.ts"), propName: op.name };
    }
    return null;
}

/**
 * Extract the JSDoc block above the public-facing facade property
 * `propName` in a facade type file. The facade signatures are
 * `<name>: (variables: T, options?: R) => Promise<U>;` rather than
 * `async name(...)`, so we match the property line by its identifier
 * and the `=> Promise` arrow instead.
 */
function findFacadePropertyJsdoc(filePath: string, propName: string): string {
    const content = readFileText(filePath);
    if (!content) return "";
    const lines = content.split("\n");
    // Property lines may wrap across multiple lines, so we join short
    // continuations (lines without `=>` and without a `;` terminator)
    // until we see the closing `;` that ends the signature.
    const propRe = new RegExp(String.raw`^\s*${propName}\s*:`);
    for (let i = 0; i < lines.length; i++) {
        if (!propRe.test(lines[i])) continue;
        let end = i;
        while (end < lines.length && !/;\s*(?:\/\/.*)?$/.test(lines[end])) end++;
        if (end >= lines.length) end = i;
        const joined = lines.slice(i, end + 1).join(" ");
        if (/=>\s*Promise</.test(joined)) return findJsdocAbove(lines, i);
    }
    return "";
}

// ---------------------------------------------------------------------------
// AniList domain / namespace / signature helpers
// ---------------------------------------------------------------------------

/** AniList domain mapping for sidebar grouping. */
const ANILIST_DOMAINS: Record<string, string> = {
    media: "Media",
    mediaTrend: "Media",
    airingSchedule: "Media",
    character: "Characters & Staff",
    staff: "Characters & Staff",
    studio: "Studios",
    user: "Users",
    viewer: "Users",
    following: "Users",
    follower: "Users",
    mediaList: "Lists",
    mediaListCollection: "Lists",
    genreCollection: "Taxonomy",
    mediaTagCollection: "Taxonomy",
    markdown: "Misc",
    aniChartUser: "Misc",
    siteStatistics: "Misc",
    externalLinkSourceCollection: "Taxonomy",
    notification: "Activity",
    activity: "Activity",
    activityReply: "Activity",
    thread: "Community",
    threadComment: "Community",
    review: "Reviews",
    recommendation: "Reviews",
    like: "Activity",
    page: "Page queries",
    saveMediaListEntry: "Lists",
    updateUser: "Users",
    deleteUser: "Users",
};

/** Map an AniList operation name to its domain. */
function anilistDomain(op: RawOp): string {
    if (op.category === "page") return "Page queries";
    if (op.category === "custom") return "Custom";
    const n = op.name;
    for (const key of Object.keys(ANILIST_DOMAINS)) {
        if (n === key || n.startsWith(key)) return ANILIST_DOMAINS[key];
    }
    if (/^(save|update|delete|toggle)/.test(n)) {
        if (/Activity|Like/.test(n)) return "Activity";
        if (/Thread/.test(n)) return "Community";
        if (/Review/.test(n)) return "Reviews";
        if (/Recommendation/.test(n)) return "Reviews";
        if (/Favourite|Fav/.test(n)) return "Users";
        if (/MediaList/.test(n)) return "Lists";
        if (/AniChart/.test(n)) return "Misc";
        if (/User/.test(n)) return "Users";
    }
    return "Misc";
}

/** Build the AniList namespace path for an operation. */
function anilistNamespace(op: RawOp): string {
    if (op.category === "custom") return "anilist.custom";
    if (op.category === "page") return `anilist.query.page.${op.name}`;
    if (op.category === "query") return `anilist.query.${op.name}`;
    return `anilist.mutation.${op.name}`;
}

/** Build the signature line for an AniList operation. */
function anilistSignature(op: RawOp): string {
    if (op.category === "custom") {
        return "custom<T>(query: string, variables?: Record<string, unknown>, options?: RequestOptions): Promise<T>";
    }
    const vars = op.variablesType ? `variables: ${op.variablesType}` : "";
    const args = vars ? `${vars}, options?: RequestOptions` : "options?: RequestOptions";
    return `${op.name}(${args}): Promise<${op.responseType}>`;
}

/** Build the auth requirement text for an AniList operation. */
function anilistAuth(op: RawOp): string {
    if (op.category === "mutation") {
        return "Required — AniList access token (constructor `authToken` or `anilist.authToken` credential slot).";
    }
    return "Not required — public data. Pass a token for viewer-scoped fields.";
}

// ---------------------------------------------------------------------------
// MAL REST operation discovery
// ---------------------------------------------------------------------------

/** The MAL facade methods that map to public operations. */
const MAL_FACADE_METHODS = new Set([
    "get",
    "me",
    "seasonal",
    "ranking",
    "suggestions",
    "animeList",
    "mangaList",
    "updateMyListStatus",
    "deleteFromList",
]);

/** The MAL facade methods that read public data without an access token. */
const MAL_PUBLIC_READ_METHODS = new Set(["get", "seasonal", "ranking", "animeList", "mangaList"]);

/**
 * Fallback purpose text per MAL operation, used when the facade JSDoc yields
 * no main text. Keyed by `namespace.methodName`; an unknown key throws so a
 * new operation without a fallback fails the docs build loudly instead of
 * being documented with another operation's text.
 */
const MAL_PURPOSE_FALLBACKS: Record<string, string> = {
    "anime.get": "Gets one anime by its MyAnimeList ID.",
    "manga.get": "Gets one manga by its MyAnimeList ID.",
    "anime.seasonal": "Gets the anime of one broadcast season.",
    "anime.ranking": "Gets one of MyAnimeList's anime ranking lists.",
    "anime.suggestions": "Gets MyAnimeList's anime suggestions for the authenticated user.",
    "user.animeList": "Gets a user's anime list, one page at a time.",
    "user.mangaList": "Gets a user's manga list, one page at a time.",
    "user.me": "Gets the currently authenticated MyAnimeList user.",
    "anime.updateMyListStatus": "Updates the authenticated user's anime list status.",
    "manga.updateMyListStatus": "Updates the authenticated user's manga list status.",
    "anime.deleteFromList": "Removes an anime from the authenticated user's list.",
    "manga.deleteFromList": "Removes a manga from the authenticated user's list.",
};

/** The MAL facade interface that owns each namespace. */
const MAL_FACADE_INTERFACES: Record<
    string,
    { namespace: "anime" | "manga" | "user"; domain: string }
> = {
    MyAnimeListAnimeApi: { namespace: "anime", domain: "Anime" },
    MyAnimeListMangaApi: { namespace: "manga", domain: "Manga" },
    MyAnimeListUserApi: { namespace: "user", domain: "User" },
};

/** Discover MAL REST operations from the facade source. */
function discoverMalOperations(): ReferenceOperation[] {
    const facadePath = join(SRC, "apis/rest/mal/facade.ts");
    const content = readFileText(facadePath);
    const lines = content.split("\n");
    const ops: ReferenceOperation[] = [];

    // Track which `export interface` block each signature falls within so the
    // anime and manga namespaces (which share method names `get`,
    // `updateMyListStatus`, `deleteFromList`) are distinguished.
    const ifaceRe = /^export interface (\w+) \{/gm;
    const ifaceSpans: { name: string; start: number; end: number }[] = [];
    let iface: RegExpExecArray | null;
    while ((iface = ifaceRe.exec(content)) !== null) {
        const name = iface[1];
        // Find the matching closing brace at column 0.
        const after = content.slice(iface.index + iface[0].length);
        const closeRel = after.search(/^}/m);
        ifaceSpans.push({
            name,
            start: iface.index,
            end: iface.index + iface[0].length + (closeRel === -1 ? after.length : closeRel),
        });
    }

    // Facade signatures are either single-line (`get`, `me`,
    // `deleteFromList`) or multi-line (`updateMyListStatus`); `[^)]*` spans
    // newlines so both shapes share one regex, and the `m` flag anchors each
    // match at a property line.
    const sigRe = /^ {4}(\w+):\s*\(([^)]*)\)\s*=>\s*Promise<(\w+)>;/gm;
    let sig: RegExpExecArray | null;
    while ((sig = sigRe.exec(content)) !== null) {
        const current: RegExpExecArray = sig;
        const methodName = current[1];
        if (!MAL_FACADE_METHODS.has(methodName)) continue;
        const span = ifaceSpans.find((s) => current.index >= s.start && current.index < s.end);
        const owner = span?.name ? MAL_FACADE_INTERFACES[span.name] : undefined;
        // Skip the composite `MyAnimeListApi` interface, which re-declares the
        // namespace properties as typed members rather than method signatures.
        if (!owner) continue;
        const lineIndex = content.slice(0, current.index).split("\n").length - 1;
        ops.push(
            buildMalOperation(
                owner.namespace,
                owner.domain,
                methodName,
                current[2].replace(/\s+/g, " ").trim(),
                current[3],
                findJsdocAbove(lines, lineIndex)
            )
        );
    }
    return ops;
}

/** Build one MAL ReferenceOperation from its facade signature. */
function buildMalOperation(
    namespace: "anime" | "manga" | "user",
    domain: string,
    methodName: string,
    params: string,
    responseType: string,
    jsdoc: string
): ReferenceOperation {
    const isPublicRead = MAL_PUBLIC_READ_METHODS.has(methodName);
    const request: ParamField[] = [];
    const paramRe = /(\w+)(\?)?:\s*([^,)]+)/g;
    let pm = paramRe.exec(params);
    while (pm !== null) {
        const pname = pm[1];
        request.push({
            name: pname,
            type: pm[3].trim(),
            required: !pm[2],
            description: malParamDescription(pname),
        });
        pm = paramRe.exec(params);
    }
    const optionsParam = request.find((r) => r.name === "options");
    if (optionsParam) {
        // `deleteFromList` resolves with no response body, so `fields` has
        // nothing to shape there; every other operation documents it.
        optionsParam.nestedFields =
            methodName === "deleteFromList"
                ? malOptionFields().filter((field) => field.name !== "fields")
                : malOptionFields();
    }
    // The unified `(params, options?)` convention: the params object carries
    // the API's own inputs. Every method with a `params` argument must be
    // mapped here — an unmapped method fails the build instead of silently
    // publishing wrong reference docs.
    const paramsParam = request.find((r) => r.name === "params");
    if (paramsParam) {
        const paramsFields = malParamsFields(namespace, methodName);
        if (paramsFields === undefined) {
            throw new Error(
                `No params fields mapped for mal.${namespace}.${methodName}; add it to malParamsFields.`
            );
        }
        paramsParam.nestedFields = paramsFields;
    }

    const errors: ThrowsEntry[] = isPublicRead
        ? [
              // The user-list reads fail fast on `@me` without a token, like `me`.
              ...(methodName === "animeList" || methodName === "mangaList"
                  ? [
                        { error: "AniLinkAuthError", condition: "`@me` without an access token" },
                        {
                            error: "AniLinkValidationError",
                            condition: "empty or whitespace-only `username`",
                        },
                    ]
                  : []),
              { error: "AniLinkRestError", condition: "non-success MyAnimeList response" },
              {
                  error: "AniLinkNetworkError",
                  condition: "timeout, cancellation, or other transport failure",
              },
          ]
        : [
              { error: "AniLinkAuthError", condition: "no MAL access token is configured" },
              // The list-status writes fail fast on an empty payload, like the
              // username reads fail fast on an empty username.
              ...(methodName === "updateMyListStatus"
                  ? [
                        {
                            error: "AniLinkValidationError",
                            condition: "params carries no list-status field to change",
                        },
                    ]
                  : []),
              { error: "AniLinkRestError", condition: "non-success MyAnimeList response" },
              {
                  error: "AniLinkNetworkError",
                  condition: "timeout, cancellation, or other transport failure",
              },
          ];

    const example = malExample(namespace, methodName);
    const upstream = malUpstreamReference(namespace, methodName);
    const signature = malSignature(methodName, params, responseType);
    const typedocInterface = malTypedocInterface(namespace);
    const jsdocPurpose = jsdocMainText(jsdoc);
    const purposeFallback = MAL_PURPOSE_FALLBACKS[`${namespace}.${methodName}`];
    if (jsdocPurpose === "" && purposeFallback === undefined) {
        throw new Error(
            `No JSDoc main text and no purpose fallback for mal.${namespace}.${methodName}; add one to MAL_PURPOSE_FALLBACKS.`
        );
    }

    return {
        provider: "mal",
        protocol: "rest",
        domain,
        namespace: `mal.${namespace}.${methodName}`,
        name: `${namespace}.${methodName}`,
        category: "rest",
        signature,
        purpose: jsdocPurpose || purposeFallback || "",
        auth: isPublicRead
            ? methodName === "get"
                ? `Not required for public ${namespace} data; pass an access token for list-related fields.`
                : methodName === "animeList" || methodName === "mangaList"
                  ? "Not required for public user lists; `@me` and private lists require an access token — a client ID alone cannot resolve `@me`."
                  : "Not required — a public read."
            : "Required — MAL OAuth2 access token (`mal.accessToken` credential slot).",
        request,
        responseType,
        response: extractResponseFields(responseType),
        errors,
        example,
        links: [
            { label: "TypeDoc", url: `${TYPEDOC_BASE}interfaces/${typedocInterface}.html` },
            { label: "MAL API reference", url: upstream },
        ],
    };
}

/** The TypeDoc interface page name for a MAL namespace.
 *
 * TypeDoc qualifies interface pages with their defining module, so the page
 * for `MyAnimeListAnimeApi` lives at
 * `interfaces/apis_rest_mal_facade.MyAnimeListAnimeApi.html` — not
 * `interfaces/MyAnimeListAnimeApi.html`.
 */
function malTypedocInterface(namespace: string): string {
    if (namespace === "manga") return "apis_rest_mal_facade.MyAnimeListMangaApi";
    if (namespace === "user") return "apis_rest_mal_facade.MyAnimeListUserApi";
    return "apis_rest_mal_facade.MyAnimeListAnimeApi";
}

/** The upstream MAL API reference URL for one operation. */
function malUpstreamReference(namespace: string, methodName: string): string {
    if (namespace === "user") {
        if (methodName === "animeList") {
            return "https://myanimelist.net/apiconfig/references/api/v2#tag/user-animelist/operation/users_user_id_animelist_get";
        }
        if (methodName === "mangaList") {
            return "https://myanimelist.net/apiconfig/references/api/v2#tag/user-mangalist/operation/users_user_id_mangalist_get";
        }
        return "https://myanimelist.net/apiconfig/references/api/v2#tag/users/operation/users_user_id_get";
    }
    if (namespace === "manga") {
        return methodName === "get"
            ? "https://myanimelist.net/apiconfig/references/api/v2#tag/manga/operation/manga_manga_id_get"
            : methodName === "updateMyListStatus"
              ? "https://myanimelist.net/apiconfig/references/api/v2#tag/user-mangalist/operation/manga_manga_id_my_list_status_put"
              : "https://myanimelist.net/apiconfig/references/api/v2#tag/user-mangalist/operation/manga_manga_id_my_list_status_delete";
    }
    return methodName === "get"
        ? "https://myanimelist.net/apiconfig/references/api/v2#tag/anime/operation/anime_anime_id_get"
        : methodName === "seasonal"
          ? "https://myanimelist.net/apiconfig/references/api/v2#tag/anime/operation/anime_season_year_season_get"
          : methodName === "ranking"
            ? "https://myanimelist.net/apiconfig/references/api/v2#tag/anime/operation/anime_ranking_get"
            : methodName === "suggestions"
              ? "https://myanimelist.net/apiconfig/references/api/v2#tag/anime/operation/anime_suggestions_get"
              : methodName === "updateMyListStatus"
                ? "https://myanimelist.net/apiconfig/references/api/v2#tag/user-animelist/operation/anime_anime_id_my_list_status_put"
                : "https://myanimelist.net/apiconfig/references/api/v2#tag/user-animelist/operation/anime_anime_id_my_list_status_delete";
}

/** The public signature string for one MAL operation. */
function malSignature(methodName: string, params: string, responseType: string): string {
    const cleaned = params.replace(/\s+/g, " ").trim();
    return `${methodName}(${cleaned}): Promise<${responseType}>`;
}

/** The code example for one MAL operation. */
function malExample(namespace: "anime" | "manga" | "user", methodName: string): string {
    const header = [
        'import { AniLink } from "anilink-api-wrapper";',
        "",
        'const aniLink = new AniLink({ mal: { accessToken: "mal-token" } });',
    ];
    if (methodName === "get") {
        const entity = namespace === "manga" ? "manga" : "anime";
        const id = namespace === "manga" ? 1 : 21;
        return [
            ...header,
            `const ${entity} = await aniLink.mal.${namespace}.get({ id: ${id} }, {`,
            '    fields: ["id", "title", "main_picture", "synopsis"],',
            "});",
            `console.log(${entity}.title);`,
        ].join("\n");
    }
    if (methodName === "me") {
        return [
            ...header,
            "const user = await aniLink.mal.user.me({",
            '    fields: ["id", "name", "location", "joined_at"],',
            "});",
            "console.log(user.name);",
        ].join("\n");
    }
    if (methodName === "animeList") {
        return [
            ...header,
            "const list = await aniLink.mal.user.animeList(",
            '    { username: "@me", status: "watching" },',
            '    { fields: ["id", "title", "list_status"] }',
            ");",
            "console.log(list.data[0]?.node.title);",
        ].join("\n");
    }
    if (methodName === "mangaList") {
        return [
            ...header,
            "const list = await aniLink.mal.user.mangaList(",
            '    { username: "@me", status: "reading" },',
            '    { fields: ["id", "title", "list_status"] }',
            ");",
            "console.log(list.data[0]?.node.title);",
        ].join("\n");
    }
    if (methodName === "seasonal") {
        return [
            ...header,
            "const season = await aniLink.mal.anime.seasonal(",
            '    { year: 2024, season: "winter" },',
            '    { fields: ["id", "title", "main_picture"] }',
            ");",
            "console.log(season.data[0]?.node.title);",
        ].join("\n");
    }
    if (methodName === "ranking") {
        return [
            ...header,
            "const top = await aniLink.mal.anime.ranking(",
            '    { rankingType: "airing" },',
            '    { fields: ["id", "title", "mean"] }',
            ");",
            "console.log(top.data[0]?.node.title, top.data[0]?.ranking.rank);",
        ].join("\n");
    }
    if (methodName === "suggestions") {
        return [
            ...header,
            "const suggestions = await aniLink.mal.anime.suggestions({",
            '    fields: ["id", "title", "main_picture"],',
            "});",
            "console.log(suggestions.data[0]?.node.title);",
        ].join("\n");
    }
    if (methodName === "updateMyListStatus") {
        if (namespace === "manga") {
            return [
                ...header,
                "const status = await aniLink.mal.manga.updateMyListStatus({",
                "    id: 1,",
                '    status: "reading",',
                "    num_chapters_read: 10,",
                "    score: 9,",
                "});",
                "console.log(status.num_chapters_read);",
            ].join("\n");
        }
        return [
            ...header,
            "const status = await aniLink.mal.anime.updateMyListStatus({",
            "    id: 21,",
            '    status: "watching",',
            "    num_watched_episodes: 10,",
            "    score: 9,",
            "});",
            "console.log(status.num_episodes_watched);",
        ].join("\n");
    }
    // deleteFromList
    const id = namespace === "manga" ? 1 : 21;
    return [...header, `await aniLink.mal.${namespace}.deleteFromList({ id: ${id} });`].join("\n");
}

/** Human-readable description for a MAL facade parameter. */
function malParamDescription(name: string): string {
    if (name === "params") {
        return "The operation's own inputs as one typed object; see its nested fields.";
    }
    if (name === "options") {
        return "Optional field selection and transport settings; merged over the instance defaults.";
    }
    return "";
}

/**
 * The nested fields of one MAL method's `params` object, keyed by method
 * name. Returns `undefined` for methods without a mapping so the caller can
 * fail loudly instead of documenting a wrong shape.
 */
function malParamsFields(
    namespace: "anime" | "manga" | "user",
    methodName: string
): ParamField[] | undefined {
    switch (methodName) {
        case "get":
        case "deleteFromList":
            return [malIdField(namespace)];
        case "updateMyListStatus":
            return [malIdField(namespace), ...malListStatusUpdateFields(namespace)];
        case "animeList":
            return [malUsernameField(), ...malListFilterFields("anime")];
        case "mangaList":
            return [malUsernameField(), ...malListFilterFields("manga")];
        case "seasonal":
            return [malYearField(), malSeasonField()];
        case "ranking":
            return [malRankingTypeField()];
        default:
            return undefined;
    }
}

/** The `id` field of the get/update/delete params objects. */
function malIdField(namespace: string): ParamField {
    return {
        name: "id",
        type: "number",
        required: true,
        description:
            namespace === "manga" ? "The MyAnimeList manga ID." : "The MyAnimeList anime ID.",
    };
}

/** The `username` field of the user-list params objects. */
function malUsernameField(): ParamField {
    return {
        name: "username",
        type: "string",
        required: true,
        description: "The MyAnimeList user name, or @me for the authenticated user.",
    };
}

/** The `year` field of the seasonal params object. */
function malYearField(): ParamField {
    return {
        name: "year",
        type: "number",
        required: true,
        description: "The season's year.",
    };
}

/** The `season` field of the seasonal params object. */
function malSeasonField(): ParamField {
    return {
        name: "season",
        type: "MalSeason",
        required: true,
        description: "The season's broadcast window (winter, spring, summer, or fall).",
    };
}

/** The `rankingType` field of the ranking params object. */
function malRankingTypeField(): ParamField {
    return {
        name: "rankingType",
        type: "MalRankingType",
        required: true,
        description:
            "The ranking list to fetch (all, airing, upcoming, tv, ova, movie, special, bypopularity, or favorite).",
    };
}

/** The status/sort/limit/offset filter fields of the user-list params objects. */
function malListFilterFields(listKind: "anime" | "manga"): ParamField[] {
    const isAnime = listKind === "anime";
    return [
        {
            name: "status",
            type: isAnime ? "MalAnimeListStatusValue" : "MalMangaListStatusValue",
            required: false,
            description: isAnime
                ? "The watch status to filter by (watching, completed, on_hold, dropped, plan_to_watch); omit to return all."
                : "The reading status to filter by (reading, completed, on_hold, dropped, plan_to_read); omit to return all.",
        },
        {
            name: "sort",
            type: isAnime ? "MalAnimeListSort" : "MalMangaListSort",
            required: false,
            description:
                "The sort order (list_score, list_updated_at, and the start-date sort are descending; the title and id sorts are ascending).",
        },
        {
            name: "limit",
            type: "number",
            required: false,
            description:
                "The number of entries per page; defaults to 100, capped at 1000 by MyAnimeList.",
        },
        {
            name: "offset",
            type: "number",
            required: false,
            description: "The offset of the first entry; defaults to 0.",
        },
    ];
}

/** The MAL options fields documented on MAL operations. */
function malOptionFields(): ParamField[] {
    return [
        {
            name: "fields",
            type: "string | readonly string[]",
            required: false,
            description:
                "Comma-separated MAL field selector, or the same selector as an array. Shapes the response.",
        },
        {
            name: "timeout",
            type: "number",
            required: false,
            description: "Milliseconds before the request is aborted. `0` disables.",
        },
        {
            name: "signal",
            type: "AbortSignal",
            required: false,
            description: "Signal used to cancel the in-flight request.",
        },
    ];
}

/** The `MalAnimeListStatusUpdate` / `MalMangaListStatusUpdate` fields documented on the update operation. */
function malListStatusUpdateFields(namespace: "anime" | "manga" | "user"): ParamField[] {
    if (namespace === "manga") {
        return [
            {
                name: "status",
                type: "MalMangaListStatusValue",
                required: false,
                description:
                    "The reading status to set (reading, completed, on_hold, dropped, plan_to_read).",
            },
            {
                name: "num_chapters_read",
                type: "number",
                required: false,
                description: "The number of chapters the user has read.",
            },
            {
                name: "num_volumes_read",
                type: "number",
                required: false,
                description: "The number of volumes the user has read.",
            },
            {
                name: "score",
                type: "number",
                required: false,
                description: "The user's score out of 10.",
            },
            {
                name: "start_date",
                type: "string",
                required: false,
                description:
                    "The date the user started reading; partial dates (YYYY-MM, YYYY) accepted.",
            },
            {
                name: "finish_date",
                type: "string",
                required: false,
                description:
                    "The date the user finished reading; partial dates (YYYY-MM, YYYY) accepted.",
            },
            {
                name: "comments",
                type: "string",
                required: false,
                description: "Free-form notes attached to the entry.",
            },
            {
                name: "is_rereading",
                type: "boolean",
                required: false,
                description: "Whether the user is currently rereading the manga.",
            },
            {
                name: "num_times_reread",
                type: "number",
                required: false,
                description: "The number of times the user has reread the manga.",
            },
            {
                name: "reread_value",
                type: "number",
                required: false,
                description: "The reread value rating (0-5).",
            },
            {
                name: "priority",
                type: "number",
                required: false,
                description: "The priority rating (0-2).",
            },
            {
                name: "tags",
                type: "readonly string[]",
                required: false,
                description: "User-defined tags; sent as a comma-separated string.",
            },
        ];
    }
    return [
        {
            name: "status",
            type: "MalAnimeListStatusValue",
            required: false,
            description:
                "The watch status to set (watching, completed, on_hold, dropped, plan_to_watch).",
        },
        {
            name: "num_watched_episodes",
            type: "number",
            required: false,
            description: "The number of episodes the user has watched.",
        },
        {
            name: "score",
            type: "number",
            required: false,
            description: "The user's score out of 10.",
        },
        {
            name: "start_date",
            type: "string",
            required: false,
            description:
                "The date the user started watching; partial dates (YYYY-MM, YYYY) accepted.",
        },
        {
            name: "finish_date",
            type: "string",
            required: false,
            description:
                "The date the user finished watching; partial dates (YYYY-MM, YYYY) accepted.",
        },
        {
            name: "comments",
            type: "string",
            required: false,
            description: "Free-form notes attached to the entry.",
        },
        {
            name: "is_rewatching",
            type: "boolean",
            required: false,
            description: "Whether the user is currently rewatching the anime.",
        },
        {
            name: "num_times_rewatched",
            type: "number",
            required: false,
            description: "The number of times the user has rewatched the anime.",
        },
        {
            name: "rewatch_value",
            type: "number",
            required: false,
            description: "The rewatch value rating (0-5).",
        },
        {
            name: "priority",
            type: "number",
            required: false,
            description: "The priority rating (0-2).",
        },
        {
            name: "tags",
            type: "readonly string[]",
            required: false,
            description: "User-defined tags; sent as a comma-separated string.",
        },
    ];
}

// ---------------------------------------------------------------------------
// AniList operation assembly
// ---------------------------------------------------------------------------

/** Build a ReferenceOperation for one AniList operation. */
function buildAniListOperation(op: RawOp): ReferenceOperation {
    const sourceRoot = join(SRC, "apis/graphql/anilist");
    const info = resolveAniListSourceInfo(op, sourceRoot);
    let request: ParamField[] = [];
    let jsdoc = "";
    let seeUrls: string[] = [];
    let purpose: string;

    if (info) {
        const varsFile = findInterfaceFile(info.sourceFile, op.variablesType);
        if (varsFile && op.variablesType) {
            request = toParamFields(parseInterfaceMembers(varsFile, op.variablesType));
        }
        jsdoc = findMethodJsdoc(info.sourceFile, info.methodName);
        seeUrls = jsdocSeeUrls(jsdoc);
    }

    // Prefer the public-facing facade JSDoc for the example and purpose:
    // it is the only place that shows the `await aniLink.anilist.…` call
    // shape users will actually type, and the description there uses the
    // identifiers a reader is likely to search for (e.g. `` `id` ``).
    const facade = resolveAniListFacade(op, sourceRoot);
    if (facade) {
        const facadeJsdoc = findFacadePropertyJsdoc(facade.facadeFile, facade.propName);
        if (facadeJsdoc) {
            const facadeExample = jsdocExample(facadeJsdoc);
            if (facadeExample) jsdoc = facadeJsdoc;
            const facadePurpose = jsdocMainText(facadeJsdoc);
            purpose = facadePurpose || op.description;
        } else {
            purpose = op.description;
        }
    } else {
        purpose = op.description;
    }

    const responseType = op.responseType;
    const response =
        responseType && responseType !== "any" ? extractResponseFields(responseType) : [];

    const errors: ThrowsEntry[] = [];
    if (op.category === "mutation") {
        errors.push({ error: "AniLinkAuthError", condition: "no AniList token is configured" });
    }
    errors.push(
        { error: "AniLinkApiError", condition: "non-success AniList HTTP response" },
        { error: "AniLinkGraphQLError", condition: "HTTP 200 response carrying GraphQL errors" },
        { error: "AniLinkNetworkError", condition: "timeout, cancellation, or transport failure" }
    );

    let typedocPage = "types/apis_graphql_anilist_facade_query-group.AniListQueries.html";
    if (op.category === "mutation")
        typedocPage = "types/apis_graphql_anilist_facade_mutation-group.AniListMutations.html";
    else if (op.category === "custom")
        typedocPage = "types/apis_graphql_anilist_facade_custom-group.AniListCustom.html";

    const links: OpLink[] = [{ label: "TypeDoc", url: TYPEDOC_BASE + typedocPage }];
    for (const url of seeUrls.slice(0, 2)) {
        links.push({ label: "AniList API reference", url });
    }

    return {
        provider: "anilist",
        protocol: "graphql",
        domain: anilistDomain(op),
        namespace: anilistNamespace(op),
        name: op.name,
        category: op.category,
        signature: anilistSignature(op),
        purpose,
        auth: anilistAuth(op),
        request,
        responseType,
        response,
        errors,
        example: jsdocExample(jsdoc),
        links,
    };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Generate the full operation-reference manifest across both providers.
 *
 * @returns The in-memory manifest for the docs site.
 */
export function generateReferenceManifest(): ReferenceManifest {
    const anilistRoot = join(SRC, ANILIST_PROVIDER_CONFIG.sourceRoot);
    const rawOps = discoverAniListOperations(anilistRoot);
    const operations: ReferenceOperation[] = rawOps.map(buildAniListOperation);
    operations.push(...discoverMalOperations());
    return {
        generatedAt: new Date().toISOString(),
        operations,
    };
}

/**
 * Write the generated manifest to `outPath` as minified JSON, plus one
 * provider/category shard per section.
 *
 * Delegates to {@link renderManifestFiles} so the file set the generator
 * produces is defined exactly once — the same definition `--check` and the
 * tests compare against.
 *
 * @param outPath - Destination path; parent directories are created.
 * @returns The manifest written to the complete file and section shards.
 */
export function writeReferenceManifest(outPath: string): ReferenceManifest {
    const { manifest, files } = renderManifestFiles(dirname(outPath));
    for (const [path, content] of files) {
        mkdirSync(dirname(path), { recursive: true });
        writeFileSync(path, content, "utf8");
    }
    return manifest;
}

/**
 * Group a complete manifest into provider/category section manifests.
 *
 * @param manifest Complete operation-reference manifest.
 * @returns Section manifests sorted by provider and category path.
 */
export function buildReferenceSections(manifest: ReferenceManifest): ReferenceSectionManifest[] {
    const sections = new Map<string, ReferenceSectionManifest>();
    for (const operation of manifest.operations) {
        const key = `${operation.provider}/${operation.category}`;
        const section = sections.get(key) ?? {
            generatedAt: manifest.generatedAt,
            provider: operation.provider,
            category: operation.category,
            operations: [],
        };
        section.operations.push(operation);
        sections.set(key, section);
    }
    return [...sections.values()].sort((left, right) =>
        `${left.provider}/${left.category}`.localeCompare(`${right.provider}/${right.category}`)
    );
}

/**
 * Remove the generation timestamp from a manifest JSON string.
 *
 * `generatedAt` changes on every render, so `--check` must compare only the
 * semantic content or it could never pass against committed manifests. An
 * unreadable or corrupt manifest compares as stale — the rerun the check
 * exists to request is also the fix for a damaged file.
 *
 * @param json Minified manifest JSON (complete or section).
 * @returns The same manifest re-serialized without `generatedAt`, or `null` when `json` does not parse.
 */
function stripGeneratedAt(json: string): string | null {
    try {
        const parsed = JSON.parse(json) as { generatedAt?: string };
        delete parsed.generatedAt;
        return JSON.stringify(parsed);
    } catch {
        return null;
    }
}

/**
 * Render every manifest file the generator produces to in-memory strings.
 *
 * @param outDir Directory that receives the complete manifest and section shards.
 * @returns The complete manifest plus each output path mapped to the minified JSON content for that file.
 */
function renderManifestFiles(outDir: string): {
    manifest: ReferenceManifest;
    files: Map<string, string>;
} {
    const manifest = generateReferenceManifest();
    const files = new Map<string, string>();
    files.set(join(outDir, "operations.json"), JSON.stringify(manifest));
    for (const section of buildReferenceSections(manifest)) {
        files.set(
            join(outDir, section.provider, `${section.category}.json`),
            JSON.stringify(section)
        );
    }
    return { manifest, files };
}

/**
 * Write the manifests, or with `--check` verify the committed ones are current.
 *
 * In normal mode this writes the complete manifest and its section shards. With
 * `--check`, it only compares rendered content against the committed files and
 * reports stale outputs for CI.
 *
 * @returns Process-style status code: `0` when written or current, `1` when stale in check mode.
 */
function main(): number {
    const check = process.argv.includes("--check");
    const outDir = resolve(import.meta.dirname, "..", "lib", "operation-reference");
    const outPath = join(outDir, "operations.json");
    const { manifest, files: rendered } = renderManifestFiles(outDir);

    const stale: string[] = [];
    for (const [path, content] of rendered) {
        let current: string | undefined;
        try {
            current = readFileSync(path, "utf8").replace(/\r\n/g, "\n");
        } catch {
            current = undefined;
        }
        const expected = stripGeneratedAt(content);
        const matches =
            current !== undefined && expected !== null && stripGeneratedAt(current) === expected;
        if (!matches) stale.push(relative(ROOT, path));
    }

    if (check) {
        if (stale.length === 0) {
            console.log(
                `Operation reference manifests up to date (${rendered.size} files checked).`
            );
            return 0;
        }
        console.error(`Operation reference manifests are stale. Rerun 'npm run docs:operations':`);
        for (const path of stale) console.error(`  ${path}`);
        return 1;
    }

    mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, rendered.get(outPath)!, "utf8");
    for (const [path, content] of rendered) {
        if (path !== outPath) {
            mkdirSync(dirname(path), { recursive: true });
            writeFileSync(path, content, "utf8");
        }
    }

    const byProvider = manifest.operations.reduce<Record<string, number>>((acc, op) => {
        acc[op.provider] = (acc[op.provider] ?? 0) + 1;
        return acc;
    }, {});
    console.log(`Wrote ${manifest.operations.length} operations to ${outPath}`);
    console.log(`  anilist: ${byProvider.anilist ?? 0}, mal: ${byProvider.mal ?? 0}`);
    return 0;
}

// CLI entry: `npx tsx scripts/generate-operation-reference.ts`
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
    process.exitCode = main();
}
