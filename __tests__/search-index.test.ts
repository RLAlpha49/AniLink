/**
 * Unit tests for the semantic-search index builder.
 *
 * Covers the pure chunking helpers (markdown, operation manifest, TypeDoc
 * HTML) and the ranking math (cosine similarity, result merge). The embedding
 * + file-writing CLI is exercised end-to-end via `npm run docs:search-index`,
 * not here.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
    chunkMarkdown,
    chunkOperations,
    chunkTypedoc,
    cosineSimilarity,
    mergeResults,
    quantizeVector,
    dequantizeVector,
    type ScoredResult,
} from "../scripts/generate-search-index";
import type { ReferenceManifest } from "../scripts/generate-operation-reference";
import { escapeHtml, SEARCH_MODEL_REVISION } from "../docs-src/lib/search-rank";

describe("chunkMarkdown", () => {
    it("splits a doc into one chunk per H2/H3 heading with its body", () => {
        const md = `# Getting started

Intro paragraph.

## Install

Run npm install.

## Your first query

\`\`\`ts
const a = new AniLink();
\`\`\`

### Subsection

More detail.
`;
        const chunks = chunkMarkdown(md, "/getting-started", "Getting started");
        // Page-title chunk (intro) + Install + Subsection. The "Your first
        // query" section is code-block-only and is filtered out.
        expect(chunks.length).toBeGreaterThanOrEqual(3);
        const titles = chunks.map((c) => c.title);
        expect(titles).toContain("Install");
        expect(titles).not.toContain("Your first query");
        expect(titles).toContain("Subsection");
        const install = chunks.find((c) => c.title === "Install")!;
        expect(install.url).toBe("/getting-started#install");
        expect(install.text).toContain("Run npm install.");
        const sub = chunks.find((c) => c.title === "Subsection")!;
        expect(sub.url).toBe("/getting-started#subsection");
    });

    it("skips frontmatter and uses the page title for the leading chunk", () => {
        const md = `---
title: Foo
layout: bar
---

# Foo

Body text.
`;
        const chunks = chunkMarkdown(md, "/foo", "Foo");
        expect(chunks[0].title).toBe("Foo");
        expect(chunks[0].url).toBe("/foo");
        expect(chunks[0].text).toContain("Body text.");
        expect(chunks[0].text).not.toContain("layout");
    });

    it("produces a page-title chunk when text precedes the first heading", () => {
        const md = `# Page

Lead paragraph before any heading.

## First

Content.
`;
        const chunks = chunkMarkdown(md, "/page", "Page");
        expect(chunks[0].title).toBe("Page");
        expect(chunks[0].url).toBe("/page");
        expect(chunks[0].text).toContain("Lead paragraph before any heading.");
    });

    it("handles CRLF line endings and splits on H2 headings", () => {
        const md =
            "---\r\ntitle: Foo\r\nlayout: bar\r\n---\r\n\r\n# Foo\r\n\r\nIntro paragraph here.\r\n\r\n## First section\r\n\r\nBody one content.\r\n\r\n## Second section\r\n\r\nBody two content.\r\n";
        const chunks = chunkMarkdown(md, "/foo", "Foo");
        const titles = chunks.map((c) => c.title);
        expect(titles).toContain("First section");
        expect(titles).toContain("Second section");
        const first = chunks.find((c) => c.title === "First section")!;
        expect(first.url).toBe("/foo#first-section");
        expect(first.text).toContain("Body one content.");
        // Frontmatter must be stripped, not appear in any chunk.
        for (const c of chunks) expect(c.text).not.toContain("layout");
        // The H2 heading text must not leak into the previous chunk's body.
        const intro = chunks.find((c) => c.title === "Foo");
        if (intro) expect(intro.text).not.toContain("Body one content.");
    });

    it("skips boilerplate navigation sections like Next steps", () => {
        const md = `# Page

Real content here.

## Next steps

- [Link one](/foo)
- [Link two](/bar)

## Real section

Actual useful content.
`;
        const chunks = chunkMarkdown(md, "/page", "Page");
        const titles = chunks.map((c) => c.title);
        expect(titles).not.toContain("Next steps");
        expect(titles).toContain("Real section");
    });

    it("skips chunks whose body is too short after stripping code blocks", () => {
        const md = `# Page

## Example

\`\`\`ts
const x = 1;
\`\`\`

## Real

Useful text here.
`;
        const chunks = chunkMarkdown(md, "/page", "Page");
        const titles = chunks.map((c) => c.title);
        expect(titles).not.toContain("Example");
        expect(titles).toContain("Real");
    });
});

describe("escapeHtml", () => {
    it("encodes markup characters without double-encoding ampersands", () => {
        expect(escapeHtml('& <script>alert("x")</script>')).toBe(
            '&amp; &lt;script&gt;alert("x")&lt;/script&gt;'
        );
    });
});

describe("chunkOperations", () => {
    it("builds one chunk per operation from the manifest", () => {
        const manifest: ReferenceManifest = {
            generatedAt: "2026-08-30T00:00:00.000Z",
            operations: [
                {
                    provider: "anilist",
                    protocol: "graphql",
                    domain: "Media",
                    namespace: "anilist.query.media",
                    name: "media",
                    category: "query",
                    signature: "media(variables): Promise<MediaResponse>",
                    purpose: "Fetch a single anime or manga entry.",
                    auth: "Not required.",
                    request: [{ name: "id", type: "number", required: true, description: "ID" }],
                    responseType: "MediaResponse",
                    response: [
                        { name: "id", type: "number", required: true, description: "The id" },
                    ],
                    errors: [{ error: "AniLinkApiError", condition: "bad response" }],
                    example: "await aniLink.anilist.query.media({ id: 1 });",
                    links: [],
                },
            ],
        };
        const chunks = chunkOperations(manifest);
        expect(chunks).toHaveLength(1);
        expect(chunks[0].title).toBe("anilist.query.media");
        expect(chunks[0].source).toBe("operation");
        expect(chunks[0].url).toBe("/operations/anilist/query#anilist.query.media");
        expect(chunks[0].text).toContain("Fetch a single anime or manga entry.");
        expect(chunks[0].text).toContain("media(variables)");
    });
});

describe("chunkTypedoc", () => {
    it("extracts the page title and first tsd-comment paragraph", () => {
        const html = `<!DOCTYPE html><html><head><title>AniLink | AniLink</title></head>
<body><div class="tsd-page-title"><h1>Class AniLink</h1></div>
<section class="tsd-panel tsd-comment"><div class="tsd-comment tsd-typography"><p>AniLink is the public entry point.</p></div></section>
<section class="tsd-panel"><div class="tsd-signature">new AniLink()</div></section></body></html>`;
        const chunks = chunkTypedoc(html, "/typedoc/classes/AniLink.AniLink.html");
        expect(chunks).toHaveLength(1);
        expect(chunks[0].title).toBe("Class AniLink");
        expect(chunks[0].source).toBe("typedoc");
        expect(chunks[0].text).toContain("AniLink is the public entry point.");
        expect(chunks[0].text).not.toContain("tsd-signature");
    });

    it("returns [] when there is no tsd-comment", () => {
        const html = `<html><body><div class="tsd-page-title"><h1>X</h1></div></body></html>`;
        expect(chunkTypedoc(html, "/typedoc/x.html")).toEqual([]);
    });

    it("extracts the title when h1 contains nested tags like <code>", () => {
        const html = `<html><body><div class="tsd-page-title"><ul class="tsd-breadcrumb"><li><a href="x">mod</a></li></ul><h1>Class AniListOperation<code class="tsd-tag">Abstract</code></h1></div>
<section class="tsd-panel tsd-comment"><div class="tsd-comment tsd-typography"><p>AniListOperation is the binding.</p></div></section></body></html>`;
        const chunks = chunkTypedoc(html, "/typedoc/classes/Foo.html");
        expect(chunks).toHaveLength(1);
        expect(chunks[0].title).toBe("Class AniListOperation Abstract");
        expect(chunks[0].text).toContain("AniListOperation is the binding.");
    });

    it("returns [] when the title would be an HTML filename (extraction failed)", () => {
        const html = `<html><body><div class="tsd-page-title">no h1 here</div>
<section class="tsd-panel tsd-comment"><div class="tsd-comment tsd-typography"><p>Some content.</p></div></section></body></html>`;
        expect(chunkTypedoc(html, "/typedoc/classes/foo.bar.html")).toEqual([]);
    });

    it("removes incomplete opening tags from comment text", () => {
        const html = `<html><body><div class="tsd-page-title"><h1>Class Safe</h1></div>
<section class="tsd-panel tsd-comment"><div class="tsd-comment tsd-typography"><p>Visible text <script</p></div></section></body></html>`;
        const chunks = chunkTypedoc(html, "/typedoc/classes/Safe.html");
        expect(chunks).toHaveLength(1);
        expect(chunks[0].text).toBe("Visible text");
        expect(chunks[0].text).not.toContain("<script");
    });
});

describe("cosineSimilarity", () => {
    it("returns 1 for identical vectors and 0 for orthogonal", () => {
        expect(cosineSimilarity([1, 0], [1, 0])).toBeCloseTo(1, 5);
        expect(cosineSimilarity([1, 0], [0, 1])).toBeCloseTo(0, 5);
    });
    it("returns -1 for opposite vectors", () => {
        expect(cosineSimilarity([1, 0], [-1, 0])).toBeCloseTo(-1, 5);
    });
    it("returns 0 for a zero vector", () => {
        expect(cosineSimilarity([0, 0], [1, 0])).toBe(0);
    });
});

describe("vector quantization", () => {
    it("round-trips a float vector through int8 codes and back", () => {
        const v = [0.12, -0.34, 0.56, -0.78, 0.9];
        const quantized = quantizeVector(v)!;
        expect(quantized).not.toBeNull();
        expect(quantized.scale).toBeCloseTo(0.9, 12);
        for (const code of quantized.q) {
            expect(Math.abs(code)).toBeLessThanOrEqual(127);
            expect(Number.isInteger(code)).toBe(true);
        }
        const restored = dequantizeVector({
            id: "x",
            url: "/x",
            title: "x",
            text: "x",
            source: "guide",
            q: quantized.q,
            scale: quantized.scale,
        })!;
        // int8 quantization loses precision, but each component stays within
        // half a quantization step (scale / 127) of the original.
        for (let i = 0; i < v.length; i++) {
            expect(Math.abs(restored[i] - v[i])).toBeLessThanOrEqual(quantized.scale / 127);
        }
    });

    it("returns null for a zero vector and for docs without q/scale", () => {
        expect(quantizeVector([0, 0, 0])).toBeNull();
        expect(
            dequantizeVector({ id: "x", url: "/x", title: "x", text: "x", source: "guide" })
        ).toBeNull();
    });

    it("keeps cosine rankings nearly unchanged after quantization", () => {
        const a = [0.1, 0.2, 0.3, -0.4];
        const b = [0.15, 0.18, 0.31, -0.38];
        const c = [-0.3, 0.1, 0.2, 0.25];
        const qb = quantizeVector(b)!;
        const qc = quantizeVector(c)!;
        const docB = {
            id: "b",
            url: "/b",
            title: "b",
            text: "",
            source: "guide" as const,
            q: qb.q,
            scale: qb.scale,
        };
        const docC = {
            id: "c",
            url: "/c",
            title: "c",
            text: "",
            source: "guide" as const,
            q: qc.q,
            scale: qc.scale,
        };
        const floatB = cosineSimilarity(a, b);
        const floatC = cosineSimilarity(a, c);
        const quantB = cosineSimilarity(a, docB);
        const quantC = cosineSimilarity(a, docC);
        expect(Math.abs(floatB - quantB)).toBeLessThan(0.01);
        expect(Math.abs(floatC - quantC)).toBeLessThan(0.01);
        // The ordering (b ranks above c) survives quantization.
        expect(quantB).toBeGreaterThan(quantC);
    });

    it("scores 0 for a doc with no vector data", () => {
        const doc = { id: "x", url: "/x", title: "x", text: "", source: "guide" as const };
        expect(cosineSimilarity([1, 0], doc)).toBe(0);
    });

    it("scores a v1 float-format doc (vector only) instead of zeroing it", () => {
        const doc = {
            id: "v1",
            url: "/v1",
            title: "v1",
            text: "",
            source: "guide" as const,
            vector: [1, 0],
        };
        expect(cosineSimilarity([1, 0], doc)).toBeCloseTo(1, 5);
        expect(cosineSimilarity([0, 1], doc)).toBeCloseTo(0, 5);
    });

    it("returns consistent results across repeated calls for the same doc", () => {
        const quantized = quantizeVector([0.2, -0.4, 0.6])!;
        const doc = {
            id: "x",
            url: "/x",
            title: "x",
            text: "",
            source: "guide" as const,
            q: quantized.q,
            scale: quantized.scale,
        };
        expect(dequantizeVector(doc)).toEqual(dequantizeVector(doc));
    });
});

describe("mergeResults", () => {
    it("dedupes by url and sorts by normalized score descending", () => {
        const semantic: ScoredResult[] = [
            { url: "/a", title: "A", text: "", source: "guide", score: 0.9, matchedBy: "semantic" },
            { url: "/b", title: "B", text: "", source: "guide", score: 0.7, matchedBy: "semantic" },
        ];
        const keyword: ScoredResult[] = [
            { url: "/b", title: "B", text: "", source: "guide", score: 5, matchedBy: "keyword" },
            { url: "/c", title: "C", text: "", source: "guide", score: 3, matchedBy: "keyword" },
        ];
        const merged = mergeResults(semantic, keyword);
        const urls = merged.map((m) => m.url);
        expect(urls).toEqual(["/a", "/b", "/c"]);
        // /b appears once.
        expect(merged.filter((m) => m.url === "/b")).toHaveLength(1);
    });

    it("tags matchedBy: both / semantic / keyword", () => {
        const semantic: ScoredResult[] = [
            { url: "/a", title: "A", text: "", source: "guide", score: 0.9, matchedBy: "semantic" },
            { url: "/b", title: "B", text: "", source: "guide", score: 0.7, matchedBy: "semantic" },
        ];
        const keyword: ScoredResult[] = [
            { url: "/b", title: "B", text: "", source: "guide", score: 5, matchedBy: "keyword" },
            { url: "/c", title: "C", text: "", source: "guide", score: 3, matchedBy: "keyword" },
        ];
        const merged = mergeResults(semantic, keyword);
        const byUrl = Object.fromEntries(merged.map((m) => [m.url, m.matchedBy]));
        expect(byUrl["/a"]).toBe("semantic");
        expect(byUrl["/b"]).toBe("both");
        expect(byUrl["/c"]).toBe("keyword");
    });

    it("handles empty inputs", () => {
        expect(mergeResults([], [])).toEqual([]);
    });
});

/**
 * Sync guards between the pinned @huggingface/transformers devDependency,
 * the CDN URL the TypeDoc bridge loads at runtime, and the model revision
 * shared by the indexer and the search UI. All three must agree: the
 * build-time index and the browser query embedding come from different
 * copies of the library, and a version or revision mismatch silently
 * degrades cosine rankings.
 */
