/**
 * Build-time manifest generator for the AniLink API Explorer.
 *
 * Parses `src/AniLink.ts` and `src/apis/anilist/query|mutation/*.ts` to emit a
 * single `operations.json` manifest consumed by the static explorer UI under
 * `docs/explorer/`. Pure file parsing — no network, no side effects beyond
 * writing the JSON when run as a CLI.
 *
 * Run: `npx tsx scripts/generate-explorer-manifest.ts`
 */
import {
    readFileSync,
    writeFileSync,
    mkdirSync,
    existsSync,
    readdirSync,
    statSync,
    copyFileSync,
} from "node:fs";
import { dirname, resolve, join } from "node:path";
import { pathToFileURL } from "node:url";

/** A single variable field on an operation's `*Variables` interface. */
export interface Field {
    name: string;
    type:
        | "number"
        | "string"
        | "boolean"
        | "enum"
        | "enum[]"
        | "number[]"
        | "string[]"
        | "object"
        | "object[]";
    required: boolean;
    description: string;
    enumValues?: string[];
    nestedFields?: Field[];
}

/** A single AniLink operation surfaced in the explorer. */
export interface Operation {
    category: "query" | "mutation" | "page" | "custom";
    name: string;
    description: string;
    variablesType: string;
    responseType: string;
    requiresAuth: boolean;
    fields: Field[];
    graphql: string;
    anilinkCall: string;
}

/** The full manifest written to `operations.json`. */
export interface Manifest {
    generatedAt: string;
    anilistEndpoint: string;
    operations: Operation[];
}

const ROOT = resolve(import.meta.dirname, "..");
const SRC = join(ROOT, "src");
const ANILIST = join(SRC, "apis", "anilist");
const ANILIST_ENDPOINT = "https://graphql.anilist.co";

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
        .replace(/^`[^`]+`\s+is\s+/i, "")
        .replace(/\s+/g, " ")
        .trim();
}

/** Extract the main description text from a JSDoc block (text before any @tag). */
function jsdocMainText(jsdoc: string): string {
    const inner = jsdoc
        .replace(/^\s*\/\*\*/, "")
        .replace(/\*\/\s*$/, "")
        .replace(/^\s*\*\s?/gm, "")
        .trim();
    const tagIdx = inner.search(/^\s*@/m);
    const main = tagIdx >= 0 ? inner.slice(0, tagIdx) : inner;
    return cleanDescription(main);
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
            // Skip template literal contents so braces/parens inside don't affect depth.
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

/** Skip a template literal starting at the backtick at `start`; return index just past the closing backtick. */
function skipTemplateLiteral(text: string, start: number): number {
    let i = start + 1;
    while (i < text.length) {
        const ch = text[i];
        if (ch === "\\") {
            i += 2; // skip escaped char
            continue;
        }
        if (ch === "`") return i + 1;
        if (ch === "$" && text[i + 1] === "{") {
            // Skip nested ${...} expression (which may contain its own template literals).
            i = skipTemplateExpr(text, i + 1);
            continue;
        }
        i++;
    }
    return i;
}

/** Skip a `${...}` expression starting at the `{` at `start`; return index just past the closing `}`. */
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
// Schema cache: resolves `${XSchema}` interpolations in GraphQL templates.
// ---------------------------------------------------------------------------

const schemaCache = new Map<string, string>();
const schemaScanDone = { value: false };

/** Scan the interfaces tree once and populate the schema cache with raw template bodies. */
function scanSchemas(): void {
    if (schemaScanDone.value) return;
    schemaScanDone.value = true;
    const schemaDirs = [join(ANILIST, "schemas"), join(ANILIST, "interfaces")];
    for (const dir of schemaDirs) {
        if (existsSync(dir)) {
            collectSchemas(dir);
        }
    }
}

/** Recursively walk a directory collecting `export const XSchema = `...`` bodies. */
function collectSchemas(dir: string): void {
    for (const name of readdirSync(dir)) {
        const full = join(dir, name);
        const stat = statSync(full);
        if (stat.isDirectory()) {
            collectSchemas(full);
        } else if (name.endsWith(".ts")) {
            const content = readFileText(full);
            const re = /export const (\w+Schema)\s*=\s*`/g;
            let m = re.exec(content);
            while (m !== null) {
                const schemaName = m[1];
                const tickStart = m.index + m[0].length - 1;
                const tickEnd = content.indexOf("`", tickStart + 1);
                if (tickEnd > tickStart) {
                    schemaCache.set(schemaName, content.slice(tickStart + 1, tickEnd));
                }
                m = re.exec(content);
            }
        }
    }
}

