import { readFileSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { extractOperationMetadata } from "../../lib/api-compare/graph";
import {
    extractTypeScriptContracts,
    type TypeScriptContracts,
} from "../../lib/api-compare/typescript-contracts";
import type { PackageOperation } from "../../lib/api-compare/types";

export async function discoverPackageOperations(sourceRoot: string): Promise<PackageOperation[]> {
    const operations: PackageOperation[] = [];
    for (const directory of ["query", "mutation"]) {
        for (const sourcePath of await collectTypeScriptFiles(join(sourceRoot, directory))) {
            try {
                const sourceText = await readFile(sourcePath, "utf8");
                const referencedDocument = await resolveReferencedDocument(sourcePath, sourceText);
                operations.push(
                    ...parseOperationSource(sourcePath, sourceText, referencedDocument)
                );
            } catch (error) {
                throw new Error(
                    `Unable to parse ${sourcePath}: ${error instanceof Error ? error.message : String(error)}`,
                    { cause: error }
                );
            }
        }
    }
    return operations;
}

export async function discoverPackageContracts(sourceRoot: string): Promise<TypeScriptContracts> {
    const contracts: TypeScriptContracts = { types: {}, warnings: [] };
    for (const sourcePath of await collectTypeScriptFiles(sourceRoot)) {
        const sourceText = await readFile(sourcePath, "utf8");
        const extracted = extractTypeScriptContracts(sourcePath, sourceText);
        Object.assign(contracts.types, extracted.types);
        contracts.warnings.push(...extracted.warnings);
    }
    return contracts;
}

export function parseOperationSource(
    sourcePath: string,
    sourceText: string,
    referencedDocument?: string
): PackageOperation[] {
    const operations: PackageOperation[] = [];
    const classMatch = /export class (\w+?)(Query|Mutation)\s+extends/.exec(sourceText);
    const variableTypeName = /export interface (\w+Variables)/.exec(sourceText)?.[1];
    const responseTypeName = resolveResponseTypeName(sourceText);
    const rawDocument =
        /(?:const\s+)?(?:query|mutation)\s*=\s*`([\s\S]*?)`/.exec(sourceText)?.[1] ??
        referencedDocument;
    const document = rawDocument
        ? expandImportedSelections(sourcePath, sourceText, rawDocument)
        : undefined;
    if (!classMatch || !document) return operations;

    let metadata: ReturnType<typeof extractOperationMetadata>;
    try {
        metadata = extractOperationMetadata(document);
    } catch {
        metadata = extractFallbackMetadata(document);
    }
    const root = metadata.selection[0];
    if (!root) return operations;

    operations.push({
        sourcePath,
        kind: metadata.kind,
        exportName: classMatch[1] + classMatch[2],
        rootField: root.name,
        variables: metadata.variables,
        arguments: root.arguments,
        selection: root.selection,
        ...(variableTypeName ? { variableTypeName } : {}),
        ...(responseTypeName ? { responseTypeName } : {}),
    });
    return operations;
}

/**
 * Built-in TypeScript types that can never name an extracted response
 * contract; `Promise<void>`-style returns must not be treated as contracts.
 */
const NON_CONTRACT_TYPE_NAMES = new Set([
    "any",
    "boolean",
    "never",
    "number",
    "object",
    "string",
    "unknown",
    "void",
]);

/**
 * Resolves the response contract type name for an operation source.
 *
 * Operations traditionally import a dedicated `<Name>Response` interface; when
 * no such import exists (page operations returning unions or shared shapes),
 * fall back to the method's declared `Promise<T>` return type so contract
 * comparisons still run against the imported type.
 */
function resolveResponseTypeName(sourceText: string): string | undefined {
    const responseImport = /import\s+\{\s*type\s+(\w+Response)\b/.exec(sourceText)?.[1];
    if (responseImport) return responseImport;
    const declared = /async\s+\w+\s*\([^)]*\)\s*:\s*Promise<(\w+)>/.exec(sourceText)?.[1];
    if (!declared || NON_CONTRACT_TYPE_NAMES.has(declared)) return undefined;
    return declared;
}

function expandImportedSelections(
    sourcePath: string,
    sourceText: string,
    document: string,
    visited: Set<string> = new Set()
): string {
    return document.replace(/\$\{(\w+)\}/g, (placeholder, reference: string) => {
        const visitKey = `${sourcePath}:${reference}`;
        if (visited.has(visitKey)) return "";

        const imported = resolveImportedConstant(sourcePath, sourceText, reference);
        if (!imported) return placeholder;

        const nextVisited = new Set(visited).add(visitKey);
        return expandImportedSelections(
            imported.sourcePath,
            imported.sourceText,
            imported.document,
            nextVisited
        );
    });
}

function resolveImportedConstant(
    sourcePath: string,
    sourceText: string,
    reference: string
): { sourcePath: string; sourceText: string; document: string } | undefined {
    const importPath = new RegExp(
        String.raw`import\s+\{[\s\S]*?\b${reference}\b[\s\S]*?\}\s+from\s+["']([^"']+)["']`
    ).exec(sourceText)?.[1];
    if (!importPath?.startsWith(".")) return undefined;

    const modulePath = resolve(dirname(sourcePath), importPath);
    for (const candidate of [modulePath, `${modulePath}.ts`, join(modulePath, "index.ts")]) {
        try {
            const importedSource = readFileSync(candidate, "utf8");
            const documentPattern = String.raw`export\s+const\s+${reference}\s*=\s*\x60([\s\S]*?)\x60`;
            const importedDocument = new RegExp(documentPattern).exec(importedSource)?.[1];
            if (importedDocument !== undefined) {
                return {
                    sourcePath: candidate,
                    sourceText: importedSource,
                    document: importedDocument,
                };
            }
        } catch {
            // Try the next TypeScript module resolution candidate.
        }
    }

    return undefined;
}

async function collectTypeScriptFiles(directoryPath: string): Promise<string[]> {
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

async function resolveReferencedDocument(
    sourcePath: string,
    sourceText: string
): Promise<string | undefined> {
    if (/(?:const\s+)?(?:query|mutation)\s*=\s*`/.test(sourceText)) return undefined;

    const reference = /(?:const\s+)?(?:query|mutation)\s*=\s*(\w+)/.exec(sourceText)?.[1];
    if (!reference) return undefined;

    const importPath = new RegExp(
        `import\\s+\\{[\\s\\S]*?\\b${reference}\\b[\\s\\S]*?\\}\\s+from\\s+["']([^"']+)["']`
    ).exec(sourceText)?.[1];
    if (!importPath || !importPath.startsWith(".")) return undefined;

    const modulePath = resolve(dirname(sourcePath), importPath);
    for (const candidate of [modulePath, `${modulePath}.ts`, join(modulePath, "index.ts")]) {
        try {
            const importedSource = await readFile(candidate, "utf8");
            const declarationPattern =
                "export\\s+const\\s+" + reference + "\\s*=\\s*`([\\s\\S]*?)`";
            return new RegExp(declarationPattern).exec(importedSource)?.[1];
        } catch {
            // Try the next TypeScript module resolution candidate.
        }
    }

    return undefined;
}

function extractFallbackMetadata(document: string): ReturnType<typeof extractOperationMetadata> {
    const kind = /\bmutation\b/.test(document) ? "mutation" : "query";
    const variableText = /\b(?:query|mutation)\s*\(([^)]*)\)/.exec(document)?.[1] ?? "";
    const variables = [...variableText.matchAll(/\$(\w+)\s*:\s*([^,)]*)/g)].map((match) => ({
        name: match[1],
        type: match[2].trim(),
        required: match[2].trim().endsWith("!"),
    }));
    const rootMatch = /\{\s*(\w+)\s*(?:\(([^)]*)\))?/.exec(document);
    if (!rootMatch) throw new Error("GraphQL document contains no root field");
    return {
        kind,
        variables,
        selection: [
            {
                name: rootMatch[1],
                arguments: [...(rootMatch[2]?.matchAll(/([A-Za-z_][A-Za-z0-9_]*)\s*:/g) ?? [])].map(
                    (match) => match[1]
                ),
                selection: [],
            },
        ],
    };
}
