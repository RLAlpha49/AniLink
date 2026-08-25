import { describe, it, expect } from "vitest";
import { createRequire } from "node:module";

// The UMD file is treated as ESM by some loaders (package "type": "module"),
// so accept either a CommonJS export object or the globalThis side effect.
const require_ = createRequire(import.meta.url);
const loaded = require_("../explorer-src/assets/explorer-core.js") as Partial<ExplorerCore>;
const core: ExplorerCore =
    loaded && typeof loaded.maskToken === "function"
        ? (loaded as ExplorerCore)
        : (globalThis as unknown as { ExplorerCore: ExplorerCore }).ExplorerCore;

if (!core || typeof core.maskToken !== "function") {
    throw new Error("explorer-core.js failed to expose its API to the test loader");
}

describe("escFull", () => {
    it("escapes &, <, > and double quotes", () => {
        expect(core.escFull('<a href="x">&')).toBe("&lt;a href=&quot;x&quot;&gt;&amp;");
    });

    it("stringifies non-string input", () => {
        expect(core.escFull(5)).toBe("5");
    });
});

describe("highlightJson (FE-001)", () => {
    it("highlights keys with their quotes preserved (escaped)", () => {
        const html = core.highlightJson({ Media: { id: 1 } });
        expect(html).toContain('<span class="tok-key">&quot;Media&quot;</span>');
    });

    it("highlights string values with their quotes preserved (escaped)", () => {
        const html = core.highlightJson({ title: "Cowboy Bebop" });
        expect(html).toContain('<span class="tok-string">&quot;Cowboy Bebop&quot;</span>');
    });

    it("never emits raw HTML from string values", () => {
        const html = core.highlightJson({ x: "<script>alert(1)</script>" });
        expect(html).not.toContain("<script>");
        expect(html).toContain("&lt;script&gt;");
    });

    it("highlights numbers, booleans, null and punctuation", () => {
        const html = core.highlightJson({ a: 1.5, b: true, c: false, d: null });
        expect(html).toContain('<span class="tok-number">1.5</span>');
        expect(html).toContain('<span class="tok-bool">true</span>');
        expect(html).toContain('<span class="tok-bool">false</span>');
        expect(html).toContain('<span class="tok-null">null</span>');
        expect(html).toContain('<span class="tok-punct">{</span>');
        expect(html).toContain('<span class="tok-punct">}</span>');
    });

    it("handles exponent notation and escaped quotes inside strings", () => {
        const html = core.highlightJson('{ "big": 1e5, "quoted": "say \\"hi\\"" }');
        expect(html).toContain('<span class="tok-number">1e5</span>');
        // The backslashes are part of the serialized text and stay visible.
        expect(html).toContain(
            '<span class="tok-string">&quot;say \\&quot;hi\\&quot;&quot;</span>'
        );
    });

    it("does not confuse a numeric-looking key with a number value", () => {
        const html = core.highlightJson({ "123": "x" });
        expect(html).toContain('<span class="tok-key">&quot;123&quot;</span>');
        expect(html).toContain('<span class="tok-string">&quot;x&quot;</span>');
    });

    it("accepts already-serialized JSON text as well as objects", () => {
        const html = core.highlightJson('{"a":1}');
        expect(html).toContain('<span class="tok-key">&quot;a&quot;</span>');
        expect(html).toContain('<span class="tok-number">1</span>');
    });
});

describe("maskToken (FE-004)", () => {
    it("returns an empty string for empty/null/undefined tokens", () => {
        expect(core.maskToken("")).toBe("");
        expect(core.maskToken(null)).toBe("");
        expect(core.maskToken(undefined)).toBe("");
    });

    it("fully dots a token of 8 characters or fewer", () => {
        expect(core.maskToken("abc12345")).toBe("••••••••");
        expect(core.maskToken("abc")).toBe("•••");
    });

    it("shows only the first and last four characters of longer tokens", () => {
        expect(core.maskToken("abcdefghijklmnop")).toBe("abcd…mnop");
        expect(core.maskToken("123456789")).toBe("1234…6789");
    });
});

