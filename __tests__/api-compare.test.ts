import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import {
    discoverPackageContracts,
    discoverPackageOperations,
    parseOperationSource,
} from "../scripts/anilist-api-compare/package-inventory";
import { normalizeSelectionSet } from "../lib/api-compare/graph";
import { comparePackageToSchema } from "../lib/api-compare/compare";
import type { Schema } from "../lib/api-compare/types";

describe("graph.normalizeSelectionSet - inline fragments", () => {
    it("preserves inline fragments as tagged selection nodes", () => {
        const document = `
            query ($id: Int) {
                Media (id: $id) {
                    id
                    ... on TextActivity {
                        text
                        isPinned
                    }
                }
            }
        `;
        const selection = normalizeSelectionSet(document);
        expect(selection).toHaveLength(1);
        const media = selection[0];
        expect(media.name).toBe("Media");
        expect(media.selection.map((node) => node.name)).toEqual(["id", "…on TextActivity"]);

        const fragment = media.selection[1];
        expect(fragment.typeCondition).toBe("TextActivity");
        expect(fragment.arguments).toEqual([]);
        expect(fragment.selection.map((node) => node.name)).toEqual(["text", "isPinned"]);

        const scalarField = media.selection[0];
        expect(scalarField.typeCondition).toBeUndefined();
    });

    it("keeps regular field metadata intact alongside fragments", () => {
        const document = `
            query {
                Page {
                    pageInfo {
                        total
                    }
                }
            }
        `;
        const selection = normalizeSelectionSet(document);
        const pageInfo = selection[0].selection[0];
        expect(pageInfo.name).toBe("pageInfo");
        expect(pageInfo.alias).toBeUndefined();
        expect(pageInfo.selection.map((node) => node.name)).toEqual(["total"]);
    });
});

describe("package-inventory response contract resolution", () => {
    const sourceWithPromiseFallback = `
        import { APIWrapper } from "../../../../base/APIWrapper";
        import { type Activity } from "../../interfaces/Activity";

        export interface ActivityVariables {
            id?: number;
        }

        export class ActivityQuery extends APIWrapper {
            async activity(variables: ActivityVariables): Promise<Activity> {
                const query = \`
                    query ($id: Int) {
                        Activity (id: $id) {
                            id
                        }
                    }
                \`;
                return await this.request(query, variables);
            }
        }
    `;

    it("falls back to the declared Promise<T> type when no *Response import exists", () => {
        const operations = parseOperationSource("src/query/Activity.ts", sourceWithPromiseFallback);
        expect(operations).toHaveLength(1);
        expect(operations[0].responseTypeName).toBe("Activity");
    });

    it("keeps repeated parsing stable (resolution cache)", () => {
        const first = parseOperationSource("src/query/Activity.ts", sourceWithPromiseFallback);
        const second = parseOperationSource("src/query/Activity.ts", sourceWithPromiseFallback);
        expect(second[0]?.responseTypeName).toBe(first[0]?.responseTypeName);
        expect(second[0]?.responseTypeName).toBe("Activity");
    });

    it("prefers the *Response import over the declared Promise type", () => {
        const source = `
            import { type MediaResponse } from "../../interfaces/responses/query/Media";
            import { type SomethingElse } from "../../interfaces/SomethingElse";

            export class MediaQuery extends APIWrapper {
                async media(variables: MediaVariables): Promise<SomethingElse> {
                    const query = \`
                        query {
                            Media {
                                id
                            }
                        }
                    \`;
                    return await this.request(query, variables);
                }
            }
        `;
        const operations = parseOperationSource("src/query/Media.ts", source);
        expect(operations[0]?.responseTypeName).toBe("MediaResponse");
    });

    it("does not invent a response contract without a resolvable type", () => {
        const source = `
            import { APIWrapper } from "../../../../base/APIWrapper";

            export class VoidQuery extends APIWrapper {
                async voidOp(variables: VoidVariables): Promise<void> {
                    const query = \`
                        query {
                            Media {
                                id
                            }
                        }
                    \`;
                    return await this.request(query, variables);
                }
            }
        `;
        const operations = parseOperationSource("src/query/Void.ts", source);
        expect(operations[0]?.responseTypeName).toBeUndefined();
    });
});

