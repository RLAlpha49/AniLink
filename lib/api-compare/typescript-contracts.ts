import ts from "typescript";

export interface TypeScriptProperty {
    type: string;
    optional: boolean;
    array: boolean;
}

export interface TypeScriptContracts {
    types: Record<string, Record<string, TypeScriptProperty>>;
    warnings: string[];
}

export function extractTypeScriptContracts(
    sourcePath: string,
    sourceText: string
): TypeScriptContracts {
    const file = ts.createSourceFile(sourcePath, sourceText, ts.ScriptTarget.Latest, true);
    const types: TypeScriptContracts["types"] = {};
    const warnings: string[] = [];

    for (const statement of file.statements) {
        if (!ts.isInterfaceDeclaration(statement) && !ts.isTypeAliasDeclaration(statement))
            continue;
        const name = statement.name.text;
        if (ts.isInterfaceDeclaration(statement)) {
            types[name] = extractMembers(statement.members, warnings, sourcePath);
        } else if (ts.isTypeLiteralNode(statement.type)) {
            types[name] = extractMembers(statement.type.members, warnings, sourcePath);
        }
    }

    return { types, warnings };
}

function extractMembers(
    members: ts.NodeArray<ts.TypeElement>,
    warnings: string[],
    sourcePath: string
): Record<string, TypeScriptProperty> {
    return Object.fromEntries(
        members
            .filter(ts.isPropertySignature)
            .map((member) => {
                const propertyName =
                    member.name && ts.isIdentifier(member.name) ? member.name.text : undefined;
                if (!propertyName || !member.type) return undefined;
                return [
                    propertyName,
                    {
                        ...normalizeType(member.type, warnings, sourcePath, propertyName),
                        optional: Boolean(member.questionToken),
                    },
                ];
            })
            .filter((entry): entry is [string, TypeScriptProperty] => Boolean(entry))
    );
}

function normalizeType(
    type: ts.TypeNode,
    warnings: string[],
    sourcePath: string,
    propertyName: string
): TypeScriptProperty {
    if (ts.isArrayTypeNode(type)) {
        return {
            ...normalizeType(type.elementType, warnings, sourcePath, propertyName),
            array: true,
        };
    }
    if (ts.isUnionTypeNode(type)) {
        const nonNull = type.types.find(
            (item) =>
                item.kind !== ts.SyntaxKind.NullKeyword &&
                item.kind !== ts.SyntaxKind.UndefinedKeyword
        );
        if (nonNull) return normalizeType(nonNull, warnings, sourcePath, propertyName);
    }
    const keywordKinds = new Map<ts.SyntaxKind, string>([
        [ts.SyntaxKind.StringKeyword, "string"],
        [ts.SyntaxKind.NumberKeyword, "number"],
        [ts.SyntaxKind.BooleanKeyword, "boolean"],
        [ts.SyntaxKind.AnyKeyword, "any"],
        [ts.SyntaxKind.UnknownKeyword, "unknown"],
    ]);
    const keyword = keywordKinds.get(type.kind);
    if (keyword) {
        return { type: keyword, optional: false, array: false };
    }
    if (ts.isTypeReferenceNode(type))
        return { type: type.typeName.getText(), optional: false, array: false };

    warnings.push(`${sourcePath}: unsupported TypeScript type for ${propertyName}`);
    return { type: "unknown", optional: false, array: false };
}
