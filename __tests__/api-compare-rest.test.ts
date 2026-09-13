import { afterAll, beforeEach, describe, expect, it } from "vitest";
import {
    compareRestContracts,
    extractEmbeddedOpenApi,
    fetchOpenApiDocument,
    resolveSchema,
    validateOpenApiDocument,
    writeOpenApiDocument,
    type OpenApiDocument,
    type RestEndpointMapping,
    type RestTypeContract,
} from "../lib/api-compare/openapi";
import {
    discoverRestContracts,
    MAL_ENDPOINT_MAPPINGS,
} from "../scripts/api-compare/rest-contracts";
import { runCli } from "../scripts/api-compare/cli";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

/** A minimal OpenAPI document exercising every comparison path. */
function buildSpec(): OpenApiDocument {
    return validateOpenApiDocument({
        openapi: "3.0.0",
        paths: {
            "/works/{work_id}": {
                get: {
                    responses: {
                        "200": {
                            content: {
                                "*/*": { schema: { $ref: "#/components/schemas/WorkForDetails" } },
                            },
                        },
                    },
                },
            },
            "/works/season/{year}": {
                get: {
                    responses: {
                        "200": {
                            content: {
                                "*/*": { schema: { $ref: "#/components/schemas/WorkList" } },
                            },
                        },
                    },
                },
            },
        },
        components: {
            schemas: {
                WorkForDetails: {
                    allOf: [
                        { $ref: "#/components/schemas/WorkBase" },
                        {
                            type: "object",
                            properties: {
                                num_entries: { type: "integer", nullable: false },
                                schedule: {
                                    type: "object",
                                    nullable: true,
                                    properties: {
                                        day_of_the_week: { type: "string", nullable: false },
                                        start_time: { type: "string", nullable: true },
                                    },
                                },
                            },
                        },
                    ],
                },
                WorkBase: {
                    type: "object",
                    properties: {
                        id: { type: "integer", nullable: false },
                        title: { type: "string", nullable: false },
                        main_picture: {
                            allOf: [
                                { type: "object", nullable: true },
                                { $ref: "#/components/schemas/Picture" },
                            ],
                        },
                    },
                },
                Picture: {
                    type: "object",
                    properties: {
                        large: { type: "string", nullable: true },
                        medium: { type: "string", nullable: false },
                    },
                },
                WorkList: {
                    allOf: [
                        {
                            type: "object",
                            properties: {
                                data: {
                                    type: "array",
                                    items: {
                                        type: "object",
                                        properties: {
                                            node: { $ref: "#/components/schemas/WorkForDetails" },
                                        },
                                    },
                                },
                            },
                        },
                        { $ref: "#/components/schemas/List" },
                    ],
                },
                List: {
                    type: "object",
                    properties: {
                        paging: {
                            type: "object",
                            properties: {
                                next: { type: "string" },
                                previous: { type: "string" },
                            },
                        },
                    },
                },
            },
        },
    });
}

/** A contract set matching (or drifting from) the spec above. */
function buildContracts(
    fields: Record<string, { type: string; optional: boolean; array: boolean }>,
    entryFields?: Record<string, { type: string; optional: boolean; array: boolean }>
): Record<string, RestTypeContract> {
    return {
        Work: {
            name: "Work",
            sourcePath: "src/apis/rest/provider/types.ts",
            fields,
        },
        ...(entryFields
            ? {
                  WorkListEntry: {
                      name: "WorkListEntry",
                      sourcePath: "src/apis/rest/provider/types.ts",
                      fields: entryFields,
                  },
              }
            : {}),
    };
}

const WORK_MAPPING: RestEndpointMapping = {
    typeName: "Work",
    path: "/works/{work_id}",
    method: "get",
};

const WORK_LIST_ENTRY_MAPPING: RestEndpointMapping = {
    typeName: "WorkListEntry",
    path: "/works/season/{year}",
    method: "get",
    dataItems: true,
};

