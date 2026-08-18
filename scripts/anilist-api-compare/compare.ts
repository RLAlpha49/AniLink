import type { IntrospectionField, IntrospectionObjectType, IntrospectionTypeRef } from "graphql";
import type {
    ComparisonResult,
    Discrepancy,
    PackageOperation,
    Schema,
    SelectionNode,
} from "./types";
import type { TypeScriptContracts, TypeScriptProperty } from "./typescript-contracts";

export function comparePackageToSchema(input: {
    schema: Schema;
    operations: PackageOperation[];
    contracts?: TypeScriptContracts;
}): ComparisonResult {
    const types = new Map(input.schema.__schema.types.map((type) => [type.name, type]));
    const discrepancies: Discrepancy[] = [];
    const implemented = new Set<string>();
    const rootTypes = {
        query: input.schema.__schema.queryType?.name,
        mutation: input.schema.__schema.mutationType?.name,
    };

    for (const operation of input.operations) {
        const rootTypeName = rootTypes[operation.kind];
        const rootType = rootTypeName ? types.get(rootTypeName) : undefined;
        const rootField = getField(rootType, operation.rootField);
        if (!rootField) {
            discrepancies.push({
                severity: "error",
                category: "removed-operation",
                operation: operation.exportName,
                sourcePath: operation.sourcePath,
                packageValue: operation.rootField,
                message: `${operation.kind} field ${operation.rootField} is not present in AniList`,
            });
            continue;
        }

        implemented.add(operation.rootField);
        compareArguments(operation, rootField, discrepancies);
        compareSelection(operation, operation.selection, rootField.type, types, discrepancies);
        compareTypeScriptContracts(operation, input.contracts, discrepancies);
    }

    const unimplementedOperations = (["query", "mutation"] as const).flatMap((kind) => {
        const typeName = rootTypes[kind];
        const rootType = typeName ? types.get(typeName) : undefined;
        return (rootType?.fields ?? [])
            .filter((field) => !implemented.has(field.name))
            .map((field) => `${kind}.${field.name}`);
    });

    for (const operation of unimplementedOperations) {
        discrepancies.push({
            severity: "warning",
            category: "unimplemented-operation",
            operation,
            message: `AniList operation ${operation} is not implemented by AniLink`,
        });
    }

    return {
        discrepancies,
        implementedOperations: implemented.size,
        unimplementedOperations,
        warnings: discrepancies.filter((item) => item.severity === "warning"),
    };
}

function compareTypeScriptContracts(
    operation: PackageOperation,
    contracts: TypeScriptContracts | undefined,
    discrepancies: Discrepancy[]
): void {
    if (!contracts) return;

    const variableContract = operation.variableTypeName
        ? contracts.types[operation.variableTypeName]
        : undefined;
    if (variableContract) {
        const variables = new Set(operation.variables.map((variable) => variable.name));
        for (const variable of operation.variables) {
            if (variable.name in variableContract) continue;
            discrepancies.push({
                severity: "error",
                category: "missing-variable-contract",
                operation: operation.exportName,
                sourcePath: operation.sourcePath,
                packageValue: variable.name,
                message: `GraphQL variable ${variable.name} is missing from ${operation.variableTypeName}`,
            });
        }

        for (const propertyName of Object.keys(variableContract)) {
            if (variables.has(propertyName)) continue;
            discrepancies.push({
                severity: "error",
                category: "unused-variable-contract",
                operation: operation.exportName,
                sourcePath: operation.sourcePath,
                packageValue: propertyName,
                message: `${operation.variableTypeName} defines ${propertyName}, but the GraphQL operation does not use it`,
            });
        }
    }

    const responseContract = operation.responseTypeName
        ? contracts.types[operation.responseTypeName]
        : undefined;
    if (responseContract) {
        compareResponseContract(
            operation,
            operation.selection,
            operation.responseTypeName!,
            responseContract,
            contracts,
            discrepancies,
            new Set()
        );
    }
}