describe("redactTokens (FE-004)", () => {
    it("replaces the exact saved token with a placeholder", () => {
        expect(core.redactTokens("Bearer supersecret123", "supersecret123")).toBe(
            "Bearer [REDACTED]"
        );
    });

    it("strips generic Bearer credentials even without a saved token", () => {
        const out = core.redactTokens(
            "Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.s3cr3t",
            null
        );
        expect(out).not.toContain("eyJ");
        expect(out).toContain("[REDACTED]");
    });

    it("leaves unrelated text untouched", () => {
        expect(core.redactTokens("hello world", "nope")).toBe("hello world");
    });
});

describe("coercion parsers (FE-006)", () => {
    describe("parseNumberInput", () => {
        it("maps empty input to no value", () => {
            expect(core.parseNumberInput("")).toEqual({ value: undefined });
            expect(core.parseNumberInput("   ")).toEqual({ value: undefined });
        });

        it("parses integers and decimals", () => {
            expect(core.parseNumberInput("42")).toEqual({ value: 42 });
            expect(core.parseNumberInput("-3.5")).toEqual({ value: -3.5 });
        });

        it("reports invalid numbers instead of dropping them", () => {
            const res = core.parseNumberInput("abc");
            expect(res.value).toBeUndefined();
            expect(res.error).toMatch(/number/i);
        });
    });

    describe("parseNumberList", () => {
        it("maps empty input to no value", () => {
            expect(core.parseNumberList("")).toEqual({ value: undefined });
        });

        it("parses comma-separated numbers with stray whitespace", () => {
            expect(core.parseNumberList("1, 2,3")).toEqual({ value: [1, 2, 3] });
        });

        it("reports which entries are not numbers", () => {
            const res = core.parseNumberList("1, x");
            expect(res.value).toBeUndefined();
            expect(res.error).toMatch(/number/i);
        });
    });

    describe("parseStringList", () => {
        it("maps empty input to no value", () => {
            expect(core.parseStringList("")).toEqual({ value: undefined });
        });

        it("trims each comma-separated entry", () => {
            expect(core.parseStringList("a, b , c")).toEqual({ value: ["a", "b", "c"] });
        });
    });

    describe("parseJsonArray", () => {
        it("maps empty input to no value", () => {
            expect(core.parseJsonArray("")).toEqual({ value: undefined });
        });

        it("parses a valid JSON array", () => {
            expect(core.parseJsonArray('[{"id":1}]')).toEqual({ value: [{ id: 1 }] });
        });

        it("reports malformed JSON", () => {
            const res = core.parseJsonArray("[1,");
            expect(res.value).toBeUndefined();
            expect(res.error).toMatch(/JSON/i);
        });
    });

    describe("parseCustomVariables", () => {
        it("maps empty input to an empty object", () => {
            expect(core.parseCustomVariables("")).toEqual({ value: {} });
        });

        it("parses a JSON object", () => {
            expect(core.parseCustomVariables('{"page":1}')).toEqual({ value: { page: 1 } });
        });

        it("rejects malformed JSON", () => {
            const res = core.parseCustomVariables("{");
            expect(res.error).toMatch(/JSON/i);
        });

        it("rejects values that are not objects", () => {
            expect(core.parseCustomVariables("[1]").error).toMatch(/object/i);
            expect(core.parseCustomVariables('"top"').error).toMatch(/object/i);
        });
    });
});

describe("moved highlighters stay sane", () => {
    it("formats GraphQL one field per line", () => {
        const formatted = core.formatGraphql("query { Viewer { id name } }");
        expect(formatted.split("\n")).toEqual([
            "query {",
            "  Viewer {",
            "    id",
            "    name",
            "  }",
            "}",
        ]);
    });

    it("wraps GraphQL keywords and fields in spans", () => {
        const html = core.highlightGraphql(core.formatGraphql("query { Viewer { id } }"));
        expect(html).toContain('<span class="gql-keyword">query</span>');
        expect(html).toContain('<span class="gql-field">Viewer</span>');
    });

    it("wraps TypeScript keywords in spans", () => {
        const html = core.highlightTs("const aniLink = new AniLink(token);");
        expect(html).toContain('<span class="ts-keyword">const</span>');
        expect(html).toContain('<span class="ts-fn">AniLink</span>');
    });
});
