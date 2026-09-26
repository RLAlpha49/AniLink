/**
 * Unit tests for the semantic-search index builder.
 *
 * Covers the pure chunking helpers (markdown, operation manifest, TypeDoc
 * HTML) and the ranking math (cosine similarity, result merge). The embedding
 * + file-writing CLI is exercised end-to-end via `npm run docs:search-index`,
 * not here.
 */
import { afterEach, describe, it, expect, vi } from "vitest";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
    chunkMarkdown,
    chunkOperations,
    chunkTypedoc,
    cosineSimilarity,
    createTypedocSearchConfig,
    mergeResults,
    quantizeVector,
    dequantizeVector,
    shouldIndexGuideMarkdown,
    TYPEDOC_SEARCH_CONFIG_ASSET,
    TYPEDOC_SEARCH_CORE_ASSET,
    TYPEDOC_SEARCH_BRIDGE_ASSET,
    writeTypedocSearchAssets,
    type ScoredResult,
} from "../scripts/generate-search-index";
import type { ReferenceManifest } from "../scripts/generate-operation-reference";
import {
    docVector,
    escapeHtml,
    createSearchCoordinator,
    keywordResults,
    keywordScore,
    semanticResults,
    SEARCH_MODEL_ID,
    SEARCH_MODEL_REVISION,
    type SearchDoc,
} from "../docs-src/lib/search-rank";

const temporaryRoots: string[] = [];

afterEach(() => {
    vi.useRealTimers();
    for (const root of temporaryRoots.splice(0)) rmSync(root, { recursive: true, force: true });
});

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