describe("openapi.extractEmbeddedOpenApi", () => {
    it("extracts the embedded spec object from a reference page", () => {
        const spec = { openapi: "3.0.0", paths: {} };
        const html = `<html><body>noise {"data": ${JSON.stringify(spec)}}</body></html>`;
        expect(extractEmbeddedOpenApi(html)).toEqual(spec);
    });

    it("returns undefined when no spec is embedded", () => {
        expect(extractEmbeddedOpenApi("<html>nothing here</html>")).toBeUndefined();
    });

    it("tolerates braces inside JSON string values", () => {
        const spec = { openapi: "3.0.0", paths: {}, info: { title: "braces } in { strings" } };
        const html = `prefix ${JSON.stringify(spec)} suffix`;
        expect(extractEmbeddedOpenApi(html)).toEqual(spec);
    });

    it("skips JS-bundle mentions of openapi that are not the spec root", () => {
        // Reference pages that embed their spec (such as MAL's) ship a Redoc
        // bundle containing schema definitions like
        // required:["openapi","paths","info"] before the real spec.
        const spec = { openapi: "3.0.0", paths: {} };
        const html =
            'var a={properties:{openapi:null},required:["openapi","paths","info"]};' +
            `later ${JSON.stringify(spec)} end`;
        expect(extractEmbeddedOpenApi(html)).toEqual(spec);
    });
});

describe("openapi.validateOpenApiDocument", () => {
    it("rejects non-objects and documents without paths", () => {
        expect(() => validateOpenApiDocument(null)).toThrow(/expected an object/);
        expect(() => validateOpenApiDocument({ openapi: "3.0.0" })).toThrow(/missing paths/);
        expect(() => validateOpenApiDocument({ paths: {} })).toThrow(/missing openapi version/);
    });
});

describe("openapi.fetchOpenApiDocument", () => {
    it("rejects a non-OK HTTP response with the status code", async () => {
        const fetcher = (async () =>
            ({ ok: false, status: 404 }) as unknown as Response) as typeof fetch;
        await expect(fetchOpenApiDocument(fetcher, "https://example.test/spec")).rejects.toThrow(
            /HTTP 404/
        );
    });

    it("rejects a page with no embedded spec", async () => {
        const fetcher = (async () =>
            ({
                ok: true,
                status: 200,
                text: async () => "<html>nothing</html>",
            }) as unknown as Response) as typeof fetch;
        await expect(fetchOpenApiDocument(fetcher, "https://example.test/spec")).rejects.toThrow(
            /No embedded OpenAPI document/
        );
    });
});

describe("openapi.writeOpenApiDocument", () => {
    it("writes a parseable snapshot and leaves no temp file behind", async () => {
        const dir = mkdtempSync(join(tmpdir(), "anilink-openapi-write-"));
        try {
            const filePath = join(dir, "nested", "snapshot.json");
            const document = validateOpenApiDocument({
                openapi: "3.0.0",
                paths: { "/anime": { get: { responses: {} } } },
            });
            await writeOpenApiDocument(filePath, document);
            const written = JSON.parse(readFileSync(filePath, "utf8"));
            expect(written.openapi).toBe("3.0.0");
            expect(Object.keys(written.paths)).toEqual(["/anime"]);
            expect(existsSync(`${filePath}.tmp`)).toBe(false);
        } finally {
            rmSync(dir, { recursive: true, force: true });
        }
    });
});

