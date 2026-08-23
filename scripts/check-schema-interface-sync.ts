/**
 * Consistency checker for the hand-maintained GraphQL selection sets under
 * `src/apis/anilist/schemas/` and their TypeScript counterparts under
 * `src/apis/anilist/interfaces/`.
 *
 * Every response shape exists twice in this package: once as a template-string
 * selection-set constant and once as a TypeScript interface. Nothing in the
 * type system enforces agreement between the two, so this script diffs the
 * TOP-LEVEL field names of each schema constant against the top-level
 * property names of its paired interface and reports every mismatch.
 *
 * Comparison modes (chosen per constant):
 * - Union mode: the selection consists of inline fragments (`... on Member`);
 *   fragment names and their fields are compared against the interface's
 *   member-shaped properties.
 * - Wrapped mode: the selection is a single field with a sub-selection (e.g.
 *   `externalLinks { id url site }`); the inner fields describe the shape and
 *   are compared against the interface properties.
 * - Flat mode: bare field lists are compared directly. When several constants
 *   describe the SAME interface (e.g. `MediaSchema` and
 *   `MediaWithRelationsSchema` both describe `MediaResponse`), their flat
 *   selections are merged before comparing so a partial constant does not
 *   read as drift.
 *
 * Pairing rules (first match wins):
 * 1. Explicit overrides in `PAIR_OVERRIDES` (constants whose derived name is
 *    genuinely ambiguous, e.g. `MediaWithRelationsSchema`, or whose paired
 *    interface name cannot be derived from the constant name at all).
 * 2. Unique case-insensitive match of the constant name minus its `Schema`
 *    suffix against exported interface names (an optional `Response` suffix is
 *    stripped from interface names as well).
 * 3. A file-level mirror: a file containing exactly one constant whose path
 *    mirrors an interface file (e.g. `schemas/responses/query/Staff.ts` pairs
 *    with `interfaces/responses/query/Staff.ts`). When several interfaces
 *    share a normalized name (a shared `Staff` shape versus the response-only
 *    `StaffResponse`), the mirror wins over the name match so response
 *    constants pair with their response interfaces.
 *
 * Usage:
 *   npx tsx scripts/check-schema-interface-sync.ts           # report only
 *   npx tsx scripts/check-schema-interface-sync.ts --strict  # exit 1 on drift
 */
import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import ts from "typescript";

const REPO_ROOT = process.cwd();
const SCHEMAS_DIR = join(REPO_ROOT, "src", "apis", "anilist", "schemas");
const INTERFACES_DIR = join(REPO_ROOT, "src", "apis", "anilist", "interfaces");

/** Constants whose interface cannot be derived from the name alone. */
const PAIR_OVERRIDES: Record<string, string> = {
    MediaWithRelationsSchema: "MediaResponse",
    ActivityWithRepliesSchema: "Activity",
    // `ToggleLikeV2` selects the likeable union (activities, activity replies,
    // threads, thread comments), modelled as the `Likeable` discriminated union.
    ActivitySchemaV2: "Likeable",
    // Union selections whose members live in per-member interfaces rather than
    // in one interface named like the constant.
    NotificationSchema: "NotificationResponse",
    // Response shapes whose plain-name twin (`Staff`, `Studio`) is a smaller
    // shared shape reused by other responses; the file-mirror rule would also
    // find these, but the override keeps the pairing explicit.
    StaffSchema: "StaffResponse",
    StudioSchema: "StudioResponse",
};

/**
 * Constants intentionally left unpaired: reusable stat fragments embedded in
 * larger selection sets (see `schemas/responses/query/User.ts`) rather than
 * standalone response shapes, with no interface twin of their own.
 */
const INTENTIONALLY_UNPAIRED = new Set(["UserAnimeStatsSchema", "UserMangaStatsSchema"]);

interface SchemaConstant {
    name: string;
    filePath: string;
    document: string;
}

interface InterfaceShape {
    name: string;
    filePath: string;
    properties: string[];
    /** Property name -> nested property names for object-literal typed props. */
    nestedProperties: Map<string, string[]>;
    /** Member type names for discriminated-union aliases (`type X = A | B`). */
    unionMembers?: string[];
    /** Target type of a plain alias (`type X = Y`) with no members of its own. */
    aliasTarget?: string;
}