/** Resolve `${XSchema}` interpolations in a GraphQL template body, recursively. */
function resolveSchemas(body: string, depth = 0): string {
    if (depth > 12) return body; // cycle guard
    return body.replace(/\$\{(\w+Schema)\}/g, (_match, name: string) => {
        const cached = schemaCache.get(name);
        if (cached === undefined) return `\${${name}}`; // leave placeholder if unresolvable
        return resolveSchemas(cached, depth + 1);
    });
}

/** Dedent a block of text by its minimum common leading whitespace. */
function dedent(text: string): string {
    const lines = text.split("\n");
    const indents = lines
        .filter((l) => l.trim().length > 0)
        .map((l) => {
            const mm = /^\s*/.exec(l);
            return mm ? mm[0].length : 0;
        });
    const min = indents.length ? Math.min(...indents) : 0;
    return lines
        .map((l) => l.slice(min))
        .join("\n")
        .trim();
}

// ---------------------------------------------------------------------------
// Enum cache: resolves `*Mappings` arrays to their string literal values.
// ---------------------------------------------------------------------------

const enumCache = new Map<string, string[]>();

/** Resolve a `*Mappings` array constant to its string-literal values. */
function resolveEnumMappings(mappingName: string): string[] {
    if (enumCache.has(mappingName)) return enumCache.get(mappingName)!;
    const result = findEnumMappings(mappingName);
    enumCache.set(mappingName, result);
    return result;
}

/** Search the types directory for a `*Mappings` array and return its string values. */
function findEnumMappings(mappingName: string): string[] {
    const typesDir = join(ANILIST, "types");
    if (!existsSync(typesDir)) return [];
    for (const name of readdirSync(typesDir)) {
        if (!name.endsWith(".ts")) continue;
        const content = readFileText(join(typesDir, name));
        // Mapping constants may carry a readonly union annotation
        // (e.g. `export const MediaSortMappings: readonly MediaSort[] = [...]`).
        const re = new RegExp(
            String.raw`export const ${mappingName}\s*(?::\s*[^=]+)?\s*=\s*\[([\s\S]*?)\]`
        );
        const m = re.exec(content);
        if (m) {
            const vals = m[1].match(/"([^"]+)"/g);
            return vals ? vals.map((v) => v.replaceAll('"', "")) : [];
        }
    }
    return [];
}

/** Resolve a `*Mappings` object constant (e.g. FuzzyDateMappings) to a field-name→type map. */
function resolveObjectMappings(mappingName: string): Record<string, string> | null {
    const found = findObjectMappingsFile(mappingName);
    if (!found) return null;
    const body = found.body;
    const out: Record<string, string> = {};
    const fieldRe = /(\w+)\s*:\s*"([^"]+)"/g;
    let fm = fieldRe.exec(body);
    while (fm !== null) {
        out[fm[1]] = fm[2];
        fm = fieldRe.exec(body);
    }
    return out;
}

/** Find the file and body of a `*Mappings` object constant; also returns the file path. */
function findObjectMappingsFile(mappingName: string): { file: string; body: string } | null {
    const typesDir = join(ANILIST, "types");
    if (!existsSync(typesDir)) return null;
    for (const name of readdirSync(typesDir)) {
        if (!name.endsWith(".ts")) continue;
        const content = readFileText(join(typesDir, name));
        const re = new RegExp(String.raw`export const ${mappingName}\s*=\s*\{([\s\S]*?)\}`);
        const m = re.exec(content);
        if (m) {
            return { file: join(typesDir, name), body: m[1] };
        }
    }
    return null;
}

/** Find the type fields for a `*Mappings` object by locating a matching `export type` in the same file. */
function findTypeFieldsForMapping(mappingName: string): Field[] {
    const found = findObjectMappingsFile(mappingName);
    if (!found) return [];
    const baseName = mappingName.replace(/Mappings$/, "");
    const content = readFileText(found.file);
    // Look for an `export type <Name> = { ... }` whose name starts with the mapping's base name.
    const re = new RegExp(String.raw`export type (\w+)\s*=\s*\{`, "g");
    let m = re.exec(content);
    while (m !== null) {
        if (m[1].startsWith(baseName)) {
            const openIdx = content.indexOf("{", m.index);
            const closeIdx = matchBrace(content, openIdx);
            if (closeIdx > openIdx) {
                return fieldsFromObjectBody(content.slice(openIdx + 1, closeIdx));
            }
        }
        m = re.exec(content);
    }
    return [];
}

