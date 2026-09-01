/**
 * Build-time generator for the AniLink operation reference.
 *
 * Run: `npx tsx scripts/generate-operation-reference.ts`
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, statSync } from "node:fs";
import { dirname, resolve, join } from "node:path";
import { pathToFileURL } from "node:url";
import { ANILIST_PROVIDER_CONFIG } from "./provider-config";

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
const TYPEDOC_BASE = "https://rlalpha49.github.io/AniLink/typedoc/";

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

/** Parse the type-declaration blocks of the `facade/` group modules into raw operations. */
function discoverAniListOperations(sourceRoot: string): RawOp[] {
    const ops: RawOp[] = [];
    for (const fileName of [
        "custom-group.ts",
        "query-group.ts",
        "mutation-group.ts",
        "helpers-group.ts",
    ]) {
        ops.push(...discoverOperationsInFile(join(sourceRoot, "facade", fileName)));
    }
    return ops;
}

/** Parse one facade group module into raw operations. */
function discoverOperationsInFile(filePath: string): RawOp[] {
    const content = readFileText(filePath);
    const lines = content.split("\n");
    const ops: RawOp[] = [];

    let section: "query" | "mutation" | "page" | "custom" | null = null;
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        section = advanceSection(line, section);

        if (/^\s*custom:\s*</.test(line)) {
            ops.push({
                category: "custom",
                name: "custom",
                variablesType: "",
                responseType: "any",
                description: jsdocMainText(findJsdocAbove(lines, i)),
            });
            continue;
        }

        const sig = tryParseSignature(lines, i);
        if (sig && section) {
            ops.push({
                category: section,
                name: sig.name,
                variablesType: sig.variablesType,
                responseType: sig.responseType,
                description: jsdocMainText(findJsdocAbove(lines, i)),
            });
        }
    }
    return ops;
}