type ParsedSelection =
    | { kind: "field"; name: string; children: ParsedSelection[] }
    | { kind: "fragment"; typeCondition: string; children: ParsedSelection[] };

interface PairDrift {
    constant: string;
    interfaceName: string;
    missingInInterface: string[];
    missingInSchema: string[];
    memberDrift?: Array<{
        member: string;
        missingInInterface: string[];
        missingInSchema: string[];
    }>;
}

function collectTypeScriptFiles(directoryPath: string): string[] {
    const files: string[] = [];
    for (const entry of readdirSync(directoryPath, { withFileTypes: true })) {
        const entryPath = join(directoryPath, entry.name);
        if (entry.isDirectory()) files.push(...collectTypeScriptFiles(entryPath));
        else if (entry.name.endsWith(".ts")) files.push(entryPath);
    }
    return files.sort((left, right) => left.localeCompare(right));
}

function collectSchemaConstants(): SchemaConstant[] {
    const constants: SchemaConstant[] = [];
    for (const filePath of collectTypeScriptFiles(SCHEMAS_DIR)) {
        const sourceText = readFileSync(filePath, "utf8");
        const pattern = /export\s+const\s+(\w+)\s*=\s*`([\s\S]*?)`/g;
        for (const match of sourceText.matchAll(pattern)) {
            constants.push({ name: match[1], filePath, document: match[2] });
        }
    }
    return constants;
}

function extractNestedPropertyNames(typeNode: ts.TypeNode): string[] | undefined {
    let current = typeNode;
    if (ts.isArrayTypeNode(current)) current = current.elementType;
    if (
        ts.isTypeReferenceNode(current) &&
        current.typeName.getText() === "Array" &&
        current.typeArguments?.length === 1
    ) {
        current = current.typeArguments[0];
    }
    if (!ts.isTypeLiteralNode(current)) return undefined;
    return current.members
        .filter(ts.isPropertySignature)
        .map((member) =>
            member.name && ts.isIdentifier(member.name) ? member.name.text : undefined
        )
        .filter((name): name is string => name !== undefined);
}

function collectInterfaceShapes(): InterfaceShape[] {
    const shapes: InterfaceShape[] = [];
    for (const filePath of collectTypeScriptFiles(INTERFACES_DIR)) {
        const sourceText = readFileSync(filePath, "utf8");
        const sourceFile = ts.createSourceFile(filePath, sourceText, ts.ScriptTarget.Latest, true);
        for (const statement of sourceFile.statements) {
            if (ts.isInterfaceDeclaration(statement)) {
                const { properties, nestedProperties } = collectMemberShapes(statement.members);
                shapes.push({
                    name: statement.name.text,
                    filePath,
                    properties,
                    nestedProperties,
                });
                continue;
            }
            if (!ts.isTypeAliasDeclaration(statement)) continue;
            if (ts.isTypeLiteralNode(statement.type)) {
                const { properties, nestedProperties } = collectMemberShapes(
                    statement.type.members
                );
                shapes.push({
                    name: statement.name.text,
                    filePath,
                    properties,
                    nestedProperties,
                });
                continue;
            }
            if (ts.isUnionTypeNode(statement.type)) {
                const unionMembers = statement.type.types
                    .map((type) =>
                        ts.isTypeReferenceNode(type) ? type.typeName.getText() : undefined
                    )
                    .filter((name): name is string => name !== undefined);
                shapes.push({
                    name: statement.name.text,
                    filePath,
                    properties: [],
                    nestedProperties: new Map(),
                    ...(unionMembers.length ? { unionMembers } : {}),
                });
                continue;
            }
            if (ts.isTypeReferenceNode(statement.type)) {
                // Plain alias (`type Thread = ThreadResponse`): the alias has no
                // members of its own; comparisons must resolve through the target.
                shapes.push({
                    name: statement.name.text,
                    filePath,
                    properties: [],
                    nestedProperties: new Map(),
                    aliasTarget: statement.type.typeName.getText(),
                });
            }
        }
    }
    return shapes;
}

