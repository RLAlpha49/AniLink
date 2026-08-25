/**
 * Rendering of generated TypeScript type declarations and management of the
 * `@generated-start` / `@generated-end` region markers that separate generated
 * content from handwritten sections inside interface files.
 */

import ts from "typescript";

import type { GeneratedType } from "./model";

export const GENERATED_START = "// @generated-start";
export const GENERATED_INSTRUCTION =
    "// Content between the generation markers is produced by scripts/generate-interfaces.ts; do not edit by hand.";

export const GENERATED_END = "// @generated-end";

/** Header comment placed above the generated region in file-mode outputs. */
export const GENERATED_FILE_HEADER = [
    "/**",
    " * Response interfaces generated from the schema fragments under",
    " * `src/apis/anilist/schemas/` and the committed AniList schema snapshot.",
    " * Run `npm run interfaces:generate` after changing a fragment;",
    " * do not edit the generated block by hand.",
    " */",
    "",
].join("\n");

export function renderTypeDeclaration(type: GeneratedType): string {
    const doc = [
        "/**",
        ` * \`${type.name}\` — ${type.summary}`,
        " *",
        " * Generated from the schema fragments; do not edit by hand.",
        ` * @see ${type.see}`,
        " */",
    ];
    if (type.kind === "union") {
        return [...doc, `export type ${type.name} = ${type.members?.join(" | ")};`, ""].join("\n");
    }
    const properties = (type.properties ?? [])
        .map((property) => {
            const lines: string[] = [];
            if (property.description) {
                lines.push("    /**", `     * ${sanitizeDescription(property.description)}`, "     */");
            }
            lines.push(`    ${property.name}${property.optional ? "?" : ""}: ${property.tsType};`);
            return lines.join("\n");
        })
        .join("\n\n");
    return [
        ...doc,
        `export interface ${type.name} {`,
        properties,
        "}",
        "",
    ].join("\n");
}

function sanitizeDescription(description: string): string {
    return description.replace(/\s+/g, " ").trim();
}

/**
 * Renders the inner generated-region content: an import statement group for
 * referenced types followed by every type declaration.
 */
export function renderRegion(
    types: GeneratedType[],
    imports: Array<{ names: string[]; from: string }>
): string {
    const importLines = imports
        .map((entry) => `import { type ${[...entry.names].sort().join(", type ")} } from "${entry.from}";`)
        .join("\n");
    return [importLines, ...types.map(renderTypeDeclaration)]
        .join("\n")
        .replace(/\n{3,}/g, "\n\n");
}

/**
 * Removes every @generated-start/@generated-end span (and stray orphan
 * markers) from a source file, returning only the handwritten content. Used
 * before inserting a fresh region so regeneration converges regardless of any
 * previous marker layout.
 */
export function stripGeneratedRegions(source: string): string {
    let result = "";
    let cursor = 0;
    while (cursor <= source.length) {
        const startIndex = source.indexOf(GENERATED_START, cursor);
        if (startIndex === -1) {
            result += source.slice(cursor);
            break;
        }
        result += source.slice(cursor, startIndex);
        const endIndex = source.indexOf(GENERATED_END, startIndex);
        if (endIndex === -1) break;
        cursor = endIndex + GENERATED_END.length;
    }
    result = result.replace(/^[ \t]*\/\/@[^\n]*generated[^\n]*\n/gm, "");
    // Drop stale copies of the file-mode header so repeated regeneration
    // cannot accumulate them between the region and the preserved content.
    result = result.split(GENERATED_FILE_HEADER).join("");
    return result.replace(/^\n+/, "").replace(/\n+$/, "\n");
}

/**
 * Removes exported interface/type declarations whose names are now owned by
 * the generated region (including their attached JSDoc), plus import
 * statements whose specifiers are no longer used by the surviving handwritten
 * content. Uses the TypeScript compiler API for precise ranges.
 */
export function pruneSupersededContent(source: string, generatedNames: Set<string>): string {
    if (!generatedNames.size) return source;
    const sourceFile = ts.createSourceFile("region.ts", source, ts.ScriptTarget.Latest, true);

    const removals: Array<{ start: number; end: number }> = [];

    const visit = (node: ts.Node): void => {
        if (
            (ts.isInterfaceDeclaration(node) || ts.isTypeAliasDeclaration(node)) &&
            generatedNames.has(node.name.text)
        ) {
            // getFullStart includes the node's leading trivia (JSDoc and
            // preceding blank lines), so the attached doc block is removed too.
            removals.push({ start: node.getFullStart(), end: node.end });
        }
        ts.forEachChild(node, visit);
    };
    visit(sourceFile);

    let pruned = source;
    for (const range of removals.toSorted((a, b) => b.start - a.start)) {
        pruned = pruned.slice(0, range.start) + pruned.slice(range.end);
    }

    // Drop imports whose specifiers no longer appear elsewhere.
    const prunedFile = ts.createSourceFile("region.ts", pruned, ts.ScriptTarget.Latest, true);
    const importRemovals: Array<{ start: number; end: number }> = [];
    for (const statement of prunedFile.statements) {
        if (!ts.isImportDeclaration(statement) || !statement.importClause?.namedBindings) continue;
        if (!ts.isNamedImports(statement.importClause.namedBindings)) continue;
        const rest = `${pruned.slice(0, statement.getStart())}${pruned.slice(statement.end)}`;
        const allUnused = statement.importClause.namedBindings.elements.every((element) =>
            !new RegExp(String.raw`\b${element.name.text}\b`).test(rest)
        );
        if (allUnused) importRemovals.push({ start: statement.getFullStart(), end: statement.end });
    }
    for (const range of importRemovals.toSorted((a, b) => b.start - a.start)) {
        pruned = pruned.slice(0, range.start) + pruned.slice(range.end);
    }
    return pruned.replace(/\n{3,}/g, "\n\n").replace(/\s+$/, "\n");
}

/**
 * Inserts the bare generated-region content into a file, owning ALL marker
 * placement. Existing marker spans are replaced in place; otherwise the region
 * is prepended above the preserved handwritten content (or stands alone when
 * there is none).
 */
export function applyGeneratedRegion(existingSource: string, regionContent: string): string {
    const startIndex = existingSource.indexOf(GENERATED_START);
    const endIndex = existingSource.indexOf(GENERATED_END);
    const wrapped = `${GENERATED_START}\n${GENERATED_INSTRUCTION}\n${regionContent}\n${GENERATED_END}`;
    if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
        const before = existingSource.slice(0, startIndex);
        const after = existingSource.slice(endIndex + GENERATED_END.length);
        return `${before}${wrapped}${after}`;
    }
    if (startIndex !== -1 || endIndex !== -1) {
        throw new Error("file has only one of @generated-start/@generated-end markers");
    }
    const handwritten = stripGeneratedRegions(existingSource);
    const region = `${GENERATED_FILE_HEADER}${wrapped}\n`;
    return handwritten.trim().length ? `${region}\n${handwritten}` : region;
}