describe("compareRestContracts", () => {
    it("passes when every package field exists on the spec with a matching type", () => {
        const result = compareRestContracts({
            document: buildSpec(),
            contracts: buildContracts(
                {
                    id: { type: "number", optional: false, array: false },
                    title: { type: "string", optional: false, array: false },
                    num_entries: { type: "number", optional: true, array: false },
                },
                { node: { type: "Work", optional: false, array: false } }
            ),
            endpoints: [WORK_MAPPING, WORK_LIST_ENTRY_MAPPING],
        });
        expect(result.discrepancies).toEqual([]);
        expect(result.verifiedTypes).toBe(2);
        expect(result.implementedEndpoints).toEqual([
            "GET /works/{work_id}",
            "GET /works/season/{year}",
        ]);
        expect(result.unimplementedEndpoints).toEqual([]);
    });

    it("reports a field the upstream contract no longer declares", () => {
        const result = compareRestContracts({
            document: buildSpec(),
            contracts: buildContracts(
                { start_time: { type: "string", optional: true, array: false } },
                { node: { type: "Work", optional: false, array: false } }
            ),
            endpoints: [WORK_MAPPING, WORK_LIST_ENTRY_MAPPING],
        });
        expect(result.discrepancies).toEqual([
            expect.objectContaining({
                severity: "error",
                category: "missing-response-field",
                packageValue: "start_time",
            }),
        ]);
    });

    it("reports a type mismatch between package and spec", () => {
        const result = compareRestContracts({
            document: buildSpec(),
            contracts: buildContracts(
                { schedule: { type: "string", optional: true, array: false } },
                { node: { type: "Work", optional: false, array: false } }
            ),
            endpoints: [WORK_MAPPING, WORK_LIST_ENTRY_MAPPING],
        });
        expect(result.discrepancies).toEqual([
            expect.objectContaining({
                severity: "error",
                category: "field-type-mismatch",
                packageValue: "schedule: string",
                apiValue: "schedule: object",
            }),
        ]);
    });

    it("compares list-entry types against the data array items", () => {
        const result = compareRestContracts({
            document: buildSpec(),
            contracts: buildContracts(
                {},
                { node: { type: "Work", optional: false, array: false } }
            ),
            endpoints: [WORK_LIST_ENTRY_MAPPING],
        });
        // The unmapped works endpoint surfaces as a coverage warning.
        expect(result.discrepancies).toEqual([
            expect.objectContaining({
                severity: "warning",
                category: "unimplemented-endpoint",
                operation: "GET /works/{work_id}",
            }),
        ]);
    });

    it("reports a dataItems mapping whose schema has no data array", () => {
        const result = compareRestContracts({
            document: buildSpec(),
            contracts: buildContracts(
                {},
                { node: { type: "Work", optional: false, array: false } }
            ),
            endpoints: [{ ...WORK_LIST_ENTRY_MAPPING, path: "/works/{work_id}" }],
        });
        expect(result.discrepancies).toEqual([
            expect.objectContaining({
                severity: "error",
                category: "missing-response-schema",
            }),
            expect.objectContaining({
                severity: "warning",
                category: "unimplemented-endpoint",
                operation: "GET /works/season/{year}",
            }),
        ]);
    });

    it("warns when a mapped type has no extracted contract", () => {
        const result = compareRestContracts({
            document: buildSpec(),
            contracts: {},
            endpoints: [WORK_MAPPING, WORK_LIST_ENTRY_MAPPING],
        });
        expect(result.discrepancies).toEqual([
            expect.objectContaining({
                severity: "warning",
                category: "missing-type-contract",
            }),
            expect.objectContaining({
                severity: "warning",
                category: "missing-type-contract",
            }),
        ]);
        expect(result.verifiedTypes).toBe(0);
    });

    it("reports an endpoint removed from the spec", () => {
        const result = compareRestContracts({
            document: buildSpec(),
            contracts: buildContracts({
                id: { type: "number", optional: false, array: false },
            }),
            endpoints: [{ ...WORK_MAPPING, path: "/removed/{id}" }],
        });
        expect(result.discrepancies).toEqual([
            expect.objectContaining({
                severity: "error",
                category: "removed-endpoint",
            }),
            expect.objectContaining({
                severity: "warning",
                category: "unimplemented-endpoint",
                operation: "GET /works/{work_id}",
            }),
            expect.objectContaining({
                severity: "warning",
                category: "unimplemented-endpoint",
                operation: "GET /works/season/{year}",
            }),
        ]);
    });

    it("warns about spec endpoints no package type maps to", () => {
        const result = compareRestContracts({
            document: buildSpec(),
            contracts: buildContracts({
                id: { type: "number", optional: false, array: false },
            }),
            endpoints: [WORK_MAPPING],
        });
        expect(result.unimplementedEndpoints).toEqual(["GET /works/season/{year}"]);
        expect(result.discrepancies).toEqual([
            expect.objectContaining({
                severity: "warning",
                category: "unimplemented-endpoint",
                operation: "GET /works/season/{year}",
            }),
        ]);
    });

    it("does not count a removed endpoint toward verified types", () => {
        const result = compareRestContracts({
            document: buildSpec(),
            contracts: buildContracts({
                id: { type: "number", optional: false, array: false },
            }),
            endpoints: [{ ...WORK_MAPPING, path: "/removed/{id}" }],
        });
        // The removed endpoint is an error; the two unmapped spec endpoints
        // surface as coverage warnings.
        expect(result.discrepancies).toEqual([
            expect.objectContaining({
                severity: "error",
                category: "removed-endpoint",
            }),
            expect.objectContaining({
                severity: "warning",
                category: "unimplemented-endpoint",
                operation: "GET /works/{work_id}",
            }),
            expect.objectContaining({
                severity: "warning",
                category: "unimplemented-endpoint",
                operation: "GET /works/season/{year}",
            }),
        ]);
        expect(result.verifiedTypes).toBe(0);
    });

    it("resolves sibling fields that reference the same component", () => {
        // Two sibling fields ($ref-ing the same Picture component) must each
        // resolve fully; a shared visited-refs set truncates the second one.
        const siblingRefs = validateOpenApiDocument({
            openapi: "3.0.0",
            paths: {},
            components: {
                schemas: {
                    Work: {
                        type: "object",
                        properties: {
                            main_picture: { $ref: "#/components/schemas/Picture" },
                            pictures: {
                                type: "array",
                                items: { $ref: "#/components/schemas/Picture" },
                            },
                        },
                    },
                    Picture: {
                        type: "object",
                        properties: {
                            large: { type: "string", nullable: true },
                            medium: { type: "string", nullable: false },
                        },
                    },
                },
            },
        });
        const resolved = resolveSchema(siblingRefs, {
            $ref: "#/components/schemas/Work",
        });
        expect(resolved.nested.main_picture?.fields.map((f) => f.name)).toEqual([
            "large",
            "medium",
        ]);
        expect(resolved.nested.pictures?.fields.map((f) => f.name)).toEqual(["large", "medium"]);
    });

    it("cuts $ref cycles instead of recursing until the stack overflows", () => {
        // A forum-topic-style schema whose posts reference the topic again.
        const cyclic = validateOpenApiDocument({
            openapi: "3.0.0",
            paths: {
                "/topics/{topic_id}": {
                    get: {
                        responses: {
                            "200": {
                                content: {
                                    "*/*": { schema: { $ref: "#/components/schemas/Topic" } },
                                },
                            },
                        },
                    },
                },
            },
            components: {
                schemas: {
                    Topic: {
                        type: "object",
                        properties: {
                            id: { type: "integer", nullable: false },
                            posts: {
                                type: "array",
                                items: { $ref: "#/components/schemas/Post" },
                            },
                        },
                    },
                    Post: {
                        type: "object",
                        properties: {
                            body: { type: "string", nullable: false },
                            topic: { $ref: "#/components/schemas/Topic" },
                        },
                    },
                },
            },
        });
        const result = compareRestContracts({
            document: cyclic,
            contracts: {
                Topic: {
                    name: "Topic",
                    sourcePath: "src/apis/rest/provider/types.ts",
                    fields: {
                        id: { type: "number", optional: false, array: false },
                        posts: { type: "Post", optional: false, array: true },
                    },
                },
            },
            endpoints: [{ typeName: "Topic", path: "/topics/{topic_id}", method: "get" }],
        });
        expect(result.discrepancies).toEqual([]);
        expect(result.verifiedTypes).toBe(1);
    });
});