// ---------------------------------------------------------------------------
// Variables interface parsing.
// ---------------------------------------------------------------------------

interface RawMember {
    name: string;
    rawType: string;
    required: boolean;
    description: string;
}

/** Parse a `*Variables` interface body (the text between its braces) into raw members. */
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

/** Parse a nested object type (e.g. `FuzzyDateInput`) from its source file into Field[]. */
function parseNestedObjectFields(typeName: string, depth = 0): Field[] {
    if (depth > 4) return [];
    const typesDir = join(ANILIST, "types");
    if (!existsSync(typesDir)) return [];
    for (const name of readdirSync(typesDir)) {
        if (!name.endsWith(".ts")) continue;
        const content = readFileText(join(typesDir, name));
        const re = new RegExp(String.raw`export type ${typeName}\s*=\s*\{`);
        const m = re.exec(content);
        if (m) {
            const openIdx = content.indexOf("{", m.index);
            const closeIdx = matchBrace(content, openIdx);
            if (closeIdx > openIdx) {
                return fieldsFromObjectBody(content.slice(openIdx + 1, closeIdx));
            }
        }
    }
    return [];
}

/** Parse an object type body into Field[] (scalars only at this depth). */
function fieldsFromObjectBody(body: string): Field[] {
    const bodyLines = body.split("\n");
    const fields: Field[] = [];
    for (let i = 0; i < bodyLines.length; i++) {
        const line = bodyLines[i];
        const memberMatch = /^(\s*)(\w+)\??\s*:\s*([^;]+);/.exec(line);
        if (!memberMatch) continue;
        const fname = memberMatch[2];
        const optional = /\w+\?\s*:/.test(line);
        const ftype = memberMatch[3].trim();
        fields.push({
            name: fname,
            type: normalizeScalarType(ftype),
            required: !optional,
            description: memberDescriptionAbove(bodyLines, i),
        });
    }
    return fields;
}

/** Normalize a scalar TS type string to a Field `type` value. */
function normalizeScalarType(rawType: string): Field["type"] {
    const t = rawType.trim();
    if (/number|Int|Float/.test(t)) return "number";
    if (/boolean|Boolean/.test(t)) return "boolean";
    if (/string|String/.test(t)) return "string";
    return "string";
}