describe("guide markdown indexing", () => {
    it("excludes the 404 page and internal markdown paths", () => {
        expect(shouldIndexGuideMarkdown("404.md")).toBe(false);
        expect(shouldIndexGuideMarkdown(".vitepress/README.md")).toBe(false);
        expect(shouldIndexGuideMarkdown("lib/README.md")).toBe(false);
        expect(shouldIndexGuideMarkdown("guides/getting-started.md")).toBe(true);
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
    it("TypeDoc runtime config uses the pinned CDN version and shared model constants", () => {
        const bridgePath = join(process.cwd(), "docs-src", "lib", "anilink-search.js");
        const bridge = readFileSync(bridgePath, "utf8");

        const pkg = JSON.parse(readFileSync(join(process.cwd(), "package.json"), "utf8")) as {
            devDependencies: Record<string, string>;
        };
        const pinnedVersion = pkg.devDependencies["@huggingface/transformers"]!;
        const runtimeConfig = createTypedocSearchConfig(
            SEARCH_MODEL_ID,
            SEARCH_MODEL_REVISION,
            pinnedVersion
        );

        expect(runtimeConfig).toContain(
            `https://cdn.jsdelivr.net/npm/@huggingface/transformers@${pinnedVersion}/dist/transformers.min.js`
        );
        expect(runtimeConfig).toContain(`SEARCH_MODEL_ID = ${JSON.stringify(SEARCH_MODEL_ID)}`);
        expect(runtimeConfig).toContain(
            `SEARCH_MODEL_REVISION = ${JSON.stringify(SEARCH_MODEL_REVISION)}`
        );
        expect(bridge).toContain(`var SEARCH_CORE_ASSET = "${TYPEDOC_SEARCH_CORE_ASSET}";`);
        expect(bridge).toContain(`var SEARCH_CONFIG_ASSET = "${TYPEDOC_SEARCH_CONFIG_ASSET}";`);
        expect(bridge).toContain("new URL(SEARCH_CORE_ASSET, assetUrl)");
        expect(bridge).toContain("new URL(SEARCH_CONFIG_ASSET, assetUrl)");
    });

    it("rejects a ranged transformers version", () => {
        expect(() =>
            createTypedocSearchConfig(SEARCH_MODEL_ID, SEARCH_MODEL_REVISION, "^4.3.0")
        ).toThrow(/exact pinned version/);
    });

    it("writes the shared search modules to the TypeDoc assets directory", () => {
        const root = mkdtempSync(join(tmpdir(), "anilink-search-assets-"));
        temporaryRoots.push(root);
        const typedocRoot = join(root, "typedoc");
        const assetsRoot = join(typedocRoot, "assets");

        writeTypedocSearchAssets(process.cwd(), typedocRoot);

        expect(readFileSync(join(assetsRoot, TYPEDOC_SEARCH_CORE_ASSET), "utf8")).toBe(
            readFileSync(join(process.cwd(), "docs-src", "lib", "search-core.js"), "utf8")
        );
        expect(readFileSync(join(assetsRoot, TYPEDOC_SEARCH_BRIDGE_ASSET), "utf8")).toBe(
            readFileSync(
                join(process.cwd(), "docs-src", "lib", TYPEDOC_SEARCH_BRIDGE_ASSET),
                "utf8"
            )
        );
        const config = readFileSync(join(assetsRoot, TYPEDOC_SEARCH_CONFIG_ASSET), "utf8");
        expect(config).toContain(`SEARCH_MODEL_ID = ${JSON.stringify(SEARCH_MODEL_ID)}`);
        expect(config).toContain(
            `SEARCH_MODEL_REVISION = ${JSON.stringify(SEARCH_MODEL_REVISION)}`
        );
    });

    it("validates the package pin before writing any TypeDoc search assets", () => {
        const root = mkdtempSync(join(tmpdir(), "anilink-invalid-search-assets-"));
        temporaryRoots.push(root);
        const typedocRoot = join(root, "typedoc");
        const assetsRoot = join(typedocRoot, "assets");
        mkdirSync(join(root, "docs-src", "lib"), { recursive: true });
        mkdirSync(assetsRoot, { recursive: true });
        writeFileSync(
            join(root, "package.json"),
            JSON.stringify({ devDependencies: { "@huggingface/transformers": "^4.3.0" } })
        );
        writeFileSync(join(root, "docs-src", "lib", "search-core.js"), "export {};\n");

        expect(() => writeTypedocSearchAssets(root, typedocRoot)).toThrow(/exact pinned version/);
        expect(existsSync(join(assetsRoot, TYPEDOC_SEARCH_CORE_ASSET))).toBe(false);
        expect(existsSync(join(assetsRoot, TYPEDOC_SEARCH_CONFIG_ASSET))).toBe(false);
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
 * The TypeDoc bridge loads its ranking helpers from the same runtime-agnostic
 * module as the VitePress UI, so exercise that shared implementation directly.
 */
describe("shared search core", () => {
    function searchDoc(overrides: Partial<SearchDoc> = {}): SearchDoc {
        return {
            id: "x",
            url: "/x",
            title: "x",
            text: "",
            source: "guide",
            ...overrides,
        };
    }

    it("docVector returns v1 float vectors and reconstructs v2 int8 vectors", () => {
        // v1: full-precision floats stored directly.
        expect(docVector({ vector: [0.25, -0.5] })).toEqual([0.25, -0.5]);
        expect(docVector(searchDoc({ vector: [0.25, -0.5] }))).toEqual([0.25, -0.5]);
        // v2: int8 codes + scale reconstruct the floats (q[i] / 127 * scale).
        expect(docVector(searchDoc({ q: [127, -127], scale: 0.5 }))).toEqual([0.5, -0.5]);
        expect(docVector(searchDoc({ q: [64, 32], scale: 1 }))).toEqual([64 / 127, 32 / 127]);
    });

    it("docVector returns null for docs with no usable vector data", () => {
        expect(docVector(searchDoc())).toBeNull();
        expect(docVector(searchDoc({ q: [127] }))).toBeNull();
        expect(docVector({ q: [127], scale: null } as never)).toBeNull();
        expect(docVector(searchDoc({ scale: 0.5 }))).toBeNull();
    });

    it("cosineSimilarity returns 0 on length mismatch instead of a wrong or NaN score", () => {
        expect(cosineSimilarity([1, 0], [1, 0, 0])).toBe(0);
        expect(cosineSimilarity([1, 0], [1])).toBe(0);
    });

    it("scores query terms with title weight 3 and body weight 1", () => {
        expect(keywordScore({ title: "Authentication", text: "" }, "auth")).toBe(4);
        expect(keywordScore({ title: "Getting started", text: "auth token" }, "auth")).toBe(1);
        expect(keywordScore({ title: "Getting started", text: "token" }, "missing")).toBe(0);
    });

    it("filters and limits keyword results", () => {
        const results = keywordResults(
            [
                searchDoc({ url: "/auth", title: "Authentication" }),
                searchDoc({ url: "/token", title: "Tokens", text: "auth" }),
                searchDoc({ url: "/other", title: "Other" }),
            ],
            "auth",
            1
        );

        expect(results).toHaveLength(1);
        expect(results[0].url).toBe("/auth");
        expect(results[0].score).toBe(4);
    });

    it("ranks semantic results using indexed vectors", () => {
        const results = semanticResults(
            [
                searchDoc({ url: "/match", vector: [1, 0] }),
                searchDoc({ url: "/other", vector: [0, 1] }),
            ],
            [1, 0]
        );

        expect(results.map((result) => result.url)).toEqual(["/match", "/other"]);
        expect(results[0].score).toBeCloseTo(1, 5);
    });

    it("invalidates older searches and cancels pending debounce callbacks", () => {
        vi.useFakeTimers();
        const coordinator = createSearchCoordinator();
        const first = coordinator.begin();
        const second = coordinator.begin();
        const callback = vi.fn();

        expect(coordinator.isCurrent(first)).toBe(false);
        expect(coordinator.isCurrent(second)).toBe(true);
        coordinator.schedule(callback);
        coordinator.clearDebounce();
        vi.advanceTimersByTime(150);

        expect(callback).not.toHaveBeenCalled();
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
        // The shared coordinator invalidates stale work and preserves newer loading state.
        expect(bridge.includes("var token = searchCoordinator.begin();")).toBe(true);
        const staleGuards = bridge.match(/searchCoordinator\.isCurrent\(token\)/g) ?? [];
        expect(staleGuards.length).toBeGreaterThanOrEqual(3);
        // A pending debounce must not fire after the modal closes.
        expect(
            /function closeModal\(\) \{[\s\S]*?searchCoordinator\.clearDebounce\(\)/.test(bridge)
        ).toBe(true);
    });

    it("registers handlers before imports and preserves native search on failure", () => {
        const bridge = readFileSync(
            join(process.cwd(), "docs-src", "lib", "anilink-search.js"),
            "utf8"
        );
        const initCall = bridge.lastIndexOf("    init();");
        const imports = bridge.indexOf("    Promise.all([", initCall);

        expect(initCall).toBeGreaterThan(-1);
        expect(imports).toBeGreaterThan(initCall);
        expect(bridge).toContain('searchModulesState = "failed";');
        expect(bridge).toContain("openNativeSearch();");
        expect(bridge).toContain("native search remains available");
    });
});