function compareResponseContract(
    operation: PackageOperation,
    selection: SelectionNode[],
    responseTypeName: string,
    responseContract: Record<string, TypeScriptProperty>,
    contracts: TypeScriptContracts,
    discrepancies: Discrepancy[],
    visitedTypes: Set<string>
): void {
    if (visitedTypes.has(responseTypeName)) return;
    const nextVisitedTypes = new Set(visitedTypes).add(responseTypeName);

    for (const node of selection) {
        const property = responseContract[node.name];
        if (!property) {
            discrepancies.push({
                severity: "error",
                category: "missing-response-contract-field",
                operation: operation.exportName,
                sourcePath: operation.sourcePath,
                packageValue: node.name,
                message: `Response field ${node.name} is missing from ${responseTypeName}`,
            });
            continue;
        }

        const nestedContract = contracts.types[property.type];
        if (node.selection.length && nestedContract) {
            compareResponseContract(
                operation,
                node.selection,
                property.type,
                nestedContract,
                contracts,
                discrepancies,
                nextVisitedTypes
            );
        }
    }
}

function compareArguments(
    operation: PackageOperation,
    field: IntrospectionField,
    discrepancies: Discrepancy[]
): void {
    const schemaArguments = new Map(field.args.map((argument) => [argument.name, argument]));
    for (const argument of operation.arguments) {
        if (!schemaArguments.has(argument)) {
            discrepancies.push({
                severity: "error",
                category: "missing-argument",
                operation: operation.exportName,
                sourcePath: operation.sourcePath,
                packageValue: argument,
                message: `Argument ${argument} is not present on ${operation.rootField}`,
            });
        }
    }
    for (const variable of operation.variables) {
        const argument = schemaArguments.get(variable.name);
        if (!argument) continue;
        const apiType = printType(argument.type);
        if (apiType !== variable.type) {
            discrepancies.push({
                severity: "error",
                category: "variable-type-mismatch",
                operation: operation.exportName,
                sourcePath: operation.sourcePath,
                packageValue: variable.type,
                apiValue: apiType,
                message: `Variable ${variable.name} has type ${variable.type}; AniList expects ${apiType}`,
            });
        }
    }
}

function compareSelection(
    operation: PackageOperation,
    selection: SelectionNode[],
    typeRef: IntrospectionTypeRef,
    types: Map<string, Schema["__schema"]["types"][number]>,
    discrepancies: Discrepancy[]
): void {
    const objectType = unwrapObject(typeRef, types);
    if (!objectType) return;
    for (const node of selection) {
        const field = getField(objectType, node.name);
        if (!field) {
            discrepancies.push({
                severity: "error",
                category: "missing-response-field",
                operation: operation.exportName,
                sourcePath: operation.sourcePath,
                packageValue: node.name,
                message: `Response field ${node.name} is not present on ${objectType.name}`,
            });
            continue;
        }
        compareSelection(operation, node.selection, field.type, types, discrepancies);
    }
}

function unwrapObject(
    typeRef: IntrospectionTypeRef,
    types: Map<string, Schema["__schema"]["types"][number]>
): IntrospectionObjectType | undefined {
    let current: IntrospectionTypeRef | null = typeRef;
    while (current.kind === "NON_NULL" || current.kind === "LIST") current = current.ofType;
    if (!current.name) return undefined;
    const type = types.get(current.name);
    return type?.kind === "OBJECT" ? type : undefined;
}

function getField(
    type: Schema["__schema"]["types"][number] | undefined,
    name: string
): IntrospectionField | undefined {
    return type?.kind === "OBJECT" || type?.kind === "INTERFACE"
        ? type.fields?.find((field) => field.name === name)
        : undefined;
}

function printType(type: IntrospectionTypeRef): string {
    if (type.kind === "NON_NULL") return `${printType(type.ofType)}!`;
    if (type.kind === "LIST") return `[${printType(type.ofType)}]`;
    return type.name ?? "Unknown";
}
