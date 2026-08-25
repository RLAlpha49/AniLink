/**
 * Resolution engine that turns parsed selection sets plus the committed
 * GraphQL introspection snapshot into TypeScript type models.
 *
 * Typing policy:
 * - Property names come from the fragment selection (aliases honored).
 * - Scalar kinds map to `number`/`string`/`boolean`; enums default to `string`.
 * - A sub-selection that is exactly one `${Constant}` interpolation whose
 *   constant generates an exported type becomes a named reference.
 * - Ad-hoc sub-selections become inline object literals, resolved against the
 *   enclosing GraphQL object type at every depth.
 * - Properties are required unless listed in the spec's `optionalFields`,
 *   preserving today's handwritten optionality instead of silently narrowing
 *   it from upstream nullability.
 */
import {
    parseSelectionSet,
    spliceBareInterpolations,
    stripOperationWrapper,
    type FieldNode,
    type FragmentNode,
    type SelectionNode,
} from "./parse";

export interface IntrospectionTypeRef {
    kind: string;
    name?: string | null;
    ofType?: IntrospectionTypeRef | null;
}

export interface IntrospectionField {
    name: string;
    description?: string | null;
    type: IntrospectionTypeRef;
}

export interface IntrospectionType {
    kind: string;
    name: string;
    fields?: IntrospectionField[] | null;
    enumValues?: Array<{ name: string }> | null;
}

export type SchemaIndex = Map<string, IntrospectionType>;

export const DEFAULT_SCALAR_TYPES: Record<string, string> = {
    Int: "number",
    Float: "number",
    String: "string",
    ID: "string",
    Boolean: "boolean",
    FuzzyDateInt: "number",
};

/** Per-field typing override: explicit TS text or a named reference. */
export interface FieldTypeOverride {
    tsType?: string;
    refType?: string;
}

export interface ExportSpec {
    exportedName: string;
    see: string;
    summary: string;
    /** GraphQL object/interface type the selection is resolved against. */
    graphqlType: string;
    /** How to reduce the source document to the target selection. */
    source: {
        /** Schema-fragment constant name (mutually exclusive with `operation`). */
        constant?: string;
        /**
         * Operation file (repo-relative) whose inline `const query/mutation`
         * template literal supplies the document; mutually exclusive with
         * `constant`.
         */
        operation?: { file: string };
        /** Unwrap N wrapping field levels (`title { ... }`). */
        wrapped?: boolean | number;
        /**
         * Strip an operation wrapper (`query (...) { ... }`) before any other
         * reduction.
         */
        unwrappedOperation?: boolean;
        condition?: string;
    };
    /** Union alias members (rendered as `type X = A | B`). */
    unionMembers?: string[];
    fieldTypes?: Record<string, FieldTypeOverride>;
    optionalFields?: string[];
    /**
     * Additional properties appended after the resolved selection, for
     * interfaces that deliberately union sibling selections (e.g. anime and
     * manga statistic blocks sharing one shape). Collisions with resolved
     * property names throw.
     */
    extraProperties?: Array<{ name: string; tsType: string }>;
}

export interface ResolveContext {
    constants: Map<string, string>;
    /** Operation file path -> inline document text (for `source.operation`). */
    operations: Map<string, string>;
    exportsByConstant: Map<string, string>;
    schema: SchemaIndex;
    scalarTypes?: Record<string, string>;
}

export interface PropertyModel {
    name: string;
    tsType: string;
    optional: boolean;
    description?: string;
}

export interface GeneratedType {
    name: string;
    see: string;
    summary: string;
    kind: "interface" | "union";
    properties?: PropertyModel[];
    members?: string[];
    referencedTypes: Set<string>;
}

function unwrapNonNull(typeRef: IntrospectionTypeRef): IntrospectionTypeRef {
    return typeRef.kind === "NON_NULL" && typeRef.ofType ? typeRef.ofType : typeRef;
}

/**
 * Collects every dotted property path reachable from a selection tree, so
 * manifest override keys can be validated against what is actually selected.
 */
function collectSelectionPaths(nodes: SelectionNode[], prefix = ""): Set<string> {
    const paths = new Set<string>();
    for (const node of nodes) {
        if (node.kind !== "field") continue;
        const path = prefix ? `${prefix}.${node.name}` : node.name;
        paths.add(path);
        for (const child of collectSelectionPaths(node.children, path)) paths.add(child);
    }
    return paths;
}

/**
 * Throws when a `fieldTypes` or `optionalFields` key matches no selected
 * property — silent manifest typos would otherwise drop overrides unnoticed.
 */
