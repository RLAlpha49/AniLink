import { AniLinkValidationError } from "./AniLinkError";

/**
 * A primitive type name accepted by a variable type mapping.
 */
type PrimitiveTypeName = "string" | "number" | "boolean";

/**
 * A mapping from a variable name to its expected shape.
 *
 * Each value is one of:
 * - A primitive type name such as `"number"` or `"string"`.
 * - An array type name such as `"number[]"` or `"string[]"`.
 * - An allowlist of accepted string values (for example an enum mapping).
 * - A nested object mapping for input objects such as `FuzzyDateInput`.
 *
 * @see {@link VariableTypeMappings}
 */
export type VariableTypeMapping =
    PrimitiveTypeName | `${string}[]` | readonly string[] | { readonly [key: string]: unknown };

/**
 * A map of variable names to their expected shapes.
 *
 * Values are intentionally `unknown` so that plain object literals (whose
 * string values widen to `string`) remain assignable without `as const`.
 *
 * @see {@link VariableTypeMapping}
 */
export type VariableTypeMappings = Readonly<Record<string, unknown>>;

const PRIMITIVES: readonly PrimitiveTypeName[] = ["string", "number", "boolean"];

const isPrimitive = (mapping: unknown): mapping is PrimitiveTypeName =>
    typeof mapping === "string" && (PRIMITIVES as readonly string[]).includes(mapping);

const isArrayType = (mapping: unknown): mapping is `${string}[]` =>
    typeof mapping === "string" && mapping.endsWith("[]");

const isAllowlist = (mapping: unknown): mapping is readonly string[] => Array.isArray(mapping);

const isObjectMapping = (mapping: unknown): mapping is { readonly [key: string]: unknown } =>
    typeof mapping === "object" && mapping !== null && !Array.isArray(mapping);

const describeValue = (value: unknown): string => {
    if (value === null || (typeof value !== "object" && typeof value !== "function")) {
        return String(value);
    }
    try {
        return JSON.stringify(value) ?? String(value);
    } catch {
        return `[${typeof value}]`;
    }
};

const validateValue = (
    path: string,
    value: unknown,
    mapping: unknown,
    errors: string[],
    rejectUnknownKeys: boolean
): void => {
    if (isPrimitive(mapping)) {
        if (typeof value !== mapping) {
            errors.push(`Invalid ${path}: ${describeValue(value)}. Expected type: ${mapping}`);
        }
        return;
    }

    if (isArrayType(mapping)) {
        const elementType = mapping.slice(0, -2);
        if (!Array.isArray(value) || !value.every((element) => typeof element === elementType)) {
            errors.push(`Invalid ${path}: ${describeValue(value)}. Expected type: ${mapping}`);
        }
        return;
    }

    if (isAllowlist(mapping)) {
        if (Array.isArray(value)) {
            value.forEach((item, index) => {
                if (!mapping.includes(item as string)) {
                    errors.push(
                        `Invalid ${path}[${index}]: ${describeValue(item)}. Expected one of: ${mapping.join(", ")}`
                    );
                }
            });
        } else if (!mapping.includes(value as string)) {
            errors.push(
                `Invalid ${path}: ${describeValue(value)}. Expected one of: ${mapping.join(", ")}`
            );
        }
        return;
    }

    if (isObjectMapping(mapping)) {
        if (Array.isArray(value)) {
            value.forEach((item, index) => {
                validateObject(`${path}[${index}]`, item, mapping, errors, rejectUnknownKeys);
            });
        } else {
            validateObject(path, value, mapping, errors, rejectUnknownKeys);
        }
    }
};

const validateObject = (
    path: string,
    value: unknown,
    mapping: { readonly [key: string]: unknown },
    errors: string[],
    rejectUnknownKeys: boolean
): void => {
    if (value === null || typeof value !== "object") {
        errors.push(`Invalid ${path}: ${describeValue(value)}. Expected an object.`);
        return;
    }

    for (const [prop, propValue] of Object.entries(value as Record<string, unknown>)) {
        const expected = mapping[prop];
        if (expected === undefined) {
            if (rejectUnknownKeys) {
                errors.push(`Unknown property: ${path}.${prop}`);
            }
            continue;
        }
        validateValue(`${path}.${prop}`, propValue, expected, errors, rejectUnknownKeys);
    }
};

