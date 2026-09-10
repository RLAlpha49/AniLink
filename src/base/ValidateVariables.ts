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

/**
 * Key pattern whose values must never be echoed into error details. The
 * `pass`, `session`, `otp`, and `bearer` alternatives match as fragments so
 * prefixed shapes like `sessionId` or `passphrase` are covered; none of
 * them collide with real AniList variable names (verified against the
 * full shipped variable set — `pinned` and `private` are the near-misses
 * this pattern deliberately leaves alone).
 */
const SENSITIVE_KEY_PATTERN =
    /token|secret|password|authorization|cookie|credential|api[-_]?key|pass|session|otp|bearer/i;

/**
 * Whether `value` is a plain object literal (or `Object.create(null)`), as
 * opposed to a built-in like `Date`/`Map` or a class instance. Only plain
 * objects and arrays are rebuilt during redaction so exotic objects keep
 * their native `JSON.stringify` rendering (a `Date` stays an ISO string, not
 * `{}`).
 */
const isPlainObject = (value: object): boolean => {
    const proto = Object.getPrototypeOf(value);
    return proto === Object.prototype || proto === null;
};

/**
 * Recursively redacts values under sensitive keys before serialization so a
 * credential nested inside a non-sensitive value (for example
 * `settings.apiToken`) never reaches error details. The last path segment
 * decides: a sensitive key redacts its whole subtree, while a non-sensitive
 * key recurses into its object/array children.
 *
 * Class instances are rebuilt too: `JSON.stringify` renders their own
 * enumerable properties, so a credential on an instance under a
 * non-sensitive path would otherwise survive redaction. Built-ins whose
 * string form carries no nested keys (`Date`, `Map`, `RegExp`, …) pass
 * through unchanged and keep their native rendering.
 *
 * @param key - The property name (or bracketed index) the value sits under.
 * @param value - The value to redact before serialization.
 * @returns The redacted value, or the input when nothing needs redacting.
 */
const redactValue = (key: string, value: unknown): unknown => {
    if (SENSITIVE_KEY_PATTERN.test(key)) {
        return "[REDACTED]";
    }
    if (Array.isArray(value)) {
        return value.map((item) => redactValue(key, item));
    }
    if (value !== null && typeof value === "object" && !isPlainObject(value)) {
        // Non-plain object: a class instance is rebuilt (its own enumerable
        // properties are serialized by JSON.stringify), while a built-in
        // like Date/Map has no own enumerable credential keys and passes
        // through unchanged.
        const entries = Object.entries(value);
        if (entries.length === 0) {
            return value;
        }
        return Object.assign(
            Object.create(Object.getPrototypeOf(value)),
            Object.fromEntries(entries.map(([k, v]) => [k, redactValue(k, v)]))
        );
    }
    if (value !== null && typeof value === "object") {
        return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, redactValue(k, v)]));
    }
    return value;
};

const describeValue = (path: string, value: unknown): string => {
    // Validation errors land in application logs; a value stored under a
    // credential-shaped key is never echoed, even when it fails validation
    // for an unrelated reason (wrong type).
    if (SENSITIVE_KEY_PATTERN.test(path)) {
        return "[REDACTED]";
    }
    if (value === null || (typeof value !== "object" && typeof value !== "function")) {
        return String(value);
    }
    try {
        // Nested credential-shaped keys are redacted before serialization
        // even when the parent path is not sensitive, so a value like
        // `{ apiToken: "..." }` never leaks through the JSON rendering.
        return JSON.stringify(redactValue(path, value)) ?? String(value);
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
            errors.push(
                `Invalid ${path}: ${describeValue(path, value)}. Expected type: ${mapping}`
            );
        }
        return;
    }

    if (isArrayType(mapping)) {
        const elementType = mapping.slice(0, -2);
        if (!Array.isArray(value) || !value.every((element) => typeof element === elementType)) {
            errors.push(
                `Invalid ${path}: ${describeValue(path, value)}. Expected type: ${mapping}`
            );
        }
        return;
    }

    if (isAllowlist(mapping)) {
        if (Array.isArray(value)) {
            value.forEach((item, index) => {
                if (!mapping.includes(item as string)) {
                    errors.push(
                        `Invalid ${path}[${index}]: ${describeValue(`${path}[${index}]`, item)}. Expected one of: ${mapping.join(", ")}`
                    );
                }
            });
        } else if (!mapping.includes(value as string)) {
            errors.push(
                `Invalid ${path}: ${describeValue(path, value)}. Expected one of: ${mapping.join(", ")}`
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
        errors.push(`Invalid ${path}: ${describeValue(path, value)}. Expected an object.`);
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