function collectMemberShapes(members: ts.NodeArray<ts.TypeElement>): {
    properties: string[];
    nestedProperties: Map<string, string[]>;
} {
    const properties: string[] = [];
    const nestedProperties = new Map<string, string[]>();
    for (const member of members) {
        if (!ts.isPropertySignature(member)) continue;
        if (!member.name || !ts.isIdentifier(member.name) || !member.type) continue;
        properties.push(member.name.text);
        const nested = extractNestedPropertyNames(member.type);
        if (nested) nestedProperties.set(member.name.text, nested);
    }
    return { properties, nestedProperties };
}

function normalizeTypeName(name: string): string {
    return name
        .replace(/Schema$/, "")
        .replace(/Response$/, "")
        .toLowerCase();
}

function mirroredInterfacePath(constant: SchemaConstant, shape: InterfaceShape): boolean {
    return relative(SCHEMAS_DIR, constant.filePath) === relative(INTERFACES_DIR, shape.filePath);
}

function pairConstantsToInterfaces(
    constants: SchemaConstant[],
    shapes: InterfaceShape[]
): Array<{ constant: SchemaConstant; shape?: InterfaceShape }> {
    const shapesByNormalizedName = Map.groupBy(shapes, (shape) => normalizeTypeName(shape.name));
    const constantsPerFile = new Map<string, number>();
    for (const constant of constants) {
        constantsPerFile.set(constant.filePath, (constantsPerFile.get(constant.filePath) ?? 0) + 1);
    }

    return constants.map((constant) => {
        const overrideName = PAIR_OVERRIDES[constant.name];
        if (overrideName) {
            return { constant, shape: shapes.find((shape) => shape.name === overrideName) };
        }
        const candidates = shapesByNormalizedName.get(normalizeTypeName(constant.name)) ?? [];
        if (candidates.length === 1) return { constant, shape: candidates[0] };
        if (candidates.length > 1) {
            // Ambiguous base name: prefer the interface whose file mirrors the
            // constant's location (e.g. Staff vs StaffResponse), falling back
            // to the shortest name so a dedicated `XResponse` beats a broader
            // shared `X` shape when neither location mirrors.
            const mirrored = candidates.find((shape) => mirroredInterfacePath(constant, shape));
            return {
                constant,
                shape:
                    mirrored ??
                    candidates.toSorted((left, right) => left.name.length - right.name.length)[0],
            };
        }
        // File-level mirror for single-constant files (XSchema -> XResponse).
        if ((constantsPerFile.get(constant.filePath) ?? 0) === 1) {
            const mirroredShapes = shapes.filter((shape) => mirroredInterfacePath(constant, shape));
            if (mirroredShapes.length === 1) return { constant, shape: mirroredShapes[0] };
        }
        return { constant };
    });
}

function expandSelectionSet(
    document: string,
    constantsByName: Map<string, SchemaConstant>,
    visited: Set<string>
): { text: string } | { error: string } {
    let expanded = "";
    let cursor = 0;
    for (const match of document.matchAll(/\$\{(\w+)\}/g)) {
        const reference = match[1];
        const referenced = constantsByName.get(reference);
        if (!referenced) return { error: `unresolvable placeholder \${${reference}}` };
        const visitKey = `${reference}@${match.index}`;
        if (visited.has(visitKey)) return { error: `cyclic interpolation of ${reference}` };

        const nested = expandSelectionSet(
            referenced.document,
            constantsByName,
            new Set(visited).add(visitKey)
        );
        if ("error" in nested) return nested;

        const start = match.index ?? 0;
        expanded += document.slice(cursor, start);
        const lineStart = document.lastIndexOf("\n", start) + 1;
        const indentation = /^([ \t]*)/.exec(document.slice(lineStart))?.[1] ?? "";
        expanded += nested.text
            .split("\n")
            .map((line, index) => (index === 0 ? line : indentation + line))
            .join("\n");
        cursor = start + match[0].length;
    }
    expanded += document.slice(cursor);
    return { text: expanded };
}

/**
 * Parses a selection-set body into a tree of fields and inline fragments.
 * Handles aliases, parenthesised arguments, and nested selections.
 */