/** Parse the variable type mappings object from an operation's method body. */
function parseVariableTypeMappings(
    methodBody: string,
    sourceFile?: string
): Record<string, string> {
    // The mappings object is declared either as a standalone `const
    // variableTypeMappings = {...}` (legacy shape), inline as the `mappings:`
    // property of the `execute` options object, or as a reference to a
    // module-level constant (`mappings: MediasMappings`) hoisted beside the
    // document template. Match all three forms and extract the object body up
    // to the matching closing brace.
    const out: Record<string, string> = {};
    const startRe = /(?:const variableTypeMappings\s*=\s*\{|mappings:\s*\{)/;
    const startMatch = startRe.exec(methodBody);
    if (!startMatch) {
        // Hoisted form: `mappings: <Identifier>` referencing a module-level
        // `const <Identifier> = {...}` declared in the same source file.
        const refMatch = /mappings:\s*([A-Za-z_]\w*)\s*,/.exec(methodBody);
        if (refMatch && sourceFile) {
            const constName = refMatch[1];
            const declRe = new RegExp(`(?:const|let|var)\\s+${constName}\\s*=\\s*\\{`);
            const fileText = readFileText(sourceFile);
            const decl = declRe.exec(fileText);
            if (decl) {
                const declBodyStart = decl.index + decl[0].length;
                const declBody = extractBalancedBraces(fileText, declBodyStart);
                if (declBody !== null) {
                    collectMappingEntries(declBody, out);
                }
            }
        }
        return out;
    }
    const bodyStart = startMatch.index + startMatch[0].length;
    const body = extractBalancedBraces(methodBody, bodyStart);
    if (body === null) return {};
    collectMappingEntries(body, out);
    return out;
}

/** Collect `name: "type"` / `name: Identifier` entries from a mappings body. */
function collectMappingEntries(body: string, out: Record<string, string>): void {
    const entryRe = /(\w+)\s*:\s*("([^"]*)"|([A-Za-z_]\w*))/g;
    let em = entryRe.exec(body);
    while (em !== null) {
        out[em[1]] = em[3] ?? em[4];
        em = entryRe.exec(body);
    }
}

/**
 * Extract the text between balanced braces starting just after an opening
 * `{` at `start`. Returns `null` if no balanced span is found. Handles nested
 * objects so the `mappings` block (which may contain nested object mappings
 * such as `FuzzyDateMappings`) is captured in full.
 */
function extractBalancedBraces(source: string, start: number): string | null {
    let depth = 1;
    let i = start;
    while (i < source.length && depth > 0) {
        const ch = source[i];
        if (ch === "{") depth++;
        else if (ch === "}") {
            depth--;
            if (depth === 0) return source.slice(start, i);
        }
        i++;
    }
    return depth === 0 ? source.slice(start, i) : null;
}

/** Find the file containing `export interface <interfaceName>` starting from a hint file's directory. */
function findInterfaceFile(hintFilePath: string, interfaceName: string): string | null {
    // First check the hint file itself.
    if (new RegExp(`export interface ${interfaceName}\\s*\\{`).test(readFileText(hintFilePath))) {
        return hintFilePath;
    }
    // Otherwise search the hint file's directory (and parent for query/).
    const dir = dirname(hintFilePath);
    const candidates = [dir, dirname(dir)];
    for (const d of candidates) {
        if (!existsSync(d)) continue;
        for (const name of readdirSync(d)) {
            if (!name.endsWith(".ts")) continue;
            const full = join(d, name);
            const content = readFileText(full);
            if (new RegExp(`export interface ${interfaceName}\\s*\\{`).test(content)) {
                return full;
            }
        }
    }
    return null;
}

/** Build the Field list for an operation from its variables interface + type mappings. */
function buildFields(
    interfaceFilePath: string,
    interfaceName: string,
    methodBody: string
): Field[] {
    const resolved = findInterfaceFile(interfaceFilePath, interfaceName) ?? interfaceFilePath;
    const members = parseInterfaceMembers(resolved, interfaceName);
    if (members.length === 0) return [];
    const mappings = parseVariableTypeMappings(methodBody, interfaceFilePath);

    return members.map((mem) => {
        const mapping = mappings[mem.name];
        const isArray = /\[\]$/.test(mem.rawType) || mem.rawType.endsWith("[]");
        let type: Field["type"] = "string";
        let enumValues: string[] | undefined;
        let nestedFields: Field[] | undefined;

        if (mapping) {
            const resolved = resolveMapping(mapping, isArray);
            type = resolved.type;
            enumValues = resolved.enumValues;
            nestedFields = resolved.nestedFields;
        } else {
            // No mapping — infer from the interface member's raw type.
            type = normalizeScalarType(mem.rawType);
            if (isArray) {
                if (type === "number") type = "number[]";
                else if (type === "string") type = "string[]";
            }
        }

        const field: Field = {
            name: mem.name,
            type,
            required: mem.required,
            description: mem.description,
        };
        if (enumValues) field.enumValues = enumValues;
        if (nestedFields) field.nestedFields = nestedFields;
        return field;
    });
}

/** Resolve a single mapping value to a field type, enum values, and/or nested fields. */
function resolveMapping(
    mapping: string,
    isArray: boolean
): { type: Field["type"]; enumValues?: string[]; nestedFields?: Field[] } {
    if (mapping === "number") return { type: isArray ? "number[]" : "number" };
    if (mapping === "string") return { type: isArray ? "string[]" : "string" };
    if (mapping === "boolean") return { type: "boolean" };
    if (mapping === "string[]") return { type: "string[]" };
    if (mapping === "number[]") return { type: "number[]" };
    if (mapping === "CountryCode") return { type: "string" };

    // Identifier — could be an enum array (XMappings) or an object mapping (XMappings).
    const enumVals = resolveEnumMappings(mapping);
    if (enumVals.length > 0) {
        return { type: isArray ? "enum[]" : "enum", enumValues: enumVals };
    }
    const objMap = resolveObjectMappings(mapping);
    if (objMap) {
        // The object mapping gives field names + scalar types; enrich descriptions
        // from the actual type definition (e.g. FuzzyDateInput) in the same file.
        const typeFields = findTypeFieldsForMapping(mapping);
        const descByName = new Map(typeFields.map((f) => [f.name, f.description]));
        const nestedFields = Object.keys(objMap).map((k) => ({
            name: k,
            type: normalizeScalarType(objMap[k]),
            required: false,
            description: descByName.get(k) ?? "",
        }));
        return { type: isArray ? "object[]" : "object", nestedFields };
    }
    // Try resolving as a nested object type by name (strip trailing "Mappings").
    const typeName = mapping.replace(/Mappings$/, "");
    const nf = parseNestedObjectFields(typeName);
    if (nf.length > 0) {
        return { type: isArray ? "object[]" : "object", nestedFields: nf };
    }
    return { type: isArray ? "string[]" : "string" };
}

// ---------------------------------------------------------------------------
// GraphQL string extraction.
// ---------------------------------------------------------------------------

/** Extract and schema-resolve the GraphQL template from an operation's method body. */
function extractGraphql(methodBody: string): string {
    // Form 1: `const query = `...`` or `const mutation = `...`` (template literal).
    const tmpl = /const (query|mutation)\s*=\s*`/.exec(methodBody);
    if (tmpl) {
        const tickStart = tmpl.index + tmpl[0].length - 1;
        const tickEnd = methodBody.indexOf("`", tickStart + 1);
        if (tickEnd < 0) return "";
        const raw = methodBody.slice(tickStart + 1, tickEnd);
        return dedent(resolveSchemas(raw));
    }
    // Form 2: `const query = SomeSchemaIdentifier;` (assigns a schema constant directly).
    const ident = /const (query|mutation)\s*=\s*([A-Za-z_]\w*)\s*;/.exec(methodBody);
    if (ident) {
        const schemaName = ident[2];
        const cached = schemaCache.get(schemaName);
        if (cached !== undefined) return dedent(resolveSchemas(cached));
    }
    return "";
}