/** Advance the facade-section state machine for one line. */
function advanceSection(
    line: string,
    current: "query" | "mutation" | "page" | "custom" | null
): "query" | "mutation" | "page" | "custom" | null {
    if (/^\s+query:\s*\{/.test(line)) return "query";
    if (/^\s+page:\s*\{/.test(line)) return "page";
    if (/^\s+mutation:\s*\{/.test(line)) return "mutation";
    if (/^\s{8}\},?\s*$/.test(line) && current === "page") return "query";
    if (/^\s{4}\},?\s*$/.test(line) && (current === "query" || current === "mutation")) {
        return null;
    }
    return current;
}

/** Try to parse an operation signature starting at `lines[start]`. */
function tryParseSignature(
    lines: string[],
    start: number
): { name: string; variablesType: string; responseType: string } | null {
    const single =
        /^\s+([a-zA-Z]+):\s*\(variables:\s*([A-Za-z]+)(?:,\s*options\?:\s*[A-Za-z]+)?\)\s*=>\s*Promise<([A-Za-z]+)>;\s*$/.exec(
            lines[start]
        );
    if (single) {
        return { name: single[1], variablesType: single[2], responseType: single[3] };
    }
    const opener = /^\s+([a-zA-Z]+):\s*\(\s*$/.exec(lines[start]);
    if (!opener) return null;
    const name = opener[1];
    let combined = lines[start];
    for (let k = start + 1; k < Math.min(start + 6, lines.length); k++) {
        combined += " " + lines[k].trim();
        if (lines[k].includes("=>") && lines[k].includes(";")) break;
    }
    const m =
        /\(\s*variables:\s*([A-Za-z]+)(?:,\s*options\?:\s*[A-Za-z]+)?\s*\)\s*=>\s*Promise<([A-Za-z]+)>;/.exec(
            combined
        );
    if (!m) return null;
    return { name, variablesType: m[1], responseType: m[2] };
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
    const escapedName = op.name.replace(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);
    const re = new RegExp(
        String.raw`op(?:As)?\(\s*"${escapedName}"\s*,\s*(\w+)\s*(?:,\s*"([\w]+)")?\s*\)`,
        "g"
    );
    const candidates: Array<{ methodName: string; className: string }> = [];
    let m = re.exec(content);
    while (m !== null) {
        candidates.push({ className: m[1], methodName: m[2] ?? op.name });
        m = re.exec(content);
    }
    return candidates;
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

/** Discover MAL REST operations from the facade source. */
function discoverMalOperations(): ReferenceOperation[] {
    const facadePath = join(SRC, "apis/rest/mal/facade.ts");
    const content = readFileText(facadePath);
    const lines = content.split("\n");
    const ops: ReferenceOperation[] = [];

    for (let i = 0; i < lines.length; i++) {
        const sig = /^\s{4}(get|me):\s*\(([^)]*)\)\s*=>\s*Promise<(\w+)>;/.exec(lines[i]);
        if (!sig) continue;
        ops.push(buildMalOperation(sig[1], sig[2], sig[3], findJsdocAbove(lines, i)));
    }
    return ops;
}

/** Build one MAL ReferenceOperation from its facade signature. */
function buildMalOperation(
    methodName: string,
    params: string,
    responseType: string,
    jsdoc: string
): ReferenceOperation {
    const isAnime = methodName === "get";
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
        optionsParam.nestedFields = malOptionFields();
    }

    const errors: ThrowsEntry[] = isAnime
        ? [
              { error: "AniLinkApiError", condition: "non-success MyAnimeList response" },
              {
                  error: "AniLinkNetworkError",
                  condition: "timeout, cancellation, or other transport failure",
              },
          ]
        : [
              { error: "AniLinkAuthError", condition: "no MAL access token is configured" },
              { error: "AniLinkApiError", condition: "non-success MyAnimeList response" },
              {
                  error: "AniLinkNetworkError",
                  condition: "timeout, cancellation, or other transport failure",
              },
          ];

    const example = isAnime
        ? [
              'import { AniLink } from "anilink-api-wrapper";',
              "",
              'const aniLink = new AniLink({ mal: { accessToken: "mal-token" } });',
              "const anime = await aniLink.mal.anime.get(21, {",
              '    fields: ["id", "title", "main_picture", "synopsis"],',
              "});",
              "console.log(anime.title);",
          ].join("\n")
        : [
              'import { AniLink } from "anilink-api-wrapper";',
              "",
              'const aniLink = new AniLink({ mal: { accessToken: "mal-token" } });',
              "const user = await aniLink.mal.user.me({",
              '    fields: ["id", "name", "location", "joined_at"],',
              "});",
              "console.log(user.name);",
          ].join("\n");

    const upstream = isAnime
        ? "https://myanimelist.net/apiconfig/references/api/v2#tag/anime/operation/anime_anime_id_get"
        : "https://myanimelist.net/apiconfig/references/api/v2#tag/users/operation/users_user_id_get";

    return {
        provider: "mal",
        protocol: "rest",
        domain: isAnime ? "Anime" : "User",
        namespace: isAnime ? "mal.anime.get" : "mal.user.me",
        name: isAnime ? "anime.get" : "user.me",
        category: "rest",
        signature: isAnime
            ? "get(id: number, options?: MalRequestOptions): Promise<MalAnime>"
            : "me(options?: MalRequestOptions): Promise<MalUser>",
        purpose:
            jsdocMainText(jsdoc) ||
            (isAnime
                ? "Gets one anime by its MyAnimeList ID."
                : "Gets the currently authenticated MyAnimeList user."),
        auth: isAnime
            ? "Not required for public anime data; pass an access token for list-related fields."
            : "Required — MAL OAuth2 access token (`mal.accessToken` credential slot).",
        request,
        responseType,
        response: extractResponseFields(responseType),
        errors,
        example,
        links: [
            {
                label: "TypeDoc",
                url: `${TYPEDOC_BASE}interfaces/${
                    isAnime ? "MyAnimeListAnimeApi" : "MyAnimeListUserApi"
                }.html`,
            },
            { label: "MAL API reference", url: upstream },
        ],
    };
}

/** Human-readable description for a MAL facade parameter. */
function malParamDescription(name: string): string {
    if (name === "id") return "The MyAnimeList anime ID.";
    if (name === "options") {
        return "Optional field selection and transport settings; merged over the instance defaults.";
    }
    return "";
}

/** The MAL options fields documented on every MAL operation. */
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
 * Write the generated manifest to `outPath` as minified JSON.
 *
 * @param outPath - Destination path; parent directories are created.
 * @returns The manifest written to the complete file and section shards.
 */
export function writeReferenceManifest(outPath: string): ReferenceManifest {
    const manifest = generateReferenceManifest();
    mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, JSON.stringify(manifest), "utf8");
    writeReferenceSections(manifest, dirname(outPath));
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
 * Write one provider/category JSON shard for every section in a manifest.
 *
 * @param manifest Complete operation-reference manifest.
 * @param outDir Directory containing the complete manifest.
 */
export function writeReferenceSections(manifest: ReferenceManifest, outDir: string): void {
    for (const section of buildReferenceSections(manifest)) {
        const sectionDir = join(outDir, section.provider);
        mkdirSync(sectionDir, { recursive: true });
        writeFileSync(
            join(sectionDir, `${section.category}.json`),
            JSON.stringify(section),
            "utf8"
        );
    }
}

// CLI entry: `npx tsx scripts/generate-operation-reference.ts`
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
    const outDir = resolve(import.meta.dirname, "..", "lib", "operation-reference");
    const outPath = join(outDir, "operations.json");
    const manifest = writeReferenceManifest(outPath);
    const byProvider = manifest.operations.reduce<Record<string, number>>((acc, op) => {
        acc[op.provider] = (acc[op.provider] ?? 0) + 1;
        return acc;
    }, {});
    console.log(`Wrote ${manifest.operations.length} operations to ${outPath}`);
    console.log(`  anilist: ${byProvider.anilist ?? 0}, mal: ${byProvider.mal ?? 0}`);
}
