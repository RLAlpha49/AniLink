import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { getIntrospectionQuery, type IntrospectionQuery } from "graphql";
import prettier from "prettier";

const ANILIST_GRAPHQL_URL = "https://graphql.anilist.co";

/**
 * `FetchSchemaOptions` configures a live introspection request: the endpoint
 * to introspect, defaulting to the AniList GraphQL endpoint.
 */
export interface FetchSchemaOptions {
    /** GraphQL endpoint to introspect. Defaults to the AniList endpoint. */
    url?: string;
}

/**
 * `loadSchema` reads and validates a committed introspection snapshot from
 * disk.
 *
 * @param filePath - Path of the committed snapshot JSON.
 * @returns The parsed and validated {@link IntrospectionQuery} result.
 * @throws {Error} When the file cannot be read, parsed, or fails validation.
 */
export async function loadSchema(filePath: string): Promise<IntrospectionQuery> {
    const raw = await readFile(filePath, "utf8");
    return validateSchema(JSON.parse(raw));
}

/**
 * `fetchSchema` runs a live introspection query against a GraphQL endpoint
 * and returns the validated result.
 *
 * @param fetcher - Fetch implementation, injectable for tests.
 * @param options - Endpoint override; defaults to the AniList endpoint.
 * @returns The validated {@link IntrospectionQuery} result.
 * @throws {Error} When the request fails, returns GraphQL errors, or the
 *   payload fails validation.
 */
export async function fetchSchema(
    fetcher: typeof fetch = fetch,
    options: FetchSchemaOptions = {}
): Promise<IntrospectionQuery> {
    const response = await fetcher(options.url ?? ANILIST_GRAPHQL_URL, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ query: getIntrospectionQuery() }),
    });

    if (!response.ok) {
        throw new Error(
            `Schema request failed with HTTP ${response.status} (${options.url ?? ANILIST_GRAPHQL_URL})`
        );
    }

    const payload = (await response.json()) as {
        data?: { __schema?: IntrospectionQuery["__schema"] };
        errors?: Array<{ message?: string }>;
    };

    if (payload.errors?.length) {
        throw new Error(
            `Schema request returned errors: ${payload.errors.map((error) => error.message ?? "Unknown error").join("; ")}`
        );
    }

    return validateSchema(payload.data);
}

/**
 * `writeSchema` persists an introspection snapshot to disk as the committed
 * schema artifact, formatted with the repository's Prettier configuration.
 *
 * The content lands in a sibling temp file that is renamed over the target,
 * so a crash mid-write cannot leave a truncated snapshot behind.
 *
 * @param filePath - Destination snapshot path.
 * @param schema - The {@link IntrospectionQuery} result to persist.
 * @returns Nothing; writes the snapshot to disk.
 * @throws {Error} When the directory cannot be created or the write fails.
 */
export async function writeSchema(filePath: string, schema: IntrospectionQuery): Promise<void> {
    await mkdir(dirname(filePath), { recursive: true });
    const options = (await prettier.resolveConfig(filePath)) ?? {
        tabWidth: 4,
        printWidth: 100,
        endOfLine: "lf",
    };
    const formatted = await prettier.format(`${JSON.stringify(schema, null, 2)}\n`, {
        ...options,
        parser: "json",
    });
    const tempPath = `${filePath}.tmp`;
    await writeFile(tempPath, formatted, "utf8");
    await rename(tempPath, filePath);
}

function validateSchema(value: unknown): IntrospectionQuery {
    if (!value || typeof value !== "object") {
        throw new Error("Invalid introspection schema: expected an object");
    }

    const candidate = value as { data?: unknown; __schema?: unknown };
    const schema = candidate.data ?? candidate;
    if (!schema || typeof schema !== "object" || !("__schema" in schema)) {
        throw new Error("Invalid introspection schema: missing __schema");
    }

    const introspection = (schema as { __schema?: unknown }).__schema;
    if (!introspection || typeof introspection !== "object") {
        throw new Error("Invalid introspection schema: malformed __schema");
    }

    const types = (introspection as { types?: unknown }).types;
    if (!Array.isArray(types)) {
        throw new Error("Invalid introspection schema: malformed types");
    }

    return { __schema: introspection as IntrospectionQuery["__schema"] };
}