function validateOverrideKeys(spec: ExportSpec, nodes: SelectionNode[]): void {
    if (!spec.fieldTypes && !spec.optionalFields?.length) return;
    const available = collectSelectionPaths(nodes);
    const unknown: string[] = [];
    for (const key of Object.keys(spec.fieldTypes ?? {})) {
        if (!available.has(key)) unknown.push(key);
    }
    for (const key of spec.optionalFields ?? []) {
        if (!available.has(key)) unknown.push(key);
    }
    if (unknown.length) {
        throw new Error(
            `${spec.exportedName}: override keys match no selected property: ${unknown.join(", ")}`
        );
    }
}

function isList(typeRef: IntrospectionTypeRef): boolean {
    return unwrapNonNull(typeRef).kind === "LIST";
}

function namedTypeOf(typeRef: IntrospectionTypeRef): IntrospectionTypeRef {
    const unwrapped = unwrapNonNull(typeRef);
    if (unwrapped.kind === "LIST") {
        if (!unwrapped.ofType) throw new Error("list type without element type");
        return unwrapNonNull(unwrapped.ofType);
    }
    return unwrapped;
}

interface RenderedSelection {
    text: string;
    referencedTypes: Set<string>;
}

export function resolveExportSpec(spec: ExportSpec, context: ResolveContext): GeneratedType {
    if (spec.unionMembers?.length) {
        return {
            name: spec.exportedName,
            see: spec.see,
            summary: spec.summary,
            kind: "union",
            members: [...spec.unionMembers],
            referencedTypes: new Set(spec.unionMembers),
        };
    }

    let document: string;
    if (spec.source.operation) {
        const operationDocument = context.operations.get(spec.source.operation.file);
        if (operationDocument === undefined) {
            throw new Error(`no operation document collected for ${spec.source.operation.file}`);
        }
        document = operationDocument;
    } else if (spec.source.constant) {
        const constantDocument = context.constants.get(spec.source.constant);
        if (constantDocument === undefined) {
            throw new Error(`unknown schema constant ${spec.source.constant}`);
        }
        document = constantDocument;
    } else {
        throw new Error(`${spec.exportedName}: source needs a constant or an operation file`);
    }

    // Reduction steps compose: strip the operation wrapper first, then peel
    // condition fragments or a single wrapping field.
    const body = /^\s*(?:query|mutation|subscription)\b/.test(document)
        ? stripOperationWrapper(document)
        : document;
    let nodes: SelectionNode[] = parseSelectionSet(body);

    if (spec.source.condition) {
        const fragments = nodes.filter(
            (node): node is FragmentNode =>
                node.kind === "fragment" && node.typeCondition === spec.source.condition
        );
        if (fragments.length !== 1) {
            throw new Error(
                `source of ${spec.exportedName} has no unique "... on ${spec.source.condition}" fragment`
            );
        }
        nodes = fragments[0].children;
    }
    if (spec.source.wrapped) {
        const levels =
            typeof spec.source.wrapped === "number"
                ? spec.source.wrapped
                : spec.source.wrapped
                  ? 1
                  : 0;
        for (let level = 0; level < levels; level += 1) {
            const [only] = nodes;
            if (!only || only.kind !== "field" || only.children.length === 0) {
                throw new Error(
                    `source of ${spec.exportedName} is not ${levels} nested wrapping field(s) for wrapped-mode generation`
                );
            }
            nodes = only.children;
        }
    }

    nodes = spliceBareInterpolations(nodes, context.constants);
    validateOverrideKeys(spec, nodes);

    const graphqlType = context.schema.get(spec.graphqlType);
    if (!graphqlType?.fields) {
        throw new Error(`GraphQL type ${spec.graphqlType} not found in schema snapshot`);
    }
    const referencedTypes = new Set<string>();
    const properties = nodes.map((node) => {
        if (node.kind !== "field") {
            throw new Error(
                `unexpected ${node.kind} node at top level of ${spec.exportedName}; union selections need per-member specs`
            );
        }
        return resolveProperty(node, spec, graphqlType, context, referencedTypes);
    });

    if (spec.extraProperties?.length) {
        const resolvedNames = new Set(properties.map((property) => property.name));
        for (const extra of spec.extraProperties) {
            if (resolvedNames.has(extra.name)) {
                throw new Error(
                    `${spec.exportedName}: extraProperty "${extra.name}" collides with a selected property`
                );
            }
            properties.push({
                name: extra.name,
                tsType: extra.tsType,
                optional: true,
                description: synthesizeDescription(extra.name, extra.tsType, undefined),
            });
        }
    }

    return {
        name: spec.exportedName,
        see: spec.see,
        summary: spec.summary,
        kind: "interface",
        properties,
        referencedTypes,
    };
}