/** Extract the method body (text between the method's `{` and its matching `}`). */
function extractMethodBody(filePath: string, methodName: string): string {
    const content = readFileText(filePath);
    const re = new RegExp(`async ${methodName}\\s*\\(`);
    const m = re.exec(content);
    if (!m) return "";
    // The method signature may contain `{` from default params (e.g. `= {}`),
    // so find the opening brace of the body by matching the param-list parens first.
    const parenIdx = content.indexOf("(", m.index);
    if (parenIdx < 0) return "";
    const parenClose = matchParen(content, parenIdx);
    if (parenClose < 0) return "";
    const braceIdx = content.indexOf("{", parenClose);
    if (braceIdx < 0) return "";
    const closeIdx = matchBrace(content, braceIdx);
    if (closeIdx < 0) return "";
    return content.slice(braceIdx + 1, closeIdx);
}

/** Match parens starting at `openIdx` (which must point at `(`); return index of the closing `)`. */
function matchParen(text: string, openIdx: number): number {
    let depth = 0;
    for (let i = openIdx; i < text.length; i++) {
        const ch = text[i];
        if (ch === "(") depth++;
        else if (ch === ")") {
            depth--;
            if (depth === 0) return i;
        }
    }
    return -1;
}

// ---------------------------------------------------------------------------
// Operation discovery from AniLink.ts.
// ---------------------------------------------------------------------------

interface RawOp {
    category: "query" | "mutation" | "page" | "custom";
    name: string;
    variablesType: string;
    responseType: string;
    description: string;
    className: string | null;
}