function parseSelectionBody(body: string): { selection: ParsedSelection[] } | { error: string } {
    const selection: ParsedSelection[] = [];
    let index = 0;
    while (index < body.length) {
        const character = body[index];
        if (/\s|,/.test(character)) {
            index += 1;
            continue;
        }
        if (body.startsWith("...", index)) {
            index += 3;
            // Inline fragments read `... [on] TypeCondition`; `on` is the
            // GraphQL keyword and may be separated by whitespace.
            const condition = /^\s*(?:on\s+)?([A-Za-z_]\w*)/.exec(body.slice(index));
            if (!condition) return { error: "inline fragment without type condition" };
            index += condition.index + condition[0].length;
            const openingBrace = body.indexOf("{", index);
            if (openingBrace < 0) return { error: "inline fragment without selection set" };
            const closingBrace = matchingBrace(body, openingBrace);
            if (closingBrace < 0) return { error: "unbalanced braces in inline fragment" };
            const nested = parseSelectionBody(body.slice(openingBrace + 1, closingBrace));
            if ("error" in nested) return nested;
            selection.push({
                kind: "fragment",
                typeCondition: condition[1],
                children: nested.selection,
            });
            index = closingBrace + 1;
            continue;
        }
        const identifier = /^[A-Za-z_]\w*/.exec(body.slice(index));
        if (!identifier) {
            return { error: `unexpected character "${character}" in selection set` };
        }
        let fieldName = identifier[0];
        index += fieldName.length;

        const alias = /^\s*:\s*([A-Za-z_]\w*)/.exec(body.slice(index));
        if (alias) {
            fieldName = alias[1];
            index += alias.index + alias[0].length;
        }

        const parentheses = /^\s*\(/.exec(body.slice(index));
        if (parentheses) {
            const closingParenthesis = body.indexOf(")", index);
            if (closingParenthesis < 0) return { error: `unbalanced arguments for ${fieldName}` };
            index = closingParenthesis + 1;
        }

        let children: ParsedSelection[] = [];
        const nextMeaningful = /\S/.exec(body.slice(index))?.[0];
        if (nextMeaningful === "{") {
            const openingBrace = body.indexOf("{", index);
            const closingBrace = matchingBrace(body, openingBrace);
            if (closingBrace < 0) return { error: `unbalanced braces for ${fieldName}` };
            const nested = parseSelectionBody(body.slice(openingBrace + 1, closingBrace));
            if ("error" in nested) return nested;
            children = nested.selection;
            index = closingBrace + 1;
        }
        selection.push({ kind: "field", name: fieldName, children });
    }
    return { selection };
}

function matchingBrace(text: string, openingBrace: number): number {
    let depth = 0;
    for (let cursor = openingBrace; cursor < text.length; cursor += 1) {
        if (text[cursor] === "{") depth += 1;
        else if (text[cursor] === "}") {
            depth -= 1;
            if (depth === 0) return cursor;
        }
    }
    return -1;
}

/**
 * Resolves the property names of a union member: either from the paired
 * shape's object-literal properties or from the member's own named shape.
 * Plain aliases (`type Thread = ThreadResponse`) resolve through their target,
 * and union members (`Activity` inside `Likeable`) resolve through their
 * member shapes, so nested unions compare correctly.
 */
function resolveMemberPropertyNames(
    shapesByName: Map<string, InterfaceShape>,
    shape: InterfaceShape,
    memberName: string
): string[] | undefined {
    const direct = shape.nestedProperties.get(memberName);
    if (direct) return direct;
    const memberShape = shapesByName.get(memberName);
    if (!memberShape) return undefined;
    if (memberShape.properties.length) return memberShape.properties;
    if (memberShape.aliasTarget) {
        return shapesByName.get(memberShape.aliasTarget)?.properties;
    }
    if (memberShape.unionMembers?.length) {
        // Nested union member: merge the property sets of all member shapes.
        const merged: string[] = [];
        for (const unionMember of memberShape.unionMembers) {
            for (const property of resolveMemberPropertyNames(
                shapesByName,
                memberShape,
                unionMember
            ) ?? []) {
                if (!merged.includes(property)) merged.push(property);
            }
        }
        return merged;
    }
    return undefined;
}

/** Strips a `query`/`mutation` wrapper, keeping the root operation selection. */
function stripOperationWrapper(expandedText: string): { body: string } | { error: string } {
    const trimmed = expandedText.trim();
    if (!/^(query|mutation|subscription)\b/.test(trimmed)) return { body: trimmed };
    const openingBrace = trimmed.indexOf("{");
    const closingBrace = trimmed.lastIndexOf("}");
    if (openingBrace < 0 || closingBrace <= openingBrace) {
        return { error: "malformed operation wrapper" };
    }
    return { body: trimmed.slice(openingBrace + 1, closingBrace).trim() };
}

interface FieldDiff {
    missingInInterface: string[];
    missingInSchema: string[];
}

function diffFieldNames(selected: string[], declared: string[]): FieldDiff {
    return {
        missingInInterface: selected.filter((field) => !declared.includes(field)),
        missingInSchema: declared.filter((property) => !selected.includes(property)),
    };
}

/**
 * Compares a union selection against its paired shape.
 *
 * Shared-member handling: several selected fragments can be modelled by ONE
 * declared interface (e.g. five activity notification fragments sharing
 * `ActivityNotification`). A fragment counts as that declared member when
 * either its own interface has the same property set, or - when the fragment
 * has no interface of its own - its selected fields equal the member's
 * properties.
 */
function diffUnionSelection(
    shapesByName: Map<string, InterfaceShape>,
    shape: InterfaceShape,
    fragments: Array<Extract<ParsedSelection, { kind: "fragment" }>>
): PairDrift {
    const declaredMembers = shape.unionMembers ?? shape.properties;
    const declaredSet = new Set(declaredMembers);
    const signatureOf = (properties: string[]): string =>
        properties.toSorted((left, right) => left.localeCompare(right)).join("|");

    const memberBySignature = new Map<string, string>();
    for (const member of declaredMembers) {
        const properties = resolveMemberPropertyNames(shapesByName, shape, member);
        if (!properties?.length) continue;
        const signature = signatureOf(properties);
        if (!memberBySignature.has(signature)) {
            memberBySignature.set(signature, member);
        }
    }

    // Nested-union members: a declared member may itself be a union alias
    // (`Likeable` containing `Activity`, which contains `TextActivity`), so a
    // selected fragment typed as the inner member counts as that declared
    // member even though its name never appears in the union directly.
    const memberAliases = new Map<string, string>();
    for (const member of declaredMembers) {
        const memberShape = shapesByName.get(member);
        const innerMembers = memberShape?.unionMembers;
        if (!innerMembers?.length) continue;
        for (const inner of innerMembers) {
            if (!memberAliases.has(inner)) memberAliases.set(inner, member);
            const innerShape = shapesByName.get(inner);
            for (const leaf of innerShape?.unionMembers ?? []) {
                if (!memberAliases.has(leaf)) memberAliases.set(leaf, member);
            }
        }
    }

    // Merge same-member fragments from every constant of the group before
    // comparing: one constant may select a narrow fragment (e.g. the legacy
    // `ActivitySchema` TextActivity without relations) while a sibling constant
    // selects the full member. Merging by type condition keeps the union of all
    // selected fields per member, so the richer fragment is not falsely reported
    // as drift against the poorer one.
    const mergedByCondition = new Map<string, Array<Extract<ParsedSelection, { kind: "field" }>>>();
    for (const fragment of fragments) {
        const children = mergedByCondition.get(fragment.typeCondition) ?? [];
        for (const child of fragment.children) {
            if (!children.some((existing) => existing.name === child.name)) {
                children.push(child);
            }
        }
        mergedByCondition.set(fragment.typeCondition, children);
    }

    const declaredMemberOfFragment = new Map<string, string>();
    for (const [typeCondition, children] of mergedByCondition) {
        if (declaredSet.has(typeCondition)) continue;
        const declaredAlias = memberAliases.get(typeCondition);
        if (declaredAlias) {
            declaredMemberOfFragment.set(typeCondition, declaredAlias);
            continue;
        }
        const ownProperties = resolveMemberPropertyNames(shapesByName, shape, typeCondition);
        const candidate = ownProperties?.length
            ? memberBySignature.get(signatureOf(ownProperties))
            : undefined;
        const byFields = !candidate
            ? memberBySignature.get(signatureOf(children.map((child) => child.name)))
            : undefined;
        const declared = candidate ?? byFields;
        if (declared) declaredMemberOfFragment.set(typeCondition, declared);
    }

    const selectedMemberNames = [...mergedByCondition.keys()];
    const coveredMembers = new Set(
        selectedMemberNames.map((name) => declaredMemberOfFragment.get(name) ?? name)
    );
    const topLevelDiff = {
        missingInInterface: selectedMemberNames.filter(
            (name) => !declaredSet.has(name) && !declaredMemberOfFragment.has(name)
        ),
        missingInSchema: declaredMembers.filter((member) => !coveredMembers.has(member)),
    };

    const memberDrift: NonNullable<PairDrift["memberDrift"]> = [];
    for (const [typeCondition, children] of mergedByCondition) {
        const target = declaredMemberOfFragment.get(typeCondition);
        const effectiveMember = target ?? typeCondition;
        // When a fragment maps to a nested-union alias member (`TextActivity`
        // -> `Activity` inside `Likeable`), compare against the fragment's own
        // interface: the alias resolves to the merged superset of all inner
        // members, which would falsely flag sibling-member fields as never
        // selected.
        const aliasTargetsUnion = Boolean(
            target !== undefined &&
            !shape.nestedProperties.has(target) &&
            shapesByName.get(target)?.unionMembers?.length
        );
        const nested =
            (aliasTargetsUnion ? shapesByName.get(typeCondition)?.properties : undefined) ??
            resolveMemberPropertyNames(shapesByName, shape, effectiveMember);
        if (!nested) continue;
        const memberDiff = diffFieldNames(
            children.map((child) => child.name),
            nested
        );
        if (memberDiff.missingInInterface.length || memberDiff.missingInSchema.length) {
            const member = effectiveMember;
            if (memberDrift.some((entry) => entry.member === member)) continue;
            memberDrift.push({ member, ...memberDiff });
        }
    }

    return {
        constant: "",
        interfaceName: "",
        ...topLevelDiff,
        ...(memberDrift.length ? { memberDrift } : {}),
    };
}

function main(): number {
    const strict = process.argv.includes("--strict");
    const constants = collectSchemaConstants();
    const shapes = collectInterfaceShapes();
    const constantsByName = new Map(constants.map((constant) => [constant.name, constant]));
    const shapesByName = new Map(shapes.map((shape) => [shape.name, shape]));
    const pairs = pairConstantsToInterfaces(constants, shapes);

    const drifts: PairDrift[] = [];
    const skipped: string[] = [];

    // Group constants by their paired interface so several selection sets
    // describing the same shape (e.g. `MediaSchema` and
    // `MediaWithRelationsSchema` both describing `MediaResponse`) are merged
    // before comparing instead of each being diffed in isolation.
    const groups = new Map<string, { shape: InterfaceShape; constants: SchemaConstant[] }>();
    for (const { constant, shape } of pairs) {
        if (!shape) {
            if (INTENTIONALLY_UNPAIRED.has(constant.name)) continue;
            skipped.push(`${constant.name}: no interface candidate found`);
            continue;
        }
        const group = groups.get(shape.name) ?? { shape, constants: [] };
        group.constants.push(constant);
        groups.set(shape.name, group);
    }

    for (const { shape, constants: groupConstants } of groups.values()) {
        const isFragment = (
            node: ParsedSelection
        ): node is Extract<ParsedSelection, { kind: "fragment" }> => node.kind === "fragment";
        const isField = (
            node: ParsedSelection
        ): node is Extract<ParsedSelection, { kind: "field" }> => node.kind === "field";

        let unionFragments: Array<Extract<ParsedSelection, { kind: "fragment" }>> | undefined;
        const flatFields = new Set<string>();
        const nestedSelections = new Map<string, string[]>();

        for (const constant of groupConstants) {
            const expanded = expandSelectionSet(constant.document, constantsByName, new Set());
            if ("error" in expanded) {
                skipped.push(`${constant.name}: ${expanded.error}`);
                continue;
            }
            const stripped = stripOperationWrapper(expanded.text);
            if ("error" in stripped) {
                skipped.push(`${constant.name}: ${stripped.error}`);
                continue;
            }
            const parsed = parseSelectionBody(stripped.body);
            if ("error" in parsed) {
                skipped.push(`${constant.name}: ${parsed.error}`);
                continue;
            }

            let nodes = parsed.selection;
            const singleWrapped =
                nodes.length === 1 && nodes[0].kind === "field" && nodes[0].children.length > 0;
            if (singleWrapped && !shape.properties.includes(nodes[0].name)) {
                // Wrapped mode: the constant selects one field whose
                // sub-selection describes the shape held by the paired
                // interface.
                nodes = (nodes[0] as Extract<ParsedSelection, { kind: "field" }>).children;
            }

            const fragments = nodes.filter(isFragment);
            if (fragments.length > 0 && fragments.length === nodes.length) {
                // Union mode: every top-level node is an inline fragment;
                // accumulate members across all constants of this interface.
                unionFragments = [...(unionFragments ?? []), ...fragments];
                continue;
            }

            let childNodes = nodes;
            const fields = nodes.filter(isField).map((node) => node.name);
            const nestedSingleWrapped =
                childNodes.length === 1 &&
                childNodes[0].kind === "field" &&
                childNodes[0].children.length > 0;
            if (!fragments.length && nestedSingleWrapped && !shape.properties.includes(fields[0])) {
                // Wrapped mode: the constant selects one field whose
                // sub-selection describes the shape held by the paired
                // interface.
                childNodes = (childNodes[0] as Extract<ParsedSelection, { kind: "field" }>)
                    .children;
            }

            for (const node of childNodes) {
                if (node.kind !== "field") continue;
                flatFields.add(node.name);
                if (node.children.length) {
                    nestedSelections.set(
                        node.name,
                        node.children.map((child) => child.name)
                    );
                }
            }
        }

        if (unionFragments) {
            const drift = diffUnionSelection(shapesByName, shape, unionFragments);
            if (
                drift.missingInInterface.length ||
                drift.missingInSchema.length ||
                drift.memberDrift?.length
            ) {
                drifts.push({
                    ...drift,
                    constant: groupConstants.map((entry) => entry.name).join(" + "),
                    interfaceName: shape.name,
                });
            }
            continue;
        }

        const topLevelDiff = diffFieldNames([...flatFields], shape.properties);
        const memberDrift: NonNullable<PairDrift["memberDrift"]> = [];
        for (const [fieldName, children] of nestedSelections) {
            const nested = shape.nestedProperties.get(fieldName);
            if (!nested) continue;
            const memberDiff = diffFieldNames(children, nested);
            if (memberDiff.missingInInterface.length || memberDiff.missingInSchema.length) {
                memberDrift.push({ member: fieldName, ...memberDiff });
            }
        }
        if (
            topLevelDiff.missingInInterface.length ||
            topLevelDiff.missingInSchema.length ||
            memberDrift.length
        ) {
            drifts.push({
                constant: groupConstants.map((entry) => entry.name).join(" + "),
                interfaceName: shape.name,
                ...topLevelDiff,
                ...(memberDrift.length ? { memberDrift } : {}),
            });
        }
    }

    const pairedCount = pairs.filter((pair) => pair.shape).length;
    console.log(`Schema constants scanned: ${constants.length}`);
    console.log(`Interfaces scanned:       ${shapes.length}`);
    console.log(`Pairs compared:           ${pairedCount}`);
    console.log(`Pairs in sync:            ${pairedCount - drifts.length}`);
    console.log(`Pairs drifted:            ${drifts.length}`);
    console.log(`Unpaired/unparsed:        ${skipped.length}`);

    if (drifts.length) {
        console.log("\nDrifted pairs:");
        for (const drift of drifts) {
            console.log(`  ${drift.constant} <-> ${drift.interfaceName}`);
            for (const field of drift.missingInInterface) {
                console.log(`    + ${field} (selected, missing from interface)`);
            }
            for (const property of drift.missingInSchema) {
                console.log(`    - ${property} (declared, never selected)`);
            }
            for (const member of drift.memberDrift ?? []) {
                console.log(`    ~ ${drift.interfaceName}.${member.member}:`);
                for (const field of member.missingInInterface) {
                    console.log(`      + ${field} (selected, missing from interface)`);
                }
                for (const property of member.missingInSchema) {
                    console.log(`      - ${property} (declared, never selected)`);
                }
            }
        }
    }
    if (skipped.length) {
        console.log("\nSkipped constants:");
        for (const entry of skipped) console.log(`  ${entry}`);
    }

    if (strict && (drifts.length || skipped.length)) {
        console.log("\nStrict mode: failing due to drift or unparsed constants.");
        return 1;
    }
    return 0;
}

import { pathToFileURL } from "node:url";

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
    process.exitCode = main();
}
