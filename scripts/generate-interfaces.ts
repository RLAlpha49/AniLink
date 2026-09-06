/**
 * Generates the response interfaces under `src/apis/anilist/interfaces/` from
 * the handwritten schema-fragment constants under `src/apis/anilist/schemas/`
 * and the committed AniList introspection snapshot.
 *
 * The manifest in `generate-interfaces.config.ts` pairs every generated export
 * with its fragment constant and typing overrides. Files marked `mode: "file"`
 * are fully owned by this script; files marked `mode: "region"` keep their
 * handwritten sections outside the @generated-start/@generated-end markers.
 *
 * Usage:
 *   npm run interfaces:generate             # write updated files
 *   npm run interfaces:generate -- --check  # exit 1 when any file is stale
 */
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { pathToFileURL } from "node:url";
import { format, resolveConfig } from "prettier";
import ts from "typescript";
import { stripGeneratedRegions, pruneSupersededContent } from "../lib/interfaces-codegen/emit";
import { buildGeneratedFiles } from "../lib/interfaces-codegen/run";
import { generatorConfig } from "./generate-interfaces.config";

const REPO_ROOT = process.cwd();

/**
 * Collect exported GraphQL schema-template constants from the configured schema tree.
 *
 * @returns A name-to-template map used to resolve generated selections.
 * @throws {Error} When the configured schema directory cannot be traversed.
 */
function collectSchemaConstants(): Record<string, string> {
    const schemas: Record<string, string> = {};
    const walk = (directory: string): void => {
        for (const entry of readdirSync(directory, { withFileTypes: true })) {
            const entryPath = join(directory, entry.name);
            if (entry.isDirectory()) walk(entryPath);
            else if (entry.name.endsWith(".ts")) {
                const source = readFileSync(entryPath, "utf8");
                for (const match of source.matchAll(/export\s+const\s+(\w+)\s*=\s*`([\s\S]*?)`/g)) {
                    schemas[match[1]] = match[2];
                }
            }
        }
    };
    walk(join(REPO_ROOT, generatorConfig.schemasDir));
    return schemas;
}

/**
 * Verifies via the TypeScript AST that the regex match at `matchIndex`
 * corresponds to a real `const query` or `const mutation` declaration whose
 * initializer is a template literal, rejecting matches found only in comments
 * or string literals.
 *
 * The binding may appear at module top level or nested inside a method body —
 * every operation file in this repo declares its document inside the public
 * operation method, so restricting the search to `sourceFile.statements` would
 * reject every file. The whole syntax tree is therefore walked.
 *
 * @param source - The full source text of the file.
 * @param matchIndex - The character offset of the regex match.
 * @returns `true` when the match is a real template-literal binding.
 */
export function hasTopLevelTemplateLiteralBinding(source: string, matchIndex: number): boolean {
    const sourceFile = ts.createSourceFile("temp.ts", source, ts.ScriptTarget.Latest, false);
    let found = false;
    const visit = (node: ts.Node): void => {
        if (found) return;
        if (ts.isVariableStatement(node)) {
            for (const decl of node.declarationList.declarations) {
                if (!ts.isIdentifier(decl.name)) continue;
                const name = decl.name.text;
                if (name !== "query" && name !== "mutation") continue;
                if (!decl.initializer || !ts.isTemplateLiteral(decl.initializer)) continue;
                // Verify the regex match falls within this declaration's span.
                const start = node.getStart(sourceFile);
                const end = node.getEnd();
                if (matchIndex >= start && matchIndex < end) {
                    found = true;
                    return;
                }
            }
        }
        node.forEachChild(visit);
    };
    visit(sourceFile);
    return found;
}

/**
 * Extracts the inline `const query/mutation` template literal from an
 * operation file so operation-derived interfaces can be generated from the
 * exact document the client sends.
 *
 * The codegen resolves operation-derived outputs from this inline document
 * only; it does not follow imports. An operation file that binds the document
 * to an imported constant (`const query = SomeFragment`) or renames the
 * binding away from `query`/`mutation` therefore breaks generation silently
 * unless this guard rejects it. The check runs in both write and `--check`
 * modes so the breakage surfaces in CI with a named file rather than as a
 * stale-interfaces diff.
 *
 * The source is parsed with the TypeScript AST before a regex match is
 * accepted, so matches found only in comments or string literals are rejected.
 *
 * @param file - Repo-relative path of the operation file.
 * @returns The inline GraphQL document text.
 * @throws {Error} When the file lacks an inline `const query|mutation = \`...\``
 *   template literal, with a message naming the file and the expected binding.
 */
export function collectOperationDocument(file: string): string {
    const source = readFileSync(join(REPO_ROOT, file), "utf8");
    const match = /const\s+(?:query|mutation)\s*=\s*`([\s\S]*?)`/.exec(source);
    if (match && hasTopLevelTemplateLiteralBinding(source, match.index)) return match[1];

    // Distinguish the two common breakages so the message points at the fix.
    const identifierBinding = /const\s+(query|mutation)\s*=\s*([A-Za-z_]\w*)/.exec(source);
    const expected = "an inline `const query = `...`` or `const mutation = `...`` template literal";
    if (identifierBinding) {
        throw new Error(
            `generate-interfaces: ${file} binds the document to an imported constant ` +
                `(${identifierBinding[0]}) instead of an inline template literal. ` +
                `Codegen reads the inline document only; it does not resolve imports. ` +
                `Inline the GraphQL document as ${expected} so the generated ` +
                `interface mirrors what the client sends.`
        );
    }
    throw new Error(
        `generate-interfaces: ${file} has no inline query/mutation template literal. ` +
            `Operation-derived interfaces are generated from the operation file's ` +
            `inline document, so renaming or removing the binding breaks codegen. ` +
            `Restore ${expected}.`
    );
}

