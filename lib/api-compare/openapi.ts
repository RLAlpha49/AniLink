import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import prettier from "prettier";
import type { Discrepancy } from "./types";

/**
 * The subset of an OpenAPI 3.0 document the MAL contract comparison needs.
 *
 * Only `openapi`, `info`, `paths`, and `components.schemas` are consumed; any
 * additional members of the upstream document are preserved verbatim in the
 * committed snapshot but ignored by the comparison.
 */
export interface OpenApiDocument {
    openapi: string;
    info?: { title?: string; version?: string };
    paths: Record<string, OpenApiPathItem>;
    components?: { schemas?: Record<string, OpenApiSchema> };
}

/** One path entry with path-level parameters and HTTP operations. */
export interface OpenApiPathItem {
    parameters?: OpenApiParameter[];
    [method: string]: OpenApiOperation | OpenApiParameter[] | undefined;
}

/** One HTTP operation: parameters, an optional request body, and its success response schema. */
export interface OpenApiOperation {
    parameters?: OpenApiParameter[];
    requestBody?: {
        required?: boolean;
        content?: Record<string, { schema?: OpenApiSchema }>;
    };
    responses?: Record<string, { content?: Record<string, { schema?: OpenApiSchema }> }>;
}

/** A path or query parameter declaration. */
export interface OpenApiParameter {
    name: string;
    in: string;
    required?: boolean;
    schema?: OpenApiSchema;
}

/**
 * A JSON Schema node as used inside an OpenAPI document.
 *
 * `allOf` composition, `$ref` pointers, and `properties` maps are the shapes
 * the comparison resolves; everything else is opaque.
 */
export interface OpenApiSchema {
    $ref?: string;
    type?: string;
    format?: string;
    nullable?: boolean;
    "x-optional"?: boolean;
    items?: OpenApiSchema;
    properties?: Record<string, OpenApiSchema>;
    required?: string[];
    allOf?: OpenApiSchema[];
    enum?: unknown[];
}

/** A field contract extracted from a resolved OpenAPI schema. */
export interface OpenApiField {
    /** Field name as it appears in the request or response schema. */
    name: string;
    /** Normalized type: `string`, `number`, `boolean`, `array`, or `object`. */
    type: string;
    /** Whether the field may be absent from a response. */
    optional: boolean;
}

/** A flat, resolved view of one schema: its fields plus nested refs. */
export interface ResolvedSchema {
    /** Fields declared on the schema itself (including `allOf` members). */
    fields: OpenApiField[];
    /** Nested schemas by field name, when a field is a `$ref` or object. */
    nested: Record<string, ResolvedSchema>;
}

/** The lowercase HTTP methods an OpenAPI path item can declare. */
const HTTP_METHODS = new Set(["get", "put", "post", "delete", "options", "head", "patch", "trace"]);

/**
 * Load and validate an OpenAPI snapshot from disk.
 *
 * @param filePath - Path of the committed OpenAPI JSON snapshot.
 * @returns The parsed and structurally validated document.
 * @throws {Error} When the file cannot be read, parsed, or lacks `paths`.
 */
export async function loadOpenApiDocument(filePath: string): Promise<OpenApiDocument> {
    const raw = await readFile(filePath, "utf-8");
    return validateOpenApiDocument(JSON.parse(raw));
}

/**
 * Fetch a provider's OpenAPI document from a page that embeds it inline.
 *
 * Some providers (MyAnimeList among them) do not publish a standalone spec
 * URL; the reference page embeds the document inside its documentation
 * bundle. The document is located by scanning for JSON objects whose first
 * key is `"openapi"` and that parse as a document — the pages also mention
 * `"openapi"` inside their JS bundles, so a plain text search is not enough.
 *
 * @param fetcher - Fetch implementation, injectable for tests.
 * @param url - Reference page URL embedding the document.
 * @returns The parsed and validated OpenAPI document.
 * @throws {Error} When the page cannot be fetched or no embedded spec parses.
 */
