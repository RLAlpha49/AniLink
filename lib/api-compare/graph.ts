import {
    parse,
    type FieldNode,
    type FragmentDefinitionNode,
    type InlineFragmentNode,
    type OperationDefinitionNode,
    type TypeNode,
} from "graphql";
import { INLINE_FRAGMENT_NAME, type SelectionNode, type VariableDefinition } from "./types";

/**
 * `normalizeSelectionSet` parses a GraphQL document into the comparison's
 * {@link SelectionNode} tree, resolving named fragment spreads against their
 * definitions in the same document.
 *
 * Interpolated selection constants (`${Constant}`) are replaced with a
 * `...PackageSelection` spread that carries no definition, so their fields
 * stay skipped — the same behavior the pre-fragment comparison had.
 *
 * @param document - Full GraphQL document text, including fragment definitions.
 * @returns The normalized {@link SelectionNode} tree of the first operation.
 * @throws {Error} When the document contains no operation.
 */
export function normalizeSelectionSet(document: string): SelectionNode[] {
    const parsed = parse(normalizeTemplateDocument(document));
    const operation = parsed.definitions.find(
        (definition): definition is OperationDefinitionNode =>
            definition.kind === "OperationDefinition"
    );
    if (!operation) throw new Error("GraphQL document contains no operation");

    const fragmentDefinitions = collectFragmentDefinitions(document);
    return normalizeSelectionNodes(operation.selectionSet.selections, fragmentDefinitions);
}

/**
 * `extractOperationMetadata` reduces a GraphQL document to the operation
 * facts the comparison needs: its kind, declared {@link VariableDefinition}s,
 * and normalized selection.
 *
 * @param document - Full GraphQL document text, including fragment definitions.
 * @returns The operation kind, variable definitions, and selection tree.
 * @throws {Error} When the document has no query or mutation operation.
 */
export function extractOperationMetadata(document: string): {
    kind: "query" | "mutation";
    variables: VariableDefinition[];
    selection: SelectionNode[];
} {
    const parsed = parse(normalizeTemplateDocument(document));
    const operation = parsed.definitions.find(
        (definition): definition is OperationDefinitionNode =>
            definition.kind === "OperationDefinition"
    );
    if (!operation || operation.operation === "subscription") {
        throw new Error("GraphQL document must contain a query or mutation operation");
    }

    const fragmentDefinitions = collectFragmentDefinitions(document);
    return {
        kind: operation.operation,
        variables: (operation.variableDefinitions ?? []).map((definition) => ({
            name: definition.variable.name.value,
            type: printType(definition.type),
            required: definition.type.kind === "NonNullType",
        })),
        selection: normalizeSelectionNodes(operation.selectionSet.selections, fragmentDefinitions),
    };
}

function normalizeTemplateDocument(document: string): string {
    // Package modules interpolate reusable selection constants into template strings.
    // A fragment spread keeps the surrounding operation parseable without guessing
    // the fields hidden inside the TypeScript expression.
    return document.replace(/\$\{[^}]+\}/g, "...PackageSelection");
}

function normalizeSelectionNodes(
    selections: readonly OperationDefinitionNode["selectionSet"]["selections"][number][],
    fragmentDefinitions: Map<string, FragmentDefinitionNode> = new Map()
): SelectionNode[] {
    return selections.flatMap((selection) => {
        if (selection.kind === "InlineFragment") {
            const fragment = selection as InlineFragmentNode;
            return [
                {
                    name: `${INLINE_FRAGMENT_NAME} ${printTypeCondition(fragment)}`,
                    typeCondition: printTypeCondition(fragment),
                    arguments: [],
                    selection: normalizeSelectionNodes(
                        fragment.selectionSet.selections,
                        fragmentDefinitions
                    ),
                },
            ];
        }
        // Named spreads resolve against definitions in the same document;
        // interpolated placeholders (...PackageSelection) have no definition
        // and stay skipped, matching the pre-fragment behaviour.
        if (selection.kind === "FragmentSpread") {
            const definition = fragmentDefinitions.get(selection.name.value);
            if (!definition) return [];
            return normalizeSelectionNodes(definition.selectionSet.selections, fragmentDefinitions);
        }
        if (selection.kind !== "Field") return [];
        const field = selection as FieldNode;
        return [
            {
                name: field.name.value,
                ...(field.alias ? { alias: field.alias.value } : {}),
                arguments: field.arguments?.map((argument) => argument.name.value) ?? [],
                selection: field.selectionSet
                    ? normalizeSelectionNodes(field.selectionSet.selections, fragmentDefinitions)
                    : [],
            },
        ];
    });
}

function printTypeCondition(fragment: InlineFragmentNode): string {
    if (!fragment.typeCondition) return "";
    return fragment.typeCondition.name.value;
}

/** Collects named fragment definitions from a document, keyed by fragment name. */
function collectFragmentDefinitions(document: string): Map<string, FragmentDefinitionNode> {
    const definitions = new Map<string, FragmentDefinitionNode>();
    for (const definition of parse(normalizeTemplateDocument(document)).definitions) {
        if (definition.kind !== "FragmentDefinition") continue;
        definitions.set(definition.name.value, definition);
    }
    return definitions;
}

function printType(type: TypeNode): string {
    if (type.kind === "NamedType") return type.name.value;
    if (type.kind === "ListType") return `[${printType(type.type)}]`;
    return `${printType(type.type)}!`;
}