describe("compare - union member contracts via inline fragments", () => {
    let fixtureRoot: string;

    afterAll(() => {
        if (fixtureRoot) rmSync(fixtureRoot, { recursive: true, force: true });
    });

    /**
     * Creates the temporary package tree used by the union-contract comparison.
     *
     * @returns The temporary fixture root, which the suite removes after the tests.
     * @throws When the operating system cannot create or populate the temporary fixture.
     */
    function writeFixture(): string {
        const root = mkdtempSync(join(tmpdir(), "anilink-api-compare-"));
        mkdirSync(join(root, "query"), { recursive: true });
        mkdirSync(join(root, "mutation"), { recursive: true });
        mkdirSync(join(root, "interfaces"), { recursive: true });

        writeFileSync(
            join(root, "interfaces", "Thing.ts"),
            [
                "/** Union contract carrying only the shared fields. */",
                "export interface ThingUnion {",
                "    id: number;",
                "}",
                "",
                "/** Member contract that deliberately omits isPinned. */",
                "export interface TextActivity {",
                "    text: string;",
                "}",
                "",
            ].join("\n"),
            "utf8"
        );

        /**
         * Produces a synthetic operation module for a package-inventory fixture.
         *
         * @param className - Exported query class name in the generated module.
         * @param methodName - Operation method name in the generated module.
         * @param rootField - GraphQL root field selected by the operation.
         * @param memberFields - Newline-separated fields selected inside the inline fragment.
         * @returns TypeScript source containing the requested operation.
         */
        const operationTemplate = (
            className: string,
            methodName: string,
            rootField: string,
            memberFields: string
        ) =>
            [
                'import { APIWrapper } from "../../base/APIWrapper";',
                'import { type ThingUnion } from "../interfaces/Thing";',
                "",
                `export class ${className} extends APIWrapper {`,
                `    async ${methodName}(variables: ThingVariables): Promise<ThingUnion> {`,
                "        const query = `",
                "            query {",
                `                ${rootField} {`,
                "                    id",
                `                    ... on TextActivity {`,
                memberFields,
                "                    }",
                "                }",
                "            }",
                "        `;",
                "        return await this.request(query, variables);",
                "    }",
                "}",
                "",
            ].join("\n");

        writeFileSync(
            join(root, "query", "BadThing.ts"),
            operationTemplate("BadThingQuery", "badThing", "badThing", "text\nisPinned"),
            "utf8"
        );
        writeFileSync(
            join(root, "query", "GoodThing.ts"),
            operationTemplate("GoodThingQuery", "goodThing", "goodThing", "text"),
            "utf8"
        );
        return root;
    }

    it("detects wrong contracts behind inline fragments using the Promise<T> fallback", async () => {
        fixtureRoot = writeFixture();

        const operations = await discoverPackageOperations(fixtureRoot);
        expect(operations.map((operation) => operation.rootField)).toEqual([
            "badThing",
            "goodThing",
        ]);
        expect(operations.every((op) => op.responseTypeName === "ThingUnion")).toBe(true);

        const contracts = await discoverPackageContracts(fixtureRoot);
        const result = comparePackageToSchema({
            schema: buildFakeSchema(),
            operations,
            contracts,
        });

        const contractErrors = result.discrepancies.filter(
            (discrepancy) => discrepancy.category === "missing-response-contract-field"
        );
        expect(contractErrors).toHaveLength(1);
        expect(contractErrors[0]).toMatchObject({
            severity: "error",
            packageValue: "isPinned",
        });
        expect(contractErrors[0].message).toContain("TextActivity");
        expect(contractErrors[0].operation).toBe("BadThingQuery");

        const goodOpErrors = result.discrepancies.filter(
            (discrepancy) =>
                discrepancy.category === "missing-response-contract-field" &&
                discrepancy.operation === "GoodThingQuery"
        );
        expect(goodOpErrors).toHaveLength(0);

        // Inline fragments must not leak into the schema-side selection walk:
        // member fields are verified against the member object type instead of
        // being flagged as unknown fields of the union.
        expect(
            result.discrepancies.filter(
                (discrepancy) => discrepancy.category === "missing-response-field"
            )
        ).toHaveLength(0);
        expect(
            result.discrepancies.filter(
                (discrepancy) => discrepancy.category === "unknown-union-member"
            )
        ).toHaveLength(0);
    });
});

/**
 * Builds the minimal schema needed to compare the generated union fixture.
 *
 * @returns A schema containing the union-like object, its inline-fragment member, and both query fields.
 */
function buildFakeSchema(): Schema {
    const objectRef = { kind: "OBJECT", name: "ThingUnion", ofType: null };
    return {
        __schema: {
            queryType: { name: "Query" },
            mutationType: null,
            types: [
                {
                    kind: "OBJECT",
                    name: "Query",
                    fields: [
                        {
                            name: "badThing",
                            args: [],
                            isDeprecated: false,
                            type: objectRef,
                        },
                        {
                            name: "goodThing",
                            args: [],
                            isDeprecated: false,
                            type: objectRef,
                        },
                    ],
                },
                {
                    kind: "OBJECT",
                    name: "ThingUnion",
                    fields: [
                        {
                            name: "id",
                            args: [],
                            isDeprecated: false,
                            type: { kind: "SCALAR", name: "Int", ofType: null },
                        },
                    ],
                },
                {
                    kind: "OBJECT",
                    name: "TextActivity",
                    fields: [
                        {
                            name: "text",
                            args: [],
                            isDeprecated: false,
                            type: { kind: "SCALAR", name: "String", ofType: null },
                        },
                        {
                            name: "isPinned",
                            args: [],
                            isDeprecated: false,
                            type: { kind: "SCALAR", name: "Boolean", ofType: null },
                        },
                    ],
                },
            ],
        },
    } as unknown as Schema;
}
