/**
 * Structural parser for the handwritten GraphQL selection-set constants under
 * `src/apis/anilist/schemas/`.
 *
 * Unlike textual expansion, interpolation placeholders (`${Constant}`) are
 * preserved as dedicated nodes so downstream tooling can detect which
 * sub-selections come from a shared constant and emit named TypeScript type
 * references for them.
 */

export interface FieldNode {
    kind: "field";
    name: string;
    children: SelectionNode[];
    /**
     * Set when this field originates from a bare `${Constant}` interpolation
     * of a single-field constant, enabling named-type-reference emission.
     */
    sourceConstant?: string;
}

export interface FragmentNode {
    kind: "fragment";
    typeCondition: string;
    children: SelectionNode[];
}

export interface InterpolationNode {
    kind: "interpolation";
    constant: string;
}

export type SelectionNode = FieldNode | FragmentNode | InterpolationNode;

/**
 * Parses a selection-set body into a tree of fields, inline fragments, and
 * interpolation placeholders. Handles aliases, parenthesised arguments, and
 * arbitrarily nested selections.
 */
export function parseSelectionSet(document: string): SelectionNode[] {
    const { nodes } = parseBody(document);
    return nodes;
}

interface ParseResult {
    nodes: SelectionNode[];
    endIndex: number;
}

function parseBody(body: string): ParseResult {
    const nodes: SelectionNode[] = [];
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
            if (!condition) throw new Error("inline fragment without type condition");
            index += condition.index + condition[0].length;
            const openingBrace = body.indexOf("{", index);
            if (openingBrace < 0) throw new Error("inline fragment without selection set");
            const closingBrace = matchingBrace(body, openingBrace);
            if (closingBrace < 0) throw new Error("unbalanced braces in inline fragment");
            nodes.push({
                kind: "fragment",
                typeCondition: condition[1],
                children: parseBody(body.slice(openingBrace + 1, closingBrace)).nodes,
            });
            index = closingBrace + 1;
            continue;
        }
        if (body.startsWith("${", index)) {
            const closingBrace = body.indexOf("}", index);
            if (closingBrace < 0) throw new Error("unterminated interpolation placeholder");
            nodes.push({ kind: "interpolation", constant: body.slice(index + 2, closingBrace) });
            index = closingBrace + 1;
            continue;
        }
        const identifier = /^[A-Za-z_]\w*/.exec(body.slice(index));
        if (!identifier) {
            throw new Error(`unexpected character "${character}" in selection set`);
        }
        // The identifier before an optional `:` is the GraphQL alias and the
        // property name the response actually carries.
        let fieldName = identifier[0];
        index += fieldName.length;
        const alias = /^\s*:\s*([A-Za-z_]\w*)/.exec(body.slice(index));
        if (alias) index += alias.index + alias[0].length;

        const parentheses = /^\s*\(/.exec(body.slice(index));
        if (parentheses) {
            const closingParenthesis = body.indexOf(")", index);
            if (closingParenthesis < 0) throw new Error(`unbalanced arguments for ${fieldName}`);
            index = closingParenthesis + 1;
        }

        let children: SelectionNode[] = [];
        const nextMeaningful = /\S/.exec(body.slice(index))?.[0];
        if (nextMeaningful === "{") {
            const openingBrace = body.indexOf("{", index);
            const closingBrace = matchingBrace(body, openingBrace);
            if (closingBrace < 0) throw new Error(`unbalanced braces for ${fieldName}`);
            children = parseBody(body.slice(openingBrace + 1, closingBrace)).nodes;
            index = closingBrace + 1;
        }
        nodes.push({ kind: "field", name: fieldName, children });
    }
    return { nodes, endIndex: index };
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
 * Splices bare interpolation placeholders with the parsed selection sets of
 * their referenced constants, recursively. Interpolations that sit inside a
 * field's braces are KEPT as marker nodes so the resolver can collapse them to
 * named TypeScript type references.
 */
export function spliceBareInterpolations(
    nodes: SelectionNode[],
    constantsByName: Map<string, string>,
    visited: Set<string> = new Set()
): SelectionNode[] {
    return nodes.flatMap((node) => spliceNode(node, constantsByName, visited));
}

function spliceNode(
    node: SelectionNode,
    constantsByName: Map<string, string>,
    visited: Set<string>
): SelectionNode[] {
    if (node.kind === "interpolation") {
        const reference = node.constant;
        const document = constantsByName.get(reference);
        if (document === undefined) {
            throw new Error(`unresolvable placeholder \${${reference}}`);
        }
        if (visited.has(reference)) {
            throw new Error(`cyclic interpolation of ${reference}`);
        }
        const nestedVisited = new Set(visited);
        nestedVisited.add(reference);
        const spliced = spliceBareInterpolations(
            parseSelectionSet(document),
            constantsByName,
            nestedVisited
        );
        // A bare interpolation of a SINGLE-field constant keeps that field
        // marked with its origin so the resolver can collapse sub-selections
        // to a named reference instead of inlining them.
        if (spliced.length === 1 && spliced[0].kind === "field") {
            const [field] = spliced;
            return [{ ...field, sourceConstant: reference }];
        }
        return spliced;
    }
    return [
        {
            ...node,
            children: node.children.flatMap((child) =>
                child.kind === "interpolation"
                    ? [child]
                    : spliceNode(child, constantsByName, visited)
            ),
        },
    ];
}

/** Strips a `query`/`mutation` wrapper, keeping the root operation selection body. */
export function stripOperationWrapper(expandedText: string): string {
    const trimmed = expandedText.trim();
    if (!/^(query|mutation|subscription)\b/.test(trimmed)) return trimmed;
    const openingBrace = trimmed.indexOf("{");
    const closingBrace = trimmed.lastIndexOf("}");
    if (openingBrace < 0 || closingBrace <= openingBrace) {
        throw new Error("malformed operation wrapper");
    }
    return trimmed.slice(openingBrace + 1, closingBrace).trim();
}