/**
 * Index the authoritative output and existing interface locations for generated references.
 *
 * @param outputs - Output specifications that claim generated type names.
 * @returns A type-name-to-module-path map used by the code generator.
 * @throws {Error} When the existing interfaces tree cannot be traversed.
 */
function collectTypeLocations(
    outputs: Array<{ path: string; exports: Array<{ exportedName: string }> }>
): Map<string, string> {
    const locations = new Map<string, string>();
    // Manifest outputs are the authoritative home for their exports, even
    // before the files have been (re)written on disk.
    for (const output of outputs) {
        for (const spec of output.exports) locations.set(spec.exportedName, output.path);
    }
    for (const [name, module] of Object.entries(generatorConfig.aliasImports)) {
        locations.set(name, module);
    }
    const interfacesDir = join(REPO_ROOT, "src", "apis", "graphql", "anilist", "interfaces");
    const walk = (directory: string): void => {
        for (const entry of readdirSync(directory, { withFileTypes: true })) {
            const entryPath = join(directory, entry.name);
            if (entry.isDirectory()) walk(entryPath);
            else if (entry.name.endsWith(".ts")) {
                const source = readFileSync(entryPath, "utf8");
                const repoRelative = relative(REPO_ROOT, entryPath).split("\\").join("/");
                for (const match of source.matchAll(/export\s+(?:interface|type|const)\s+(\w+)/g)) {
                    if (!locations.has(match[1])) locations.set(match[1], repoRelative);
                }
            }
        }
    };
    walk(interfacesDir);
    return locations;
}

/** Format generated content with the repository's Prettier configuration. */
async function formatWithPrettier(content: string, outputPath: string): Promise<string> {
    const config = await resolveConfig(join(REPO_ROOT, outputPath));
    return format(content, { ...(config ?? {}), filepath: join(REPO_ROOT, outputPath) });
}

/**
 * Generate or check every interface declared by {@link generatorConfig}.
 *
 * In normal mode this writes changed generated files. With `--check`, it only
 * reports stale outputs and returns a non-zero status for CI.
 *
 * @returns Process-style status code: `0` when current, `1` when stale in check mode.
 * @throws {Error} When schema, source, or formatting inputs cannot be read.
 */
async function main(): Promise<number> {
    const check = process.argv.includes("--check");
    const schemas = collectSchemaConstants();
    const typeLocations = collectTypeLocations(generatorConfig.outputs);
    const snapshotPath = join(REPO_ROOT, generatorConfig.schemaSnapshotPath);
    const schemaJson = JSON.parse(readFileSync(snapshotPath, "utf8"));

    // Region-mode files are diffed against their on-disk state with any
    // previous generated span removed and exports now claimed by the manifest
    // pruned, so migrating a handwritten file needs no manual cleanup. CRLF is
    // normalized so checkout settings cannot cause phantom drift.
    const existingContents = new Map<string, string>();
    for (const output of generatorConfig.outputs) {
        if (output.mode !== "region") continue;
        let onDisk = "";
        try {
            onDisk = readFileSync(join(REPO_ROOT, output.path), "utf8").replace(/\r\n/g, "\n");
        } catch {
            onDisk = "";
        }
        const generatedNames = new Set(output.exports.map((spec) => spec.exportedName));
        const pruned = pruneSupersededContent(stripGeneratedRegions(onDisk), generatedNames);
        existingContents.set(output.path, pruned);
    }

    const operationFiles = [
        ...new Set(
            generatorConfig.outputs.flatMap((output) =>
                output.exports
                    .map((spec) => spec.source.operation?.file)
                    .filter((file): file is string => Boolean(file))
            )
        ),
    ];
    const operations: Record<string, string> = {};
    for (const file of operationFiles) operations[file] = collectOperationDocument(file);

    const rawContents = buildGeneratedFiles({
        schemas,
        operations,
        schemaJson,
        outputs: generatorConfig.outputs,
        existingContents,
        typeLocations,
        scalarTypes: generatorConfig.scalarTypes,
    });

    const changed: string[] = [];
    for (const [path, raw] of rawContents) {
        const formatted = await formatWithPrettier(raw.replace(/\r\n/g, "\n"), path);
        let current: string | undefined;
        try {
            current = readFileSync(join(REPO_ROOT, path), "utf8").replace(/\r\n/g, "\n");
        } catch {
            current = undefined;
        }
        if (current !== formatted) changed.push(path);
        if (!check) writeFileSync(join(REPO_ROOT, path), formatted, "utf8");
    }

    if (changed.length === 0) {
        console.log(`Generated interfaces up to date (${rawContents.size} files checked).`);
        return 0;
    }
    if (check) {
        console.error(`Generated interfaces are stale. Rerun 'npm run interfaces:generate':`);
        for (const path of changed) console.error(`  ${path}`);
        return 1;
    }
    console.log(`Updated ${changed.length} generated interface file(s):`);
    for (const path of changed) console.log(`  ${path}`);
    return 0;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
    void main().then((exitCode) => {
        process.exitCode = exitCode;
    });
}