function resolveProperty(
    node: FieldNode,
    spec: ExportSpec,
    parentType: IntrospectionType,
    context: ResolveContext,
    referencedTypes: Set<string>
): PropertyModel {
    const override = spec.fieldTypes?.[node.name];
    const field = parentType.fields?.find((candidate) => candidate.name === node.name);

    if (override?.tsType) {
        return {
            name: node.name,
            tsType: override.tsType,
            optional: false,
            description:
                field?.description ?? synthesizeDescription(node.name, override.tsType, undefined),
        };
    }
    if (override?.refType) {
        referencedTypes.add(override.refType);
        // Preserve the field's GraphQL list type even when the manifest
        // pins a named reference (e.g. activityHistory -> ActivityHistory[]).
        const tsType = field ? wrapList(override.refType, isList(field.type)) : override.refType;
        return {
            name: node.name,
            tsType,
            optional: false,
            description: field?.description ?? synthesizeDescription(node.name, tsType, field),
        };
    }
    if (!field) {
        throw new Error(
            `field "${node.name}" selected by ${spec.exportedName} does not exist on GraphQL type ${parentType.name}`
        );
    }

    // A bare interpolation of a constant that generates an exported type
    // collapses to that named reference, still wrapped in the field's GraphQL
    // list type so `[MediaExternalLink]` stays `ExternalLink[]`.
    if (node.sourceConstant) {
        const exportedName = context.exportsByConstant.get(node.sourceConstant);
        if (exportedName) {
            referencedTypes.add(exportedName);
            return {
                name: node.name,
                tsType: wrapList(exportedName, isList(field.type)),
                optional: spec.optionalFields?.includes(node.name) ?? false,
                description:
                    field.description ?? synthesizeDescription(node.name, exportedName, field),
            };
        }
    }

    const rendered = renderSelectionType(
        node.children,
        field.type,
        node.name,
        spec,
        context,
        referencedTypes
    );
    return {
        name: node.name,
        tsType: rendered.text,
        optional: spec.optionalFields?.includes(node.name) ?? false,
        description: field.description ?? synthesizeDescription(node.name, rendered.text, field),
    };
}

function renderSelectionType(
    children: SelectionNode[],
    typeRef: IntrospectionTypeRef,
    path: string,
    spec: ExportSpec,
    context: ResolveContext,
    referencedTypes: Set<string>
): RenderedSelection {
    const named = namedTypeOf(typeRef);

    let innerText: string;
    if (named.kind === "SCALAR" || named.kind === "ENUM" || children.length === 0) {
        innerText = renderLeaf(named, spec, context);
    } else {
        const parentName = named.name;
        if (!parentName) throw new Error("named GraphQL type without a name");
        const rendered = renderSubSelection(
            children,
            parentName,
            path,
            spec,
            context,
            referencedTypes
        );
        innerText = rendered.text;
        for (const reference of rendered.referencedTypes) referencedTypes.add(reference);
    }

    return { text: wrapList(innerText, isList(typeRef)), referencedTypes };
}

/** Renders list types as `T[]` for plain names and `Array<T>` otherwise. */
function wrapList(inner: string, isListType: boolean): string {
    if (!isListType) return inner;
    return /^[A-Za-z_$][\w$.]*$/.test(inner) ? `${inner}[]` : `Array<${inner}>`;
}

const PRIMITIVE_TYPE_WORDS = new Set(["number", "string", "boolean", "unknown"]);

function humanizeFieldName(name: string): string {
    return name
        .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
        .replace(/_/g, " ")
        .toLowerCase();
}

/**
 * Synthesizes a house-style property description for fields whose snapshot
 * description is missing, so every generated property carries documentation.
 */
