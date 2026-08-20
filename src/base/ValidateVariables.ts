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
 */
export type VariableTypeMapping =
    PrimitiveTypeName | `${string}[]` | readonly string[] | { readonly [key: string]: unknown };

/**
 * A map of variable names to their expected shapes.
 *
 * Values are intentionally `unknown` so that plain object literals (whose
 * string values widen to `string`) remain assignable without `as const`.
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

const validateValue = (path: string, value: unknown, mapping: unknown, errors: string[]): void => {
    if (isPrimitive(mapping)) {
        if (typeof value !== mapping) {
            errors.push(`Invalid ${path}: ${String(value)}. Expected type: ${mapping}`);
        }
        return;
    }

    if (isArrayType(mapping)) {
        const elementType = mapping.slice(0, -2);
        if (!Array.isArray(value)) {
            errors.push(`Invalid ${path}: ${String(value)}. Expected type: ${mapping}`);
        } else if (!value.every((element) => typeof element === elementType)) {
            errors.push(`Invalid ${path}: ${String(value)}. Expected type: ${mapping}`);
        }
        return;
    }

    if (isAllowlist(mapping)) {
        if (Array.isArray(value)) {
            value.forEach((item, index) => {
                if (!mapping.includes(item as string)) {
                    errors.push(
                        `Invalid ${path}[${index}]: ${String(item)}. Expected one of: ${mapping.join(", ")}`
                    );
                }
            });
        } else if (!mapping.includes(value as string)) {
            errors.push(
                `Invalid ${path}: ${String(value)}. Expected one of: ${mapping.join(", ")}`
            );
        }
        return;
    }

    if (isObjectMapping(mapping)) {
        if (Array.isArray(value)) {
            value.forEach((item, index) => {
                validateObject(`${path}[${index}]`, item, mapping, errors);
            });
        } else {
            validateObject(path, value, mapping, errors);
        }
    }
};

const validateObject = (
    path: string,
    value: unknown,
    mapping: { readonly [key: string]: unknown },
    errors: string[]
): void => {
    if (value === null || typeof value !== "object") {
        errors.push(`Invalid ${path}: ${String(value)}. Expected an object.`);
        return;
    }

    for (const [prop, propValue] of Object.entries(value as Record<string, unknown>)) {
        const expected = mapping[prop];
        if (expected === undefined) {
            continue;
        }
        validateValue(`${path}.${prop}`, propValue, expected, errors);
    }
};

/**
 * Validates the provided variables against the expected types.
 *
 * Unknown variables and properties are ignored, an empty `variables` object is
 * a valid no-op, and validation failures throw an
 * {@link AniLinkValidationError} whose `details` property lists every problem.
 *
 * @param variables - The variables to validate. Each key is the name of a
 * variable and the value is the value of the variable.
 * @param variableTypeMappings - A map of variable names to their expected
 * types. The expected type can be a primitive type name, an array type name,
 * an allowlist of accepted values, or a nested object mapping.
 * @throws An {@link AniLinkValidationError} when a variable does not match its
 * expected type.
 */
export function validateVariables(
    variables: object,
    variableTypeMappings: VariableTypeMappings
): void {
    const errors: string[] = [];

    for (const [variable, value] of Object.entries(variables)) {
        const expectedType = variableTypeMappings[variable];
        if (expectedType === undefined) {
            continue;
        }
        validateValue(variable, value, expectedType, errors);
    }

    if (errors.length > 0) {
        throw new AniLinkValidationError(errors);
    }
}
