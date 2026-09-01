/**
 * Unit tests for the semantic-search index builder.
 *
 * Covers the pure chunking helpers (markdown, operation manifest, TypeDoc
 * HTML) and the ranking math (cosine similarity, result merge). The embedding
 * + file-writing CLI is exercised end-to-end via `npm run docs:search-index`,
 * not here.
 */
import { describe, it, expect } from "vitest";
import {
    chunkMarkdown,
    chunkOperations,
    chunkTypedoc,
    cosineSimilarity,
    mergeResults,
    type ScoredResult,
} from "../scripts/generate-search-index";
import type { ReferenceManifest } from "../scripts/generate-operation-reference";

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
                    response: [{ name: "id", type: "number", description: "The id" }],
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