/** Parse the type-declaration block in AniLink.ts into raw operations. */
function discoverOperations(): RawOp[] {
    const content = readFileText(join(ANILIST, "anilist-api-type.ts"));
    const lines = content.split("\n");
    const ops: RawOp[] = [];

    let section: "query" | "mutation" | "page" | "custom" | null = null;
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        if (/^\s+query:\s*\{/.test(line)) {
            section = "query";
            continue;
        }
        if (/^\s+page:\s*\{/.test(line)) {
            section = "page";
            continue;
        }
        if (/^\s+mutation:\s*\{/.test(line)) {
            section = "mutation";
            continue;
        }
        // Closing braces reset section heuristically by indentation.
        if (/^\s{8}\},?\s*$/.test(line) && section === "page") {
            section = "query";
            continue;
        }
        if (/^\s{4}\},?\s*$/.test(line) && (section === "query" || section === "mutation")) {
            section = null;
            continue;
        }

        // Custom signature — may span one or several lines.
        if (/^\s*custom:\s*</.test(line)) {
            let combined = line;
            for (let k = i + 1; k < Math.min(i + 8, lines.length); k++) {
                combined += " " + lines[k].trim();
                if (lines[k].includes("=>") && lines[k].includes(";")) break;
            }
            if (
                /^\s*custom:\s*<[^>]*>\(\s*query:\s*string,\s*variables\?:\s*Record<string, unknown>(?:,\s*options\?:\s*[A-Za-z]+)?\s*\)\s*=>\s*Promise<[^>]*>;/.test(
                    combined
                )
            ) {
                ops.push({
                    category: "custom",
                    name: "custom",
                    variablesType: "",
                    responseType: "any",
                    description: jsdocMainText(findJsdocAbove(lines, i)),
                    className: null,
                });
                continue;
            }
        }

        // Operation signature — may span one or several lines.
        const sig = tryParseSignature(lines, i);
        if (sig && section) {
            ops.push({
                category: section,
                name: sig.name,
                variablesType: sig.variablesType,
                responseType: sig.responseType,
                description: jsdocMainText(findJsdocAbove(lines, i)),
                className: null,
            });
        }
    }
    return ops;
}

