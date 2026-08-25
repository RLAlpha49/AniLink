/**
 * Pure orchestration core for interface generation: given the schema-fragment
 * constants, the committed introspection snapshot, and the generation manifest,
 * produces the full file contents for every generated output. Filesystem access
 * lives in the CLI script so this module stays testable.
 */

import { GENERATED_FILE_HEADER, applyGeneratedRegion, renderRegion } from "./emit";
import {
    resolveExportSpec,
    type ExportSpec,
    type IntrospectionType,
    type ResolveContext,
    type SchemaIndex,
} from "./model";

export interface OutputSpec {
    /** Repo-relative output path, e.g. `src/apis/anilist/interfaces/Title.ts`. */
    path: string;
    /**
     * `file` replaces the entire file with generated content (for outputs that
     * own every export in the file); `region` splices a marker-delimited block
     * into the existing file, preserving handwritten sections around it.
     */
    mode: "file" | "region";
    exports: ExportSpec[];
}

export interface BuildInput {
    /** Schema-fragment constant name -> raw template-literal document. */
    schemas: Record<string, string>;
    /** Operation file path (repo-relative) -> inline document text. */
    operations?: Record<string, string>;
    /** Raw introspection JSON (`{ __schema }` or `{ data: { __schema } }`). */
    schemaJson: unknown;
    outputs: OutputSpec[];
    /** Current on-disk contents per output path, for region-mode files. */
    existingContents?: Map<string, string>;
    /** Exported type name -> repo-relative declaring module (with extension). */
    typeLocations?: Map<string, string>;
    /** Extra scalar mappings merged over {@link DEFAULT_SCALAR_TYPES}. */
    scalarTypes?: Record<string, string>;
}

/**
 * Computes the final file contents keyed by output path. Throws with a precise
 * message when a selection cannot be resolved against the snapshot, so drift
 * surfaces at generation time instead of at compile time.
 */
export function buildGeneratedFiles(input: BuildInput): Map<string, string> {
    const constants = new Map(Object.entries(input.schemas));
    const schema = parseSchemaIndex(input.schemaJson);
    const exportsByConstant = collectExportsByConstant(input.outputs);
    const context: ResolveContext = {
        constants,
        operations: new Map(Object.entries(input.operations ?? {})),
        exportsByConstant,
        schema,
        scalarTypes: input.scalarTypes,
    };

    const files = new Map<string, string>();
    for (const output of input.outputs) {
        const types = output.exports.map((spec) => resolveExportSpec(spec, context));
        const referencedTypes = new Set<string>();
        for (const type of types) {
            for (const reference of type.referencedTypes) referencedTypes.add(reference);
        }
        const imports = planImportsWithLocations(
            referencedTypes,
            output.path,
            input.typeLocations ?? new Map()
        );
        const inner = renderRegion(types, imports);
        // applyGeneratedRegion owns ALL marker placement for both modes.
        const content = applyGeneratedRegion(
            output.mode === "region" ? input.existingContents?.get(output.path) ?? "" : "",
            inner
        );
        files.set(output.path, content);
    }
    return files;
}

function parseSchemaIndex(schemaJson: unknown): SchemaIndex {
    const candidate = schemaJson as
        | { __schema?: { types?: unknown }; data?: { __schema?: { types?: unknown } } }
        | undefined;
    const root = candidate?.data?.__schema ?? candidate?.__schema;
    const types = root?.types;
    if (!Array.isArray(types)) throw new Error("invalid introspection JSON: missing __schema.types");
    const index: SchemaIndex = new Map();
    for (const type of types as IntrospectionType[]) {
        if (type?.name) index.set(type.name, type);
    }
    return index;
}

function collectExportsByConstant(outputs: OutputSpec[]): Map<string, string> {
    const map = new Map<string, string>();
    for (const output of outputs) {
        for (const spec of output.exports) {
            // Condition-based member specs share their constant with siblings
            // and are never referenced whole, so they claim nothing.
            if (!spec.source?.constant || spec.source.condition) continue;
            if (map.has(spec.source.constant)) {
                throw new Error(
                    `constant ${spec.source.constant} is claimed by both ${map.get(spec.source.constant)} and ${spec.exportedName}`
                );
            }
            map.set(spec.source.constant, spec.exportedName);
        }
    }
    return map;
}

/**
 * Plans import statements for a generated file from the referenced type names.
 * Same-file references need no import; everything else groups by module
 * specifier in stable order.
 */
export function planImportsWithLocations(
    referencedTypes: Set<string>,
    outputPath: string,
    typeLocations: Map<string, string>
): Array<{ names: string[]; from: string }> {
    const byModule = new Map<string, Set<string>>();
    for (const name of referencedTypes) {
        const location = typeLocations.get(name);
        if (!location || location === outputPath) continue;
        const specifier = relativeSpecifier(outputPath, location);
        const bucket = byModule.get(specifier) ?? new Set<string>();
        bucket.add(name);
        byModule.set(specifier, bucket);
    }
    return [...byModule.entries()]
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([from, names]) => ({ names: [...names], from }));
}

/** POSIX-style relative import specifier between two repo-relative modules. */
export function relativeSpecifier(fromPath: string, toPath: string): string {
    const fromParts = fromPath.split(/[/\\]/).slice(0, -1);
    const toParts = toPath.split(/[/\\]/);
    const fileName = toParts.pop()!.replace(/\.ts$/i, "");
    let common = 0;
    while (
        common < fromParts.length &&
        common < toParts.length &&
        fromParts[common] === toParts[common]
    ) {
        common += 1;
    }
    const up = fromParts.length - common;
    const down = [...toParts.slice(common), fileName];
    if (up === 0) return `./${down.join("/")}`;
    return `${"../".repeat(up)}${down.join("/")}`;
}