export async function fetchOpenApiDocument(
    fetcher: typeof fetch = fetch,
    url: string
): Promise<OpenApiDocument> {
    const response = await fetcher(url, {
        redirect: "follow",
        signal: AbortSignal.timeout(30_000),
    });
    if (!response.ok) {
        throw new Error(`OpenAPI page request failed with HTTP ${response.status} (${url})`);
    }
    const html = await response.text();
    const document = extractEmbeddedOpenApi(html);
    if (!document) {
        throw new Error(`No embedded OpenAPI document found on ${url}`);
    }
    return validateOpenApiDocument(document);
}

/**
 * Write an OpenAPI document to disk as the committed snapshot.
 *
 * The snapshot is formatted with the repository's Prettier configuration so
 * `npm run mal:api:update-schema` output passes `format:check` as-is.
 *
 * @param filePath - Destination snapshot path.
 * @param document - The document to persist.
 * @returns Nothing; writes the snapshot to disk.
 * @throws {Error} When the directory cannot be created or the write fails.
 */
export async function writeOpenApiDocument(
    filePath: string,
    document: OpenApiDocument
): Promise<void> {
    await mkdir(dirname(filePath), { recursive: true });
    const options = (await prettier.resolveConfig(filePath)) ?? {
        tabWidth: 4,
        printWidth: 100,
        endOfLine: "lf",
    };
    const formatted = await prettier.format(`${JSON.stringify(document, null, 2)}\n`, {
        ...options,
        parser: "json",
    });
    const tempPath = `${filePath}.tmp`;
    await writeFile(tempPath, formatted, "utf8");
    await rename(tempPath, filePath);
}

/**
 * Extract an embedded OpenAPI document from a reference-page HTML payload.
 *
 * Scans every JSON object whose first key is `"openapi"`, extracts it with a
 * brace-matching scan that respects string escapes, and returns the first
 * candidate that parses as an OpenAPI document.
 *
 * @param html - The full HTML text of the reference page.
 * @returns The parsed document, or `undefined` when none is found.
 */