/** Try to parse an operation signature starting at `lines[start]`. Returns null if not a match. */
function tryParseSignature(
    lines: string[],
    start: number
): { name: string; variablesType: string; responseType: string } | null {
    // Single-line form: `name: (variables: XVars) => Promise<XResp>;`
    const single =
        /^\s+([a-zA-Z]+):\s*\(variables:\s*([A-Za-z]+)(?:,\s*options\?:\s*[A-Za-z]+)?\)\s*=>\s*Promise<([A-Za-z]+)>;\s*$/.exec(
            lines[start]
        );
    if (single) {
        return { name: single[1], variablesType: single[2], responseType: single[3] };
    }
    // Multi-line form: `name: (` then `variables: XVars` then `) => Promise<XResp>;`
    const opener = /^\s+([a-zA-Z]+):\s*\(\s*$/.exec(lines[start]);
    if (!opener) return null;
    const name = opener[1];
    // Gather up to a few following lines until we see `=> Promise<...>;`.
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

/** Resolve the source class name, method name, and source file for an operation. */
function resolveSourceInfo(
    op: RawOp
): { className: string; methodName: string; sourceFile: string } | null {
    const content = readFileText(join(ANILIST, "anilist-wiring.ts"));
    const escapedName = op.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    // Find all bindings: `name: <instance>.<method>.bind(<instance>)`.
    // The method name does not always equal the operation name (e.g. `following` op
    // binds to `followingsQueryInstance.followings`), so match any method name.
    const re = new RegExp(`${escapedName}:\\s+(\\w+)\\.(\\w+)\\.bind`, "g");
    const candidates: Array<{ instanceVar: string; methodName: string; className: string }> = [];
    let m = re.exec(content);
    while (m !== null) {
        const instanceVar = m[1];
        const methodName = m[2];
        const escapedInst = instanceVar.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const newRe = new RegExp(`const ${escapedInst}\\s*=\\s*new\\s+(\\w+)`);
        const nm = newRe.exec(content);
        if (nm) candidates.push({ instanceVar, methodName, className: nm[1] });
        m = re.exec(content);
    }
    if (candidates.length === 0) return null;

    // Resolve each candidate to a source file, then disambiguate by checking which
    // file contains the operation's `variablesType` interface (handles duplicate
    // operation names across query/page, e.g. `following`).
    for (const cand of candidates) {
        const sourceFile = findClassFile(cand.className, op.category);
        if (sourceFile && interfaceInFile(sourceFile, op.variablesType)) {
            return { className: cand.className, methodName: cand.methodName, sourceFile };
        }
    }
    // Fallback: first candidate whose class file exists.
    for (const cand of candidates) {
        const sourceFile = findClassFile(cand.className, op.category);
        if (sourceFile) {
            return { className: cand.className, methodName: cand.methodName, sourceFile };
        }
    }
    return null;
}

/** Check whether a file contains `export interface <interfaceName>`. */
function interfaceInFile(filePath: string, interfaceName: string): boolean {
    if (!interfaceName) return false;
    const content = readFileText(filePath);
    return new RegExp(`export interface ${interfaceName}\\s*\\{`).test(content);
}

/** Find the source file containing `export class <className>` for a given category. */
function findClassFile(className: string, category: RawOp["category"]): string | null {
    const dirs: string[] = [];
    if (category === "query") {
        dirs.push(join(ANILIST, "query"), join(ANILIST, "query", "page"));
    } else if (category === "page") {
        dirs.push(join(ANILIST, "query", "page"));
    } else if (category === "mutation") {
        dirs.push(join(ANILIST, "mutation"));
    } else {
        return null;
    }
    for (const dir of dirs) {
        if (!existsSync(dir)) continue;
        for (const name of readdirSync(dir)) {
            if (!name.endsWith(".ts")) continue;
            const full = join(dir, name);
            const content = readFileText(full);
            if (new RegExp(`export class ${className}\\b`).test(content)) return full;
        }
    }
    return null;
}

/** Build the AniLink call string for an operation. */
function buildAnilinkCall(op: RawOp): string {
    if (op.category === "custom") return "aniLink.anilist.custom(query, variables)";
    if (op.category === "query") return `aniLink.anilist.query.${op.name}(variables)`;
    if (op.category === "page") return `aniLink.anilist.query.page.${op.name}(variables)`;
    return `aniLink.anilist.mutation.${op.name}(variables)`;
}

// ---------------------------------------------------------------------------
// Public API.
// ---------------------------------------------------------------------------

/** Generate the full explorer manifest by parsing the source tree. Pure (no I/O). */
export function generateManifest(): Manifest {
    scanSchemas();
    const rawOps = discoverOperations();
    const operations: Operation[] = [];

    for (const op of rawOps) {
        if (op.category === "custom") {
            operations.push({
                category: "custom",
                name: "custom",
                description: op.description,
                variablesType: "",
                responseType: "any",
                requiresAuth: false,
                fields: [],
                graphql: "",
                anilinkCall: buildAnilinkCall(op),
            });
            continue;
        }

        const info = resolveSourceInfo(op);
        let fields: Field[] = [];
        let graphql = "";
        if (info) {
            const methodBody = extractMethodBody(info.sourceFile, info.methodName);
            fields = buildFields(info.sourceFile, op.variablesType, methodBody);
            graphql = extractGraphql(methodBody);
        }

        operations.push({
            category: op.category,
            name: op.name,
            description: op.description,
            variablesType: op.variablesType,
            responseType: op.responseType,
            requiresAuth: op.category === "mutation",
            fields,
            graphql,
            anilinkCall: buildAnilinkCall(op),
        });
    }

    return {
        generatedAt: new Date().toISOString(),
        anilistEndpoint: ANILIST_ENDPOINT,
        operations,
    };
}

/** Write the manifest to `outPath` as pretty-printed JSON. */
export function writeManifest(outPath: string): void {
    const manifest = generateManifest();
    mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, JSON.stringify(manifest, null, 2) + "\n", "utf8");
}

/** Copy the static explorer UI assets from `explorer-src/` into the docs output directory. */
function copyExplorerAssets(destDir: string): void {
    const srcDir = join(ROOT, "explorer-src");
    if (!existsSync(srcDir)) return;
    // Copy index.html.
    copyFileSync(join(srcDir, "index.html"), join(destDir, "index.html"));
    // Copy assets/.
    const destAssets = join(destDir, "assets");
    mkdirSync(destAssets, { recursive: true });
    const srcAssets = join(srcDir, "assets");
    if (existsSync(srcAssets)) {
        for (const name of readdirSync(srcAssets)) {
            copyFileSync(join(srcAssets, name), join(destAssets, name));
        }
    }
}

// CLI entry: `npx tsx scripts/generate-explorer-manifest.ts`
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
    const outDir = resolve(import.meta.dirname, "..", "docs", "explorer");
    const outPath = join(outDir, "operations.json");
    writeManifest(outPath);
    copyExplorerAssets(outDir);
    const manifest = generateManifest();
    console.log(`Wrote ${manifest.operations.length} operations to ${outPath}`);
    console.log(`Copied explorer UI assets to ${outDir}`);
}