function synthesizeDescription(
    name: string,
    renderedType: string,
    field: IntrospectionField | undefined
): string {
    const subject = humanizeFieldName(name);
    if (!field) {
        const base = renderedType.replace(/\[\]$/, "").trim();
        const isListType = renderedType.endsWith("[]");
        if (/^["']/.test(base)) {
            return `\`${name}\` is a literal discriminator value narrowing this ${isListType ? "entry list" : "entry"}.`;
        }
        if (/^[A-Za-z_$][\w$.]*$/.test(base) && !PRIMITIVE_TYPE_WORDS.has(base)) {
            return isListType
                ? `\`${name}\` is a list of \`${base}\` entries representing the ${subject}.`
                : `\`${name}\` is an instance of \`${base}\` representing the ${subject}.`;
        }
        return `\`${name}\` is a ${renderedType} value representing the ${subject}.`;
    }
    const listy = isList(field.type);
    const named = namedTypeOf(field.type);
    if (
        (named.kind === "OBJECT" || named.kind === "INTERFACE" || named.kind === "UNION") &&
        named.name
    ) {
        const base = renderedType
            .replace(/^Array<|>$/g, "")
            .replace(/\[\]$/, "")
            .trim();
        const shown = /^[A-Za-z_$][\w$.]*$/.test(base) ? base : named.name;
        return listy
            ? `\`${name}\` is a list of \`${shown}\` entries representing the ${subject}.`
            : `\`${name}\` is an instance of \`${shown}\` representing the ${subject}.`;
    }
    return `\`${name}\` is a ${renderedType} value representing the ${subject}.`;
}

function renderLeaf(
    named: IntrospectionTypeRef,
    spec: ExportSpec,
    context: ResolveContext
): string {
    const scalarTypes = { ...DEFAULT_SCALAR_TYPES, ...context.scalarTypes };
    if (named.kind === "SCALAR") {
        const mapped = scalarTypes[named.name ?? ""];
        if (!mapped) {
            throw new Error(
                `unknown custom scalar ${named.name} selected by ${spec.exportedName}; add a scalarTypes entry`
            );
        }
        return mapped;
    }
    if (named.kind === "ENUM") return "string";
    throw new Error(
        `field of ${spec.exportedName} selects no sub-fields but resolves to ${named.kind} ${named.name}`
    );
}

interface InlineMember {
    name: string;
    text: string;
    description: string;
}

/** Renders an inline object literal with per-member JSDoc, multiline. */
function renderInlineLiteral(members: InlineMember[]): string {
    const body = members
        .map(
            (member) =>
                `    /**\n     * ${member.description}\n     */\n    ${member.name}: ${member.text};`
        )
        .join("\n\n");
    return `{\n${body}\n}`;
}

/**
 * Renders a sub-selection against its enclosing GraphQL object type. A single
 * interpolation whose constant generates an exported type collapses to that
 * named reference; anything else inlines recursively — always as a multiline,
 * fully documented literal — resolving each level against the corresponding
 * object type from the snapshot.
 */
function renderSubSelection(
    children: SelectionNode[],
    parentTypeName: string,
    path: string,
    spec: ExportSpec,
    context: ResolveContext,
    referencedTypes: Set<string>
): RenderedSelection {
    if (children.length === 1 && children[0].kind === "interpolation") {
        const exportedName = context.exportsByConstant.get(children[0].constant);
        if (exportedName) {
            referencedTypes.add(exportedName);
            return { text: exportedName, referencedTypes };
        }
    }

    const parentType = context.schema.get(parentTypeName);
    if (!parentType?.fields) {
        throw new Error(`GraphQL type ${parentTypeName} not found in schema snapshot`);
    }

    const expandedChildren = spliceBareInterpolations(children, context.constants);
    const members: InlineMember[] = expandedChildren.map((child) => {
        if (child.kind !== "field") {
            throw new Error(
                `nested ${child.kind} inside ${spec.exportedName} needs a fieldTypes override on ${spec.exportedName}`
            );
        }
        const field = parentType.fields?.find((candidate) => candidate.name === child.name);
        if (!field) {
            throw new Error(
                `field "${path}.${child.name}" does not exist on GraphQL type ${parentTypeName} (${spec.exportedName})`
            );
        }
        const childPath = `${path}.${child.name}`;
        const childOverride = spec.fieldTypes?.[childPath];
        if (childOverride?.tsType) {
            return {
                name: child.name,
                text: childOverride.tsType,
                description:
                    field.description ??
                    synthesizeDescription(child.name, childOverride.tsType, undefined),
            };
        }
        if (childOverride?.refType) {
            referencedTypes.add(childOverride.refType);
            const childText = field
                ? wrapList(childOverride.refType, isList(field.type))
                : childOverride.refType;
            return {
                name: child.name,
                text: childText,
                description:
                    field.description ?? synthesizeDescription(child.name, childText, field),
            };
        }
        // Sole interpolation of a constant that generates an exported type
        // collapses to that named reference at any depth.
        if (child.children.length === 1 && child.children[0].kind === "interpolation") {
            const exportedName = context.exportsByConstant.get(child.children[0].constant);
            if (exportedName) {
                referencedTypes.add(exportedName);
                return {
                    name: child.name,
                    text: wrapList(exportedName, isList(field.type)),
                    description:
                        field.description ?? synthesizeDescription(child.name, exportedName, field),
                };
            }
        }
        const rendered = renderSelectionType(
            child.children,
            field.type,
            childPath,
            spec,
            context,
            referencedTypes
        );
        return {
            name: child.name,
            text: rendered.text,
            description:
                field.description ?? synthesizeDescription(child.name, rendered.text, field),
        };
    });

    return { text: renderInlineLiteral(members), referencedTypes };
}