describe("transformers version sync", () => {
    it("CDN URL in anilink-search.js matches the pinned package.json version", () => {
        const bridgePath = join(process.cwd(), "docs-src", "lib", "anilink-search.js");
        const bridge = readFileSync(bridgePath, "utf8");
        const cdnMatch = /@huggingface\/transformers@(\d+\.\d+\.\d+)\//.exec(bridge);
        expect(cdnMatch, `TRANSFORMERS_CDN version not found in ${bridgePath}`).not.toBeNull();

        const pkg = JSON.parse(readFileSync(join(process.cwd(), "package.json"), "utf8")) as {
            devDependencies: Record<string, string>;
        };
        const pinned = pkg.devDependencies["@huggingface/transformers"]!;
        const pinnedVersion = /^\d+\.\d+\.\d+$/.test(pinned)
            ? pinned
            : (/\d+\.\d+\.\d+/.exec(pinned)?.[0] ?? "");

        expect(
            cdnMatch![1] === pinnedVersion,
            `@huggingface/transformers is pinned to ${pinnedVersion} in package.json but the TypeDoc bridge loads ${cdnMatch![1]} from the CDN. Update TRANSFORMERS_CDN in docs-src/lib/anilink-search.js (or the devDependency in package.json) so both use the same version.`
        ).toBe(true);
    });

    it("model revision in search-rank.ts matches the generator constants", () => {
        const rankPath = join(process.cwd(), "docs-src", "lib", "search-rank.ts");
        const rank = readFileSync(rankPath, "utf8");
        const revisionMatch = /SEARCH_MODEL_REVISION\s*=\s*"([0-9a-f]+)"/.exec(rank);
        expect(revisionMatch, `SEARCH_MODEL_REVISION not found in ${rankPath}`).not.toBeNull();

        const generator = readFileSync(
            join(process.cwd(), "scripts", "generate-search-index.ts"),
            "utf8"
        );
        // The generator must embed with the shared constant (imported from
        // search-rank.ts), not a locally duplicated revision string.
        expect(
            generator.includes("SEARCH_MODEL_REVISION"),
            `scripts/generate-search-index.ts no longer references SEARCH_MODEL_REVISION; it must embed with the same revision as docs-src/lib/search-rank.ts or cosine rankings silently degrade.`
        ).toBe(true);
        expect(revisionMatch![1]).toBe(SEARCH_MODEL_REVISION);
    });
});

