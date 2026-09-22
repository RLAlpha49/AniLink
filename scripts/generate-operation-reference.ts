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
    /**
     * Category within the provider surface: the AniList facade group
     * (query, page, mutation, custom) or the MAL facade namespace (anime,
     * manga, user, forum). Each category becomes one catalog page and one
     * manifest shard, exactly like the AniList category pages.
     */
    category: "query" | "mutation" | "page" | "custom" | "anime" | "manga" | "user" | "forum";
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

/**
 * Read a file as UTF-8 text with CRLF normalized to LF, returning "" if missing.
 *
 * Windows checkouts smudge LF blobs to CRLF (`core.autocrlf`), while the JSDoc
 * parsers below anchor on `\n`; unnormalized text would drop every `@example`
 * and `@throws` from the facade JSDoc and fail generation. Every source read
 * in this script goes through here, so one normalization covers them all, the
 * same treatment the `--check` comparison applies below.
 */
function readFileText(p: string): string {
    try {
        return readFileSync(p, "utf8").replace(/\r\n/g, "\n");
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

/**
 * Extract the `@throws` entries from a JSDoc block.
 *
 * MAL facade JSDoc documents every thrown error class with its condition
 * (`@throws `AniLinkRestError` for a non-success MyAnimeList response.`), so
 * the reference reads the error table straight from the facade instead of
 * re-deriving it per operation like the AniList flow does.
 *
 * @param jsdoc JSDoc block text.
 * @returns One ThrowsEntry per `@throws` tag, in documented order.
 */
function jsdocThrows(jsdoc: string): ThrowsEntry[] {
    const inner = jsdocInner(jsdoc);
    const out: ThrowsEntry[] = [];
    const re = /@throws\s+`?(\w+)`?\s+(.+?)(?=\n\s*@|\n\s*$)/g;
    let m = re.exec(inner);
    while (m !== null) {
        out.push({ error: m[1], condition: cleanDescription(m[2]).replace(/\.$/, "") });
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

/**
 * Parse an interface body into raw members, flattening one level of
 * `extends` so inherited members are documented with the interface's own.
 *
 * The MAL params interfaces extend a shared payload type
 * (`MalAnimeListStatusUpdateParams extends MalAnimeListStatusUpdate` adds
 * only the `id`), so the reference must read the inherited members too —
 * the same way the AniList flow reads every member of a variables
 * interface. AniList interfaces never extend, so this changes nothing for
 * them.
 */
function parseInterfaceMembers(filePath: string, interfaceName: string): RawMember[] {
    const content = readFileText(filePath);
    const re = new RegExp(String.raw`export interface ${interfaceName}\b[^{]*\{`);
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
    // Flatten one level of `extends`: the inherited members follow the
    // interface's own, in declaration order, and are skipped when the base
    // cannot be found (the reference then documents the own members only).
    const extendsMatch = /extends\s+([\w.]+)/.exec(m[0]);
    if (extendsMatch) {
        const baseName = extendsMatch[1];
        const baseFile = findInterfaceFile(filePath, baseName) ?? findResponseTypeFile(baseName);
        if (baseFile) {
            const own = new Set(members.map((mem) => mem.name));
            for (const inherited of parseInterfaceMembers(baseFile, baseName)) {
                if (!own.has(inherited.name)) members.push(inherited);
            }
        }
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
    const hintRe = new RegExp(String.raw`export interface ${interfaceName}\b[^{]*\{`);
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
    return new RegExp(String.raw`export interface ${interfaceName}\b[^{]*\{`).test(content);
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
            if (new RegExp(String.raw`export interface ${typeName}\b[^{]*\{`).test(content)) {
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
 * Read the `custom` facade module's non-registry operations.
 *
 * Only the `custom` category is discovered from facade text: neither
 * `custom` nor `customPage` is a registry operation, so the shared signature
 * metadata does not cover them. Every registered operation arrives via
 * {@link collectOperationSignatures}.
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
        if (/^\s*customPage\s*:/.test(lines[i])) {
            assertCustomPageSignatureMatchesSource(
                join(dirname(filePath), "..", "CustomRequest.ts")
            );
            ops.push({
                category: "custom",
                name: "customPage",
                variablesType: "",
                responseType: "any",
                description: jsdocMainText(findJsdocAbove(lines, i)),
            });
        }
    }
    return ops;
}

/**
 * Parameter names, in order, of the real `CustomRequest.customPage` method.
 *
 * `anilistSignature` hardcodes the normalized manifest signature (generics
 * and defaults are rewritten for the docs surface), so this list pins the
 * part that must stay identical to the source.
 */
const CUSTOM_PAGE_SOURCE_PARAMS = ["query", "itemsKey", "variables", "options"];

/**
 * Assert the hardcoded `customPage` signature still matches the real
 * `CustomRequest.customPage` method.
 *
 * Without this, the generator and its committed manifests could agree with
 * each other while both drift from the actual public method — a renamed or
 * reordered parameter would silently ship stale docs, the exact failure
 * mode `collectOperationSignatures` exists to prevent. Parsing the method
 * here turns that drift into a loud generation failure.
 *
 * @param sourcePath - Path to `CustomRequest.ts`.
 * @throws {Error} When the method is missing or its parameter names no longer match the hardcoded signature.
 */
function assertCustomPageSignatureMatchesSource(sourcePath: string): void {
    const source = readFileText(sourcePath);
    const match = /async\s+customPage\s*<[^>]*>\s*\(([^)]*)\)/.exec(source);
    if (match === null) {
        throw new Error(
            "customPage signature drift: no `async customPage<…>(…)` method found in CustomRequest.ts — update anilistSignature() in this script to match the source."
        );
    }
    // Split the parameter list on top-level commas only: types like
    // `Record<string, unknown>` carry commas inside their brackets.
    const params: string[] = [];
    let depth = 0;
    let current = "";
    for (const char of match[1]) {
        if ("<({[".includes(char)) depth += 1;
        if (">)}]".includes(char)) depth -= 1;
        if (char === "," && depth === 0) {
            params.push(current);
            current = "";
            continue;
        }
        current += char;
    }
    if (current.trim() !== "") params.push(current);
    const names = params.map((param) => param.split("=")[0].split(":")[0].replace("?", "").trim());
    if (names.join(",") !== CUSTOM_PAGE_SOURCE_PARAMS.join(",")) {
        throw new Error(
            `customPage signature drift: CustomRequest.customPage parameters (${names.join(", ")}) no longer match the hardcoded manifest signature (${CUSTOM_PAGE_SOURCE_PARAMS.join(", ")}) — update anilistSignature() and CUSTOM_PAGE_SOURCE_PARAMS in this script.`
        );
    }
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
        return {
            facadeFile: join(sourceRoot, "facade", "custom-group.ts"),
            propName: op.name,
        };
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
    if (op.category === "custom") return `anilist.${op.name}`;
    if (op.category === "page") return `anilist.query.page.${op.name}`;
    if (op.category === "query") return `anilist.query.${op.name}`;
    return `anilist.mutation.${op.name}`;
}

/** Build the signature line for an AniList operation. */
function anilistSignature(op: RawOp): string {
    if (op.category === "custom" && op.name === "custom") {
        return "custom<T>(query: string, variables?: Record<string, unknown>, options?: RequestOptions): Promise<T>";
    }
    if (op.category === "custom" && op.name === "customPage") {
        return "customPage<TPage, K>(query: string, itemsKey: K, variables?: Record<string, unknown>, options?: CustomPageOptions): Promise<PaginateResult<ArrayElement<TPage, K>>>";
    }
    const vars = op.variablesType ? `variables: ${op.variablesType}` : "";
    const args = vars ? `${vars}, options?: RequestOptions` : "options?: RequestOptions";
    return `${op.name}(${args}): Promise<${op.responseType}>`;
}

/** Build the auth requirement text for an AniList operation. */
function anilistAuth(op: RawOp): string {
    if (op.category === "mutation") {
        return "Required: AniList access token (constructor `authToken` or `anilist.authToken` credential slot).";
    }
    return "Not required for public data. Pass a token for viewer-scoped fields.";
}

// ---------------------------------------------------------------------------
// MAL REST operation discovery
// ---------------------------------------------------------------------------

/**
 * The MAL facade interface that owns each namespace.
 *
 * The facade is the single source of truth for the catalog, exactly like the
 * generated AniList facade groups: every public MAL operation is one
 * `MyAnimeList*Api` property, and the reference reads its signature, JSDoc
 * prose, `@example`, `@see` link, and `@throws` table straight from that
 * property — no per-operation tables live here.
 */
const MAL_FACADE_INTERFACES: Record<
    string,
    { namespace: "anime" | "manga" | "user" | "forum"; domain: string }
> = {
    MyAnimeListAnimeApi: { namespace: "anime", domain: "Anime" },
    MyAnimeListMangaApi: { namespace: "manga", domain: "Manga" },
    MyAnimeListUserApi: { namespace: "user", domain: "User" },
    MyAnimeListForumApi: { namespace: "forum", domain: "Forum" },
};

/**
 * Discover MAL REST operations from the facade source.
 *
 * Every `MyAnimeList*Api` property signature is one operation; the JSDoc
 * above it carries the purpose, example, upstream link, and error table, and
 * the `params`/`options` types are resolved to their interfaces for the
 * nested request fields — the same source-driven flow the AniList half of
 * this generator uses.
 */
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

/**
 * Build one MAL ReferenceOperation from its facade signature and JSDoc.
 *
 * Every documented fact is read from source, mirroring the AniList flow:
 * the facade JSDoc supplies the purpose, example, upstream link, error
 * table, and parameter descriptions; the `params` and `options` types are
 * resolved to their interfaces for the nested request fields. A facade
 * method without JSDoc fails the build loudly instead of being published
 * with empty prose.
 */
function buildMalOperation(
    namespace: "anime" | "manga" | "user" | "forum",
    domain: string,
    methodName: string,
    params: string,
    responseType: string,
    jsdoc: string
): ReferenceOperation {
    const purpose = jsdocMainText(jsdoc);
    const example = jsdocExample(jsdoc);
    const seeUrls = jsdocSeeUrls(jsdoc);
    const errors = jsdocThrows(jsdoc);
    if (purpose === "" || example === "" || seeUrls.length === 0 || errors.length === 0) {
        throw new Error(
            `mal.${namespace}.${methodName} facade JSDoc must carry main text, @example, @see, and @throws; the reference is generated from them.`
        );
    }

    // The request parameters come from the signature; each one's description
    // is its `@param` tag, and the params object resolves to its interface
    // for the nested fields — the REST analogue of the AniList variables
    // interface read. A parameter without a `@param` tag fails the build
    // loudly instead of being published with an empty description.
    const request: ParamField[] = [];
    const paramRe = /(\w+)(\?)?:\s*([^,)]+)/g;
    let pm = paramRe.exec(params);
    while (pm !== null) {
        const pname = pm[1];
        const description = jsdocParamDescription(jsdoc, pname);
        if (description === "") {
            throw new Error(
                `mal.${namespace}.${methodName} facade JSDoc must document its ${pname} parameter with @param.`
            );
        }
        request.push({
            name: pname,
            type: pm[3].trim(),
            required: !pm[2],
            description,
        });
        pm = paramRe.exec(params);
    }
    const paramsParam = request.find((r) => r.name === "params");
    if (paramsParam) {
        const paramsFile = findResponseTypeFile(paramsParam.type);
        const paramsFields = paramsFile
            ? toParamFields(parseInterfaceMembers(paramsFile, paramsParam.type))
            : [];
        if (paramsFields.length === 0) {
            throw new Error(
                `Could not parse ${paramsParam.type} for mal.${namespace}.${methodName}; the params interface must exist under src/apis/rest/mal.`
            );
        }
        paramsParam.nestedFields = paramsFields;
    }
    const optionsParam = request.find((r) => r.name === "options");
    if (optionsParam) {
        optionsParam.nestedFields = malOptionFields(optionsParam.description);
    }

    const signature = `${methodName}(${params.replace(/\s+/g, " ").trim()}): Promise<${responseType}>`;

    return {
        provider: "mal",
        protocol: "rest",
        domain,
        namespace: `mal.${namespace}.${methodName}`,
        name: `${namespace}.${methodName}`,
        // The facade namespace is the MAL category — the analogue of the
        // AniList facade groups — so each namespace gets its own catalog
        // page and manifest shard, like the AniList category pages.
        category: namespace,
        signature,
        purpose,
        auth: malAuth(namespace, methodName, errors),
        request,
        responseType,
        response: extractResponseFields(responseType),
        errors,
        example,
        links: [
            {
                label: "TypeDoc",
                url: `${TYPEDOC_BASE}interfaces/${malTypedocInterface(namespace)}.html`,
            },
            { label: "MAL API reference", url: seeUrls[0] },
        ],
    };
}

/**
 * The TypeDoc interface page name for a MAL namespace.
 *
 * TypeDoc qualifies interface pages with their defining module, so the page
 * for `MyAnimeListAnimeApi` lives at
 * `interfaces/apis_rest_mal_facade.MyAnimeListAnimeApi.html` — not
 * `interfaces/MyAnimeListAnimeApi.html`.
 */
function malTypedocInterface(namespace: string): string {
    if (namespace === "manga") return "apis_rest_mal_facade.MyAnimeListMangaApi";
    if (namespace === "user") return "apis_rest_mal_facade.MyAnimeListUserApi";
    if (namespace === "forum") return "apis_rest_mal_facade.MyAnimeListForumApi";
    return "apis_rest_mal_facade.MyAnimeListAnimeApi";
}

/**
 * Extract the `@param <name>` description from a JSDoc block.
 *
 * @param jsdoc JSDoc block text.
 * @param name The parameter name whose description to read.
 * @returns The cleaned description, or an empty string when the parameter
 *   is not documented.
 */
function jsdocParamDescription(jsdoc: string, name: string): string {
    const inner = jsdocInner(jsdoc);
    const re = new RegExp(String.raw`@param\s+${name}\s+-\s+(.+?)(?=\n\s*@|\n\s*$)`, "g");
    const m = re.exec(inner);
    return m ? cleanDescription(m[1]) : "";
}

/**
 * Derive the auth-requirement text for a MAL operation from its error table.
 *
 * The facade `@throws` entries state the token contract: an
 * `AniLinkAuthError` for a missing token marks the whole operation as
 * authenticated, one conditioned on `@me` marks the `@me` path as
 * authenticated, and no auth error at all marks a public read — the REST
 * analogue of the AniList category-based auth rule.
 *
 * @param namespace The facade namespace the operation belongs to.
 * @param methodName The facade method name.
 * @param errors The `@throws` entries read from the facade JSDoc.
 * @returns The auth-requirement text for the reference card.
 */
function malAuth(
    namespace: "anime" | "manga" | "user" | "forum",
    methodName: string,
    errors: ThrowsEntry[]
): string {
    const authError = errors.find((entry) => entry.error === "AniLinkAuthError");
    if (authError === undefined) {
        // The anime/manga lookups expose list-related fields that need a token.
        if (methodName === "get" && (namespace === "anime" || namespace === "manga")) {
            return `Not required for public ${namespace} data; pass an access token for list-related fields.`;
        }
        return "Not required: a public read.";
    }
    if (/no MAL access token is configured/.test(authError.condition)) {
        return "Required: MAL OAuth2 access token (`mal.accessToken` credential slot).";
    }
    // The remaining auth errors fire on `@me` without a token: the profile
    // read documents only `@me`, while the list reads serve public lists.
    if (namespace === "user" && methodName === "get") {
        return "Requires an access token: MyAnimeList documents only `@me` for this endpoint; other usernames are passed through but currently answered with `404`.";
    }
    return "Not required for public user lists; `@me` and private lists require an access token, because a client ID alone cannot resolve `@me`.";
}

/**
 * The nested fields documented for a MAL operation's `options` object.
 *
 * `fields` is read from the `MalRequestOptions` interface and the transport
 * pair from the shared `RequestOptions` base, so the documented shape
 * tracks the source types. Operations whose facade `@param options` text
 * names only transport settings — the forum reads and the list-status
 * deletes, whose endpoints take no `fields` query parameter — drop
 * `fields`.
 *
 * @param optionsDescription The `@param options` text from the facade JSDoc.
 * @returns The nested option fields for the reference card.
 */
function malOptionFields(optionsDescription: string): ParamField[] {
    const fields = toParamFields(
        parseInterfaceMembers(join(SRC, "apis/rest/mal/types/common.ts"), "MalRequestOptions")
    );
    const transport = toParamFields(
        parseInterfaceMembers(join(SRC, "base/transportTypes.ts"), "RequestOptions")
    ).filter((field) => field.name === "timeout" || field.name === "signal");
    return /field selection/.test(optionsDescription) ? [...fields, ...transport] : transport;
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
 * Whether the manifest already on disk matches the freshly rendered one,
 * ignoring `generatedAt` — the single comparison `--check` and the
 * write-skip share so a timestamp-only regeneration never counts as a
 * change in either direction.
 *
 * @param path Manifest file to compare.
 * @param content Minified JSON the generator just rendered for that path.
 * @returns `true` when the file exists and matches modulo `generatedAt`.
 */
function manifestFileMatches(path: string, content: string): boolean {
    let current: string;
    try {
        current = readFileSync(path, "utf8").replace(/\r\n/g, "\n");
    } catch {
        return false;
    }
    const expected = stripGeneratedAt(content);
    return expected !== null && stripGeneratedAt(current) === expected;
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
        if (!manifestFileMatches(path, content)) stale.push(relative(ROOT, path));
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

    // Skip timestamp-only rewrites: `generatedAt` changes on every run, and
    // rewriting otherwise-identical manifests buries the real changes under
    // one-line churn across every shard.
    let written = 0;
    for (const [path, content] of rendered) {
        if (manifestFileMatches(path, content)) continue;
        mkdirSync(dirname(path), { recursive: true });
        writeFileSync(path, content, "utf8");
        written += 1;
    }

    const byProvider = manifest.operations.reduce<Record<string, number>>((acc, op) => {
        acc[op.provider] = (acc[op.provider] ?? 0) + 1;
        return acc;
    }, {});
    console.log(
        `Wrote ${manifest.operations.length} operations to ${outPath} (${written}/${rendered.size} files rewritten, timestamp-only files skipped)`
    );
    console.log(`  anilist: ${byProvider.anilist ?? 0}, mal: ${byProvider.mal ?? 0}`);
    return 0;
}

// CLI entry: `npx tsx scripts/generate-operation-reference.ts`
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
    process.exitCode = main();
}
