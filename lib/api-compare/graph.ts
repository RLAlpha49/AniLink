import { parse, type FieldNode, type OperationDefinitionNode } from "graphql";
import type { SelectionNode, VariableDefinition } from "./types";

export function normalizeSelectionSet(document: string): SelectionNode[] {
    const operation = parse(normalizeTemplateDocument(document)).definitions.find(
        (definition): definition is OperationDefinitionNode =>
            definition.kind === "OperationDefinition"
    );
    if (!operation) throw new Error("GraphQL document contains no operation");

    return operation.selectionSet.selections
        .filter((selection): selection is FieldNode => selection.kind === "Field")
        .map((field) => ({
            name: field.name.value,
            ...(field.alias ? { alias: field.alias.value } : {}),
            arguments: field.arguments?.map((argument) => argument.name.value) ?? [],
            selection: field.selectionSet
                ? normalizeSelectionNodes(field.selectionSet.selections)
                : [],
        }));
}

export function extractOperationMetadata(document: string): {
    kind: "query" | "mutation";
    variables: VariableDefinition[];
    selection: SelectionNode[];
} {
    const operation = parse(normalizeTemplateDocument(document)).definitions.find(
        (definition): definition is OperationDefinitionNode =>
            definition.kind === "OperationDefinition"
    );
    if (!operation || operation.operation === "subscription") {
        throw new Error("GraphQL document must contain a query or mutation operation");
    }

    return {
        kind: operation.operation,
        variables: (operation.variableDefinitions ?? []).map((definition) => ({
            name: definition.variable.name.value,
            type: printType(definition.type),
            required: definition.type.kind === "NonNullType",
        })),
        selection: normalizeSelectionNodes(operation.selectionSet.selections),
    };
}

function normalizeTemplateDocument(document: string): string {
    // Package modules interpolate reusable selection constants into template strings.
    // A fragment spread keeps the surrounding operation parseable without guessing
    // the fields hidden inside the TypeScript expression.
    return document.replace(/\$\{[^}]+\}/g, "...PackageSelection");
}

function normalizeSelectionNodes(
    selections: readonly OperationDefinitionNode["selectionSet"]["selections"][number][]
): SelectionNode[] {
    return selections
        .filter((selection): selection is FieldNode => selection.kind === "Field")
        .map((field) => ({
            name: field.name.value,
            ...(field.alias ? { alias: field.alias.value } : {}),
            arguments: field.arguments?.map((argument) => argument.name.value) ?? [],
            selection: field.selectionSet
                ? normalizeSelectionNodes(field.selectionSet.selections)
                : [],
        }));
}

function printType(type: OperationDefinitionNode["variableDefinitions"][number]["type"]): string {
    if (type.kind === "NamedType") return type.name.value;
    if (type.kind === "ListType") return `[${printType(type.type)}]`;
    return `${printType(type.type)}!`;
}