/**
 * The TypeDoc bridge is plain JS with no type checking, so its two pure
 * ranking helpers are evaluated directly from the shipped source — the
 * same pattern the consent suite uses for CONSENT_BOOT_SCRIPT — rather
 * than trusting a re-implementation.
 */
describe("anilink-search bridge functions", () => {
    /**
     * Extract a top-level `function NAME(...) { ... }` block from the bridge
     * source by brace matching, so the tests run the exact shipped code.
     */
    function extractBridgeFunction(name: string): string {
        const bridgePath = join(process.cwd(), "docs-src", "lib", "anilink-search.js");
        const bridge = readFileSync(bridgePath, "utf8");
        const start = bridge.indexOf(`function ${name}(`);
        expect(start, `function ${name} not found in ${bridgePath}`).toBeGreaterThan(-1);
        const open = bridge.indexOf("{", start);
        let depth = 0;
        for (let i = open; i < bridge.length; i++) {
            if (bridge[i] === "{") depth++;
            else if (bridge[i] === "}") {
                depth--;
                if (depth === 0) return bridge.slice(start, i + 1);
            }
        }
        throw new Error(`unbalanced braces extracting ${name} from ${bridgePath}`);
    }

    /** Evaluate a named bridge function in an isolated scope. */
    function loadBridgeFunction<T>(name: string): T {
        return new Function(`${extractBridgeFunction(name)}; return ${name};`)() as T;
    }

    const docVector = loadBridgeFunction<(doc: unknown) => number[] | null>("docVector");
    const cosine = loadBridgeFunction<(a: number[], b: number[]) => number>("cosine");

    it("docVector returns v1 float vectors and reconstructs v2 int8 vectors", () => {
        // v1: full-precision floats stored directly.
        expect(docVector({ vector: [0.25, -0.5] })).toEqual([0.25, -0.5]);
        // v2: int8 codes + scale reconstruct the floats (q[i] / 127 * scale).
        expect(docVector({ q: [127, -127], scale: 0.5 })).toEqual([0.5, -0.5]);
        expect(docVector({ q: [64, 32], scale: 1 })).toEqual([64 / 127, 32 / 127]);
    });

    it("docVector returns null for docs with no usable vector data", () => {
        expect(docVector({})).toBeNull();
        expect(docVector({ q: [127] })).toBeNull();
        expect(docVector({ scale: 0.5 })).toBeNull();
    });

    it("cosine returns 0 on length mismatch instead of a wrong or NaN score", () => {
        expect(cosine([1, 0], [1, 0, 0])).toBe(0);
        expect(cosine([1, 0], [1])).toBe(0);
    });
});

describe("anilink-search bridge wiring", () => {
    it("debounces input and discards stale search results", () => {
        const bridge = readFileSync(
            join(process.cwd(), "docs-src", "lib", "anilink-search.js"),
            "utf8"
        );
        // Input goes through a debounce, not straight to runSearch.
        expect(bridge.includes('input.addEventListener("input", scheduleSearch)')).toBe(true);
        // Each run captures a monotonic token; a stale phase must not
        // overwrite newer results or clobber the newer run's loading flags.
        expect(bridge.includes("var token = ++searchToken;")).toBe(true);
        const staleGuards = bridge.match(/if \(token !== searchToken\) return;/g) ?? [];
        expect(staleGuards.length).toBeGreaterThanOrEqual(2);
        // A pending debounce must not fire after the modal closes.
        expect(/function closeModal\(\) \{[\s\S]*?clearTimeout\(debounceTimer\)/.test(bridge)).toBe(
            true
        );
    });
});