export function extractEmbeddedOpenApi(html: string): OpenApiDocument | undefined {
    for (const match of html.matchAll(/\{\s*"openapi"\s*:/g)) {
        const start = match.index;
        const end = findMatchingBrace(html, start);
        if (end < 0) continue;
        try {
            const parsed = JSON.parse(html.slice(start, end + 1)) as OpenApiDocument;
            if (typeof parsed.openapi === "string" && parsed.paths) return parsed;
        } catch {
            // Not the spec root (or a truncated object); try the next candidate.
        }
    }
    return undefined;
}

/**
 * Find the close brace matching the open brace at `start`.
 *
 * @param text - The text to scan.
 * @param start - Index of the opening `{`.
 * @returns The index of the matching `}`, or `-1` when unbalanced.
 */
function findMatchingBrace(text: string, start: number): number {
    let depth = 0;
    let inString = false;
    let escaped = false;
    for (let i = start; i < text.length; i++) {
        const char = text[i];
        if (escaped) {
            escaped = false;
            continue;
        }
        if (char === "\\") {
            escaped = true;
            continue;
        }
        if (char === '"') {
            inString = !inString;
            continue;
        }
        if (inString) continue;
        if (char === "{") depth++;
        else if (char === "}") {
            depth--;
            if (depth === 0) return i;
        }
    }
    return -1;
}

/**
 * Validate that a parsed value is a usable OpenAPI document.
 *
 * @param value - The candidate document.
 * @returns The same document, typed.
 * @throws {Error} When the value is not an object with a `paths` record.
 */
export function validateOpenApiDocument(value: unknown): OpenApiDocument {
    if (!value || typeof value !== "object") {
        throw new Error("Invalid OpenAPI document: expected an object");
    }
    const candidate = value as { openapi?: unknown; paths?: unknown };
    if (typeof candidate.openapi !== "string") {
        throw new Error("Invalid OpenAPI document: missing openapi version");
    }
    if (!candidate.paths || typeof candidate.paths !== "object") {
        throw new Error("Invalid OpenAPI document: missing paths");
    }
    return value as OpenApiDocument;
}

/**
 * Resolve a `$ref` pointer to a component schema.
 *
 * @param document - The document containing the components.
 * @param schema - Schema that may be a `$ref`.
 * @returns The referenced schema, or the input when it is not a `$ref`.
 */
export function dereferenceSchema(document: OpenApiDocument, schema: OpenApiSchema): OpenApiSchema {
    if (!schema.$ref) return schema;
    const name = schema.$ref.split("/").pop()!;
    return document.components?.schemas?.[name] ?? schema;
}

/**
 * Flatten a schema (including `allOf` composition) into its declared fields.
 *
 * `$ref` cycles are cut at the first revisit of a component schema: a
 * recursive upstream schema (a forum topic whose posts reference the topic,
 * say) resolves to its first-level fields instead of recursing until the
 * call stack overflows.
 *
 * @param document - The document providing component schemas.
 * @param schema - The schema to flatten.
 * @param inheritedRefs - Component names already resolved by the callers in
 *   this resolution chain, so nested resolutions share the cycle guard.
 * @returns A resolved view with fields and nested schemas.
 */
export function resolveSchema(
    document: OpenApiDocument,
    schema: OpenApiSchema,
    inheritedRefs?: Set<string>
): ResolvedSchema {
    const fields: OpenApiField[] = [];
    const nested: Record<string, ResolvedSchema> = {};
    const seen = new Set<string>();
    const visitedRefs = inheritedRefs ?? new Set<string>();

    const visit = (node: OpenApiSchema): void => {
        const target = dereferenceSchema(document, node);
        if (target !== node) {
            const refName = node.$ref!.split("/").pop()!;
            if (visitedRefs.has(refName)) return;
            visitedRefs.add(refName);
            visit(target);
            return;
        }
        for (const member of target.allOf ?? []) {
            visit(member);
        }
        for (const [name, property] of Object.entries(target.properties ?? {})) {
            if (seen.has(name)) continue;
            seen.add(name);
            fields.push({
                name,
                type: schemaFieldType(property),
                optional: isOptionalField(property),
            });
            if (schemaFieldType(property) === "object" || schemaFieldType(property) === "array") {
                const nestedSchema = nestedSchemaOf(property);
                if (nestedSchema) {
                    nested[name] = resolveSchema(document, nestedSchema, new Set(visitedRefs));
                }
            }
        }
    };

    visit(schema);
    return { fields, nested };
}

/**
 * Determine the normalized type of a property schema.
 *
 * @param schema - The property schema.
 * @returns `string`, `number`, `boolean`, `array`, or `object`.
 */
function schemaFieldType(schema: OpenApiSchema): string {
    if (schema.type === "array") return "array";
    if (schema.type === "integer" || schema.type === "number") return "number";
    if (schema.type === "boolean") return "boolean";
    if (schema.type === "string") return "string";
    return "object";
}

/**
 * Determine whether a property may be absent from a response.
 *
 * A field is optional when it is explicitly nullable, marked `x-optional`
 * (MAL's convention for fields the API may omit), or has no `type`/`$ref`
 * declaration at all.
 *
 * @param schema - The property schema.
 * @returns Whether the field is optional.
 */
function isOptionalField(schema: OpenApiSchema): boolean {
    if (schema.nullable === true || schema["x-optional"] === true) return true;
    return schema.type === undefined && schema.$ref === undefined;
}

/**
 * Resolve the schema a property's value lives in.
 *
 * For arrays this is the `items` schema; for objects and `$ref`s it is the
 * property itself. `allOf` wrappers are unwrapped first.
 *
 * @param schema - The property schema.
 * @returns The nested schema, or `undefined` when none is declared.
 */
function nestedSchemaOf(schema: OpenApiSchema): OpenApiSchema | undefined {
    if (schema.type === "array") return schema.items;
    if (schema.$ref || schema.properties || schema.allOf) return schema;
    return undefined;
}

/**
 * A TypeScript contract of one provider response or request-body type.
 *
 * Keyed by the interface names the provider's REST surface declares in its
 * `types.ts`.
 */
export interface RestTypeContract {
    /** Interface name, e.g. `MalAnime`. */
    name: string;
    /** Source path the interface was extracted from. */
    sourcePath: string;
    /** Declared fields by name. */
    fields: Record<string, { type: string; optional: boolean; array: boolean }>;
}

/** One package request parameter expected on a mapped endpoint. */
export interface RestRequestParameter {
    /** Parameter name sent by the package. */
    name: string;
    /** OpenAPI parameter location. */
    in: "path" | "query";
    /** Normalized package type: `string`, `number`, `boolean`, `array`, or `object`. */
    type: string;
    /** Property in the extracted package params interface, when applicable. */
    sourceProperty?: string;
    /** Whether the package params interface allows this property to be omitted. */
    optional?: boolean;
}

/** The package request shape expected for one mapped endpoint. */
export interface RestEndpointRequestContract {
    /** Query and path parameters sent by the package. */
    parameters: RestRequestParameter[];
    /** Extracted TypeScript interface that defines operation parameters. */
    paramsTypeName?: string;
    /** Common parameters documented outside the operation's OpenAPI declaration. */
    commonParameters?: RestRequestParameter[];
    /** Extracted TypeScript interface for a form or JSON request body. */
    requestBodyTypeName?: string;
    /** Content type the package sends for the request body. */
    requestBodyContentType?: string;
    /** Wire types for body fields whose serialization changes their input type. */
    bodyFieldTypeOverrides?: Record<string, string>;
}

/** One package-type-to-endpoint mapping under comparison. */
export interface RestEndpointMapping {
    /** The package interface name, e.g. `MalAnime`; omit for coverage-only
     * mappings of endpoints whose package methods return `void`. */
    typeName?: string;
    /** The OpenAPI path, e.g. `/anime/{anime_id}`. */
    path: string;
    /** The lowercase HTTP method. */
    method: string;
    /** Compare against the schema's `data` array items instead of the list itself. */
    dataItems?: boolean;
    /** Expected package request contract, shared by mappings for the same endpoint. */
    requestContract?: RestEndpointRequestContract;
}

/** The comparison input: a spec document plus the package's type contracts. */
export interface RestContractComparisonInput {
    /** The OpenAPI document to compare against. */
    document: OpenApiDocument;
    /** The package's response and request-body contracts, keyed by interface name. */
    contracts: Record<string, RestTypeContract>;
    /** Mappings of package type to endpoint. */
    endpoints: RestEndpointMapping[];
}

/** The result of a REST contract comparison. */
export interface RestContractComparisonResult {
    /** Every discrepancy found, in mapping order. */
    discrepancies: Discrepancy[];
    /** Number of package types verified against the spec. */
    verifiedTypes: number;
    /** Spec endpoints the package wraps. */
    implementedEndpoints: string[];
    /** Spec endpoints no package type maps to. */
    unimplementedEndpoints: string[];
}

/**
 * Compare a package's REST type contracts against an OpenAPI spec.
 *
 * Compares mapped response fields and request parameter/body names, types, and
 * requiredness against the OpenAPI document. It also checks endpoint coverage so unwrapped
 * upstream endpoints surface as warnings, including endpoints represented by
 * coverage-only mappings that omit `typeName` for void-returning methods.
 *
 * @param input - The spec document, package contracts, and endpoint mappings.
 * @returns All discrepancies plus verified-type and endpoint-coverage counts.
 */
export function compareRestContracts(
    input: RestContractComparisonInput
): RestContractComparisonResult {
    const discrepancies: Discrepancy[] = [];
    let verifiedTypes = 0;
    const checkedRequestEndpoints = new Set<string>();
    const reportedRemovedEndpoints = new Set<string>();

    for (const mapping of input.endpoints) {
        const pathItem = input.document.paths[mapping.path];
        const candidateOperation = pathItem?.[mapping.method];
        const operation =
            candidateOperation && !Array.isArray(candidateOperation)
                ? candidateOperation
                : undefined;
        const endpoint = `${mapping.method.toUpperCase()} ${mapping.path}`;
        if (!operation) {
            if (!reportedRemovedEndpoints.has(endpoint)) {
                reportedRemovedEndpoints.add(endpoint);
                discrepancies.push({
                    severity: "error",
                    category: "removed-endpoint",
                    operation: mapping.typeName ?? endpoint,
                    apiValue: endpoint,
                    message: `Endpoint ${endpoint} is not present in the spec`,
                });
            }
            continue;
        }

        if (mapping.requestContract && operation && !checkedRequestEndpoints.has(endpoint)) {
            checkedRequestEndpoints.add(endpoint);
            compareRequestContract(
                input.document,
                pathItem!,
                operation,
                mapping.requestContract,
                endpoint,
                input.contracts,
                discrepancies
            );
        }

        // Coverage-only mapping: the package wraps the endpoint with a
        // void-returning method, so there is no response contract to verify.
        if (!mapping.typeName) continue;
        const contract = input.contracts[mapping.typeName];
        if (!contract) {
            discrepancies.push({
                severity: "warning",
                category: "missing-type-contract",
                operation: mapping.typeName,
                message: `No TypeScript contract found for ${mapping.typeName}`,
            });
            continue;
        }

        const responseSchema = operation.responses?.["200"];
        const schema =
            responseSchema?.content?.["*/*"]?.schema ??
            responseSchema?.content?.["application/json"]?.schema;
        if (!schema) {
            discrepancies.push({
                severity: "error",
                category: "missing-response-schema",
                operation: mapping.typeName,
                apiValue: `${mapping.method.toUpperCase()} ${mapping.path}`,
                message: `No 200 response schema declared for ${mapping.method.toUpperCase()} ${mapping.path}`,
            });
            continue;
        }

        const listResolved = resolveSchema(input.document, schema);
        const resolved = mapping.dataItems ? listResolved.nested.data : listResolved;
        if (mapping.dataItems && !resolved) {
            discrepancies.push({
                severity: "error",
                category: "missing-response-schema",
                operation: mapping.typeName,
                apiValue: `${mapping.method.toUpperCase()} ${mapping.path}`,
                message: `Response schema for ${mapping.method.toUpperCase()} ${mapping.path} has no data array items to compare ${mapping.typeName} against`,
            });
            continue;
        }
        verifiedTypes++;
        const specFields = new Map(resolved.fields.map((field) => [field.name, field]));

        for (const [fieldName, field] of Object.entries(contract.fields)) {
            const specField = specFields.get(fieldName);
            if (!specField) {
                discrepancies.push({
                    severity: "error",
                    category: "missing-response-field",
                    operation: mapping.typeName,
                    sourcePath: contract.sourcePath,
                    packageValue: fieldName,
                    message: `Response field ${fieldName} is not present in the upstream contract for ${mapping.method.toUpperCase()} ${mapping.path}`,
                });
                continue;
            }
            const packageType = normalizePackageType(field);
            if (packageType !== "unknown" && packageType !== specField.type) {
                discrepancies.push({
                    severity: "error",
                    category: "field-type-mismatch",
                    operation: mapping.typeName,
                    sourcePath: contract.sourcePath,
                    packageValue: `${fieldName}: ${packageType}`,
                    apiValue: `${fieldName}: ${specField.type}`,
                    message: `Field ${fieldName} is ${packageType} in ${mapping.typeName}; the spec declares ${specField.type}`,
                });
            }
        }
    }

    const { implemented, unimplemented } = endpointCoverage(input);
    for (const endpoint of unimplemented) {
        discrepancies.push({
            severity: "warning",
            category: "unimplemented-endpoint",
            operation: endpoint,
            message: `Spec endpoint ${endpoint} is not implemented by the package`,
        });
    }

    return {
        discrepancies,
        verifiedTypes,
        implementedEndpoints: implemented,
        unimplementedEndpoints: unimplemented,
    };
}

/** Compare one mapped package request shape with its OpenAPI operation. */
function compareRequestContract(
    document: OpenApiDocument,
    pathItem: OpenApiPathItem,
    operation: OpenApiOperation,
    requestContract: RestEndpointRequestContract,
    endpoint: string,
    contracts: Record<string, RestTypeContract>,
    discrepancies: Discrepancy[]
): void {
    const apiParameters = new Map<string, OpenApiParameter>();
    const commonParameters = new Map(
        (requestContract.commonParameters ?? []).map((parameter) => [
            `${parameter.in}:${parameter.name}`,
            parameter,
        ])
    );
    for (const parameter of pathItem.parameters ?? []) {
        apiParameters.set(`${parameter.in}:${parameter.name}`, parameter);
    }
    for (const parameter of operation.parameters ?? []) {
        apiParameters.set(`${parameter.in}:${parameter.name}`, parameter);
    }

    const paramsContract = requestContract.paramsTypeName
        ? contracts[requestContract.paramsTypeName]
        : undefined;
    if (requestContract.paramsTypeName && !paramsContract) {
        discrepancies.push({
            severity: "error",
            category: "parameter-mismatch",
            operation: endpoint,
            packageValue: requestContract.paramsTypeName,
            apiValue: "missing TypeScript parameter contract",
            message: `No TypeScript parameter contract found for ${requestContract.paramsTypeName}`,
        });
    }

    const bodyContract = requestContract.requestBodyTypeName
        ? contracts[requestContract.requestBodyTypeName]
        : undefined;
    if (requestContract.requestBodyTypeName && !bodyContract) {
        discrepancies.push({
            severity: "error",
            category: "parameter-mismatch",
            operation: endpoint,
            packageValue: requestContract.requestBodyTypeName,
            apiValue: "missing TypeScript request-body contract",
            message: `No TypeScript request-body contract found for ${requestContract.requestBodyTypeName}`,
        });
    }

    const mappedParameterKeys = new Set<string>();
    const mappedSourceProperties = new Set<string>();
    for (const packageParameter of requestContract.parameters) {
        const key = `${packageParameter.in}:${packageParameter.name}`;
        mappedParameterKeys.add(key);
        const sourceField = packageParameter.sourceProperty
            ? paramsContract?.fields[packageParameter.sourceProperty]
            : undefined;
        if (packageParameter.sourceProperty) {
            mappedSourceProperties.add(packageParameter.sourceProperty);
            if (!requestContract.paramsTypeName) {
                discrepancies.push({
                    severity: "error",
                    category: "parameter-mismatch",
                    operation: endpoint,
                    packageValue: packageParameter.sourceProperty,
                    apiValue: "no TypeScript parameter type configured",
                    message: `Request parameter ${packageParameter.sourceProperty} has no TypeScript params interface for ${endpoint}`,
                });
            } else if (paramsContract && !sourceField) {
                discrepancies.push({
                    severity: "error",
                    category: "parameter-mismatch",
                    operation: endpoint,
                    packageValue: packageParameter.sourceProperty,
                    apiValue: `not declared in ${requestContract.paramsTypeName}`,
                    message: `Request parameter property ${packageParameter.sourceProperty} is not declared in ${requestContract.paramsTypeName}`,
                });
            }
        }

        const apiParameter = apiParameters.get(key);
        const commonParameter = commonParameters.get(key);
        if (!apiParameter && !commonParameter) {
            discrepancies.push({
                severity: "error",
                category: "parameter-mismatch",
                operation: endpoint,
                packageValue: `${packageParameter.in} ${packageParameter.name}: ${packageParameter.type}`,
                apiValue: "not declared",
                message: `Request parameter ${packageParameter.in} ${packageParameter.name} is not declared for ${endpoint}`,
            });
            continue;
        }

        const extractedType = sourceField ? normalizePackageType(sourceField) : "unknown";
        const packageType = extractedType === "unknown" ? packageParameter.type : extractedType;
        const apiType = apiParameter?.schema
            ? schemaFieldType(apiParameter.schema)
            : (commonParameter?.type ?? "unknown");
        if (
            packageType !== "unknown" &&
            apiType !== "unknown" &&
            packageType !== apiType
        ) {
            discrepancies.push({
                severity: "error",
                category: "parameter-mismatch",
                operation: endpoint,
                packageValue: `${packageParameter.in} ${packageParameter.name}: ${packageType}`,
                apiValue: apiParameter
                    ? `${apiParameter.in} ${apiParameter.name}: ${apiType}`
                    : `common ${commonParameter!.in} ${commonParameter!.name}: ${apiType}`,
                message: `Request parameter ${packageParameter.name} is ${packageParameter.type} in the package; ${apiParameter ? "the spec" : "the common API contract"} declares ${apiType}`,
            });
        }

        const packageParameterOptional =
            sourceField?.optional ?? packageParameter.optional ?? true;
        if (
            apiParameter &&
            isRequiredParameter(apiParameter) &&
            packageParameterOptional
        ) {
            discrepancies.push({
                severity: "error",
                category: "parameter-mismatch",
                operation: endpoint,
                packageValue: `${packageParameter.in} ${packageParameter.name}: optional in the package`,
                apiValue: `${packageParameter.in} ${packageParameter.name}: required`,
                message: `Required request parameter ${packageParameter.name} is optional in the package contract for ${endpoint}`,
            });
        }
    }

    for (const apiParameter of apiParameters.values()) {
        const key = `${apiParameter.in}:${apiParameter.name}`;
        if (
            !isRequiredParameter(apiParameter) ||
            mappedParameterKeys.has(key) ||
            commonParameters.has(key)
        ) {
            continue;
        }
        const apiType = apiParameter.schema ? schemaFieldType(apiParameter.schema) : "unknown";
        discrepancies.push({
            severity: "error",
            category: "parameter-mismatch",
            operation: endpoint,
            packageValue: "not declared",
            apiValue: `${apiParameter.in} ${apiParameter.name}: ${apiType} (required)`,
            message: `Required request parameter ${apiParameter.name} is not declared by the package for ${endpoint}`,
        });
    }

    if (!requestContract.requestBodyTypeName) {
        if (operation.requestBody?.required) {
            discrepancies.push({
                severity: "error",
                category: "parameter-mismatch",
                operation: endpoint,
                packageValue: "no request-body contract",
                apiValue: "required request body",
                message: `Required request body is not declared by the package for ${endpoint}`,
            });
        }
        reportUnmappedParameterProperties(
            paramsContract,
            mappedSourceProperties,
            new Set(),
            requestContract.paramsTypeName,
            endpoint,
            discrepancies
        );
        return;
    }

    if (!bodyContract) {
        reportUnmappedParameterProperties(
            paramsContract,
            mappedSourceProperties,
            new Set(),
            requestContract.paramsTypeName,
            endpoint,
            discrepancies
        );
        return;
    }

    const bodyContentType = requestContract.requestBodyContentType;
    const bodyContent = bodyContentType
        ? operation.requestBody?.content?.[bodyContentType]
        : Object.values(operation.requestBody?.content ?? {}).find((content) => content.schema);
    const bodySchema = bodyContent?.schema;
    if (!bodySchema) {
        discrepancies.push({
            severity: "error",
            category: "parameter-mismatch",
            operation: endpoint,
            packageValue: requestContract.requestBodyTypeName,
            apiValue: bodyContentType
                ? `no ${bodyContentType} request body schema`
                : "no request body schema",
            message: bodyContentType
                ? `No ${bodyContentType} request body schema is declared for ${endpoint}`
                : `No request body schema is declared for ${endpoint}`,
        });
        reportUnmappedParameterProperties(
            paramsContract,
            mappedSourceProperties,
            new Set(Object.keys(bodyContract.fields)),
            requestContract.paramsTypeName,
            endpoint,
            discrepancies
        );
        return;
    }

    const requiredBodyFields = requiredSchemaFields(document, bodySchema);
    for (const fieldName of requiredBodyFields) {
        const packageField = bodyContract.fields[fieldName];
        if (packageField && !packageField.optional) continue;
        discrepancies.push({
            severity: "error",
            category: "parameter-mismatch",
            operation: endpoint,
            sourcePath: bodyContract.sourcePath,
            packageValue: packageField
                ? `body.${fieldName}: optional`
                : `body.${fieldName}: not declared`,
            apiValue: `body.${fieldName}: required`,
            message: `Required request-body field ${fieldName} is not required by the package contract for ${endpoint}`,
        });
    }

    const apiFields = new Map(
        resolveSchema(document, bodySchema).fields.map((field) => [field.name, field])
    );
    for (const [fieldName, field] of Object.entries(bodyContract.fields)) {
        const apiField = apiFields.get(fieldName);
        if (!apiField) {
            discrepancies.push({
                severity: "error",
                category: "parameter-mismatch",
                operation: endpoint,
                sourcePath: bodyContract.sourcePath,
                packageValue: `body.${fieldName}`,
                apiValue: "not declared",
                message: `Request-body field ${fieldName} is not declared for ${endpoint}`,
            });
            continue;
        }

        const packageType =
            requestContract.bodyFieldTypeOverrides?.[fieldName] ?? normalizePackageType(field);
        if (packageType !== "unknown" && packageType !== apiField.type) {
            discrepancies.push({
                severity: "error",
                category: "parameter-mismatch",
                operation: endpoint,
                sourcePath: bodyContract.sourcePath,
                packageValue: `body.${fieldName}: ${packageType}`,
                apiValue: `body.${fieldName}: ${apiField.type}`,
                message: `Request-body field ${fieldName} is ${packageType} in the package; the spec declares ${apiField.type}`,
            });
        }
    }

    reportUnmappedParameterProperties(
        paramsContract,
        mappedSourceProperties,
        new Set(Object.keys(bodyContract.fields)),
        requestContract.paramsTypeName,
        endpoint,
        discrepancies
    );
}

function isRequiredParameter(parameter: OpenApiParameter): boolean {
    return parameter.required === true || parameter.in === "path";
}

function reportUnmappedParameterProperties(
    paramsContract: RestTypeContract | undefined,
    mappedProperties: Set<string>,
    bodyProperties: Set<string>,
    paramsTypeName: string | undefined,
    endpoint: string,
    discrepancies: Discrepancy[]
): void {
    if (!paramsContract) return;
    for (const propertyName of Object.keys(paramsContract.fields)) {
        if (mappedProperties.has(propertyName) || bodyProperties.has(propertyName)) continue;
        discrepancies.push({
            severity: "error",
            category: "parameter-mismatch",
            operation: endpoint,
            sourcePath: paramsContract.sourcePath,
            packageValue: `parameter ${propertyName}`,
            apiValue: "not mapped to a request parameter or body field",
            message: `Request params property ${propertyName} in ${paramsTypeName} is not mapped for ${endpoint}`,
        });
    }
}

function requiredSchemaFields(document: OpenApiDocument, schema: OpenApiSchema): Set<string> {
    const required = new Set<string>();
    const visitedRefs = new Set<string>();

    const visit = (node: OpenApiSchema): void => {
        const target = dereferenceSchema(document, node);
        if (target !== node) {
            const refName = node.$ref!.split("/").pop()!;
            if (visitedRefs.has(refName)) return;
            visitedRefs.add(refName);
            visit(target);
            return;
        }
        for (const fieldName of target.required ?? []) required.add(fieldName);
        for (const member of target.allOf ?? []) visit(member);
    };

    visit(schema);
    return required;
}

/**
 * Compute which spec endpoints the package maps, and which it does not.
 *
 * @param input - The spec document, package contracts, and endpoint mappings.
 * @returns The implemented and unimplemented `METHOD /path` identifiers.
 */
function endpointCoverage(input: RestContractComparisonInput): {
    implemented: string[];
    unimplemented: string[];
} {
    const mapped = new Set(
        input.endpoints.map((mapping) => `${mapping.method.toUpperCase()} ${mapping.path}`)
    );
    const implemented: string[] = [];
    const unimplemented: string[] = [];
    for (const [path, item] of Object.entries(input.document.paths)) {
        for (const method of Object.keys(item)) {
            if (!HTTP_METHODS.has(method)) continue;
            const endpoint = `${method.toUpperCase()} ${path}`;
            if (mapped.has(endpoint)) {
                implemented.push(endpoint);
            } else {
                unimplemented.push(endpoint);
            }
        }
    }
    return { implemented, unimplemented };
}

/**
 * Normalize a package field type to the comparison's type vocabulary.
 *
 * @param field - The extracted package field.
 * @returns `string`, `number`, `boolean`, `array`, `object`, or `unknown`.
 */
function normalizePackageType(field: { type: string; optional: boolean; array: boolean }): string {
    if (field.array) return "array";
    switch (field.type) {
        case "string":
        case "number":
        case "boolean":
            return field.type;
        default:
            return "unknown";
    }
}