describe("discoverRestContracts - MAL provider integration", () => {
    it("extracts the real MAL type contracts from the source tree", async () => {
        const contracts = await discoverRestContracts(resolve(import.meta.dirname, ".."), "mal");
        expect(Object.keys(contracts)).toContain("MalAnime");
        expect(contracts.MalAnime.fields.id).toEqual({
            type: "number",
            optional: false,
            array: false,
        });
        // Request-shape interfaces are excluded from the comparison.
        expect(contracts.MalRequestOptions).toBeUndefined();
    });

    it("maps every endpoint mapping to a discovered contract", async () => {
        const contracts = await discoverRestContracts(resolve(import.meta.dirname, ".."), "mal");
        for (const mapping of MAL_ENDPOINT_MAPPINGS) {
            // Coverage-only mappings (void-returning endpoints) have no contract.
            if (!mapping.typeName) continue;
            expect(
                contracts[mapping.typeName],
                `missing contract for ${mapping.typeName}`
            ).toBeDefined();
        }
    });

    it("rejects providers without a configured source root", async () => {
        await expect(
            discoverRestContracts(resolve(import.meta.dirname, ".."), "unknown")
        ).rejects.toThrow(/No REST source root configured/);
    });
});

describe("runCli exit status", () => {
    // runOpenApiComparison writes report files even when the comparison is
    // injected; point those writes at a temp dir so unit tests never clobber
    // real artifacts under artifacts/mal-api-compare/.
    let reportDir: string;

    afterAll(() => {
        if (reportDir) rmSync(reportDir, { recursive: true, force: true });
    });

    beforeEach(() => {
        reportDir = mkdtempSync(join(tmpdir(), "anilink-api-compare-rest-cli-"));
    });

    it("treats unimplemented endpoints as warnings, not strict-mode failures", async () => {
        const logs: string[] = [];
        const result = await runCli({
            argv: ["compare", "--provider", "mal", "--strict", "--report-dir", reportDir],
            compare: async () => ({
                discrepancies: [
                    {
                        severity: "warning",
                        category: "unimplemented-endpoint",
                        operation: "GET /works/{work_id}",
                        message:
                            "Spec endpoint GET /works/{work_id} is not implemented by the package",
                    },
                ],
            }),
            log: (message) => logs.push(message),
        });
        expect(result.exitCode).toBe(0);
        expect(logs).toContain("No actionable discrepancies found");
    });

    it("fails strict mode on real contract drift", async () => {
        const result = await runCli({
            argv: ["compare", "--provider", "mal", "--strict", "--report-dir", reportDir],
            compare: async () => ({
                discrepancies: [
                    {
                        severity: "error",
                        category: "missing-response-field",
                        operation: "Work",
                        message: "Response field id is not present in the upstream contract",
                    },
                ],
            }),
            log: () => {},
        });
        expect(result.exitCode).toBe(1);
    });

    it("rejects an invocation without --provider", async () => {
        const result = await runCli({
            argv: ["compare"],
            compare: async () => ({ discrepancies: [] }),
            log: () => {},
        });
        expect(result.exitCode).toBe(2);
        expect(result.error).toMatch(/Missing --provider flag/);
    });

    it("rejects an unknown provider name", async () => {
        const result = await runCli({
            argv: ["compare", "--provider", "unknown"],
            compare: async () => ({ discrepancies: [] }),
            log: () => {},
        });
        expect(result.exitCode).toBe(2);
        expect(result.error).toMatch(/Unknown or missing provider "unknown"/);
    });
});