/**
 * Validates the provided variables against the expected types.
 *
 * Unknown variables and properties are rejected by default; pass
 * `{ rejectUnknownKeys: false }` to ignore them instead. An empty
 * `variables` object is a valid no-op, and validation failures throw an
 * {@link AniLinkValidationError} whose `details` property lists every problem.
 *
 * @param variables - The variables to validate. Each key is the name of a
 * variable and the value is the value of the variable.
 * @param variableTypeMappings - A map of variable names to their expected
 * types. The expected type can be a primitive type name, an array type name,
 * an allowlist of accepted values, or a nested object mapping.
 * @param options - Optional validation behaviour flags. Set
 * `rejectUnknownKeys` to `false` to ignore unknown variable keys and unknown
 * object properties instead of rejecting them.
 * @returns Nothing when every supplied value matches its mapping.
 * @throws An {@link AniLinkValidationError} when a variable does not match its
 * expected type or when a variable or property key is unknown.
 * @see {@link VariableTypeMappings}
 */
export function validateVariables(
    variables: object,
    variableTypeMappings: VariableTypeMappings,
    options?: { readonly rejectUnknownKeys?: boolean }
): void {
    const errors: string[] = [];
    const rejectUnknownKeys = options?.rejectUnknownKeys !== false;

    for (const [variable, value] of Object.entries(variables)) {
        const expectedType = variableTypeMappings[variable];
        if (expectedType === undefined) {
            if (rejectUnknownKeys) {
                errors.push(`Unknown variable: ${variable}`);
            }
            continue;
        }
        validateValue(variable, value, expectedType, errors, rejectUnknownKeys);
    }

    if (errors.length > 0) {
        throw new AniLinkValidationError(errors);
    }
}

/**
 * Enforces the variable requirements of an AniList operation.
 *
 * AniList rejects several query operations at runtime with messages such as
 * "The Media query requires at least 1 argument." even though the GraphQL
 * schema declares every argument as optional. This helper lets each operation
 * describe its real contract so callers fail fast with a local
 * {@link AniLinkValidationError} instead of a remote 400.
 *
 * A variable satisfies a requirement when it is present with a value other
 * than `undefined` and `null`. Requirements are expressed as:
 * - `"one"`: at least one variable must be set.
 * - `"all"`: every listed variable must be set.
 * - `"any"`: at least one of the listed variables must be set.
 * - `"notOnly"`: at least one variable must be set, and at least one set
 *   variable must not appear in `names`.
 *
 * @param variables - The variables the caller passed to the operation.
 * @param requirements - The requirement description for the operation.
 * @param message - The error message describing what the operation needs.
 * @returns Nothing when the requirement is satisfied.
 * @throws An {@link AniLinkValidationError} when the requirements are not met.
 * @see {@link validateVariables}
 */
export function requireVariables(
    variables: object,
    requirements:
        | { kind: "one" }
        | { kind: "all"; names: readonly string[] }
        | { kind: "any"; names: readonly string[] }
        | { kind: "notOnly"; names: readonly string[] },
    message: string
): void {
    const entries = Object.entries(variables);
    const isSet = (value: unknown): boolean => value !== undefined && value !== null;

    let satisfied: boolean;
    switch (requirements.kind) {
        case "one":
            satisfied = entries.some(([, value]) => isSet(value));
            break;
        case "all":
            satisfied = requirements.names.every((name) =>
                isSet((variables as Record<string, unknown>)[name])
            );
            break;
        case "any":
            satisfied = requirements.names.some((name) =>
                isSet((variables as Record<string, unknown>)[name])
            );
            break;
        case "notOnly": {
            const excluded = new Set(requirements.names);
            satisfied = entries.some(([name, value]) => isSet(value) && !excluded.has(name));
            break;
        }
    }

    if (!satisfied) {
        throw new AniLinkValidationError([message]);
    }
}
