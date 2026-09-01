/**
 * Build-time generator for the AniLink semantic-search index.
 *
 * Run: `npx tsx scripts/generate-search-index.ts` (or `npm run docs:search-index`).
 *
 * Reads the three doc surfaces — hand-written guides (docs-src markdown), the
 * generated operation reference (`lib/operation-reference/operations.json`), and
 * the TypeDoc API reference (`docs/typedoc` HTML) — chunks each into
 * `SearchDoc` entries, embeds every chunk with `Xenova/bge-small-en-v1.5`, and
 * writes `docs/search-index.json`. The browser loads the same model id and
 * ranks query embeddings against this index with cosine similarity.
 *
 * The pure chunking + math helpers are exported for unit testing.
 */
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import type { ReferenceManifest } from "./generate-operation-reference";

// Re-export the browser-safe types + ranking math so the build script and the
// runtime UI share one source of truth. The shared module has no Node imports.
export {
    cosineSimilarity,
    mergeResults,
    type SearchDoc,
    type SearchIndex,
    type ScoredResult,
} from "../docs-src/lib/search-rank";
import type { SearchDoc, SearchIndex } from "../docs-src/lib/search-rank";

/** Slugify a heading to a VitePress anchor. */
function slugify(heading: string): string {
    return heading
        .toLowerCase()
        .replace(/[^\w\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-");
}

/** Strip YAML frontmatter (leading `---` ... `---` block). CRLF-robust. */
function stripFrontmatter(md: string): string {
    const m = /^---\r?\n[\s\S]*?\r?\n---\r?\n?/.exec(md);
    return m ? md.slice(m[0].length) : md;
}

/** Truncate text to a max length on a word boundary, collapsing code blocks. */
function truncate(text: string, max = 500): string {
    const clean = text
        .replace(/```[\s\S]*?```/g, " ")
        .replace(/\s+/g, " ")
        .trim();
    if (clean.length <= max) return clean;
    return clean.slice(0, clean.lastIndexOf(" ", max)) + "…";
}

/** Remove HTML tags, including an incomplete tag at the end of the input. */
function stripHtmlTags(s: string): string {
    let text = "";
    let inTag = false;
    for (const char of s) {
        if (char === "<") {
            inTag = true;
            text += " ";
        } else if (char === ">" && inTag) {
            inTag = false;
            text += " ";
        } else if (!inTag) {
            text += char;
        }
    }
    return text;
}

/**
 * Guide section titles that are pure navigation/boilerplate and carry no
 * searchable content. These are excluded from the index so they don't dilute
 * semantic results with link-list noise.
 */
const SKIP_SECTIONS = new Set(["Next steps", "Where to go next", "See also", "Further reading"]);

/**
 * Split a markdown doc into one chunk per H2/H3 heading plus a leading
 * page-title chunk for any text before the first heading.
 *
 * @param md Raw markdown source.
 * @param url Page URL (clean-URL form, no `.html`).
 * @param title Page title (from frontmatter or H1).
 * @returns One `SearchDoc` per section.
 */
export function chunkMarkdown(md: string, url: string, title: string): SearchDoc[] {
    const body = stripFrontmatter(md);
    const lines = body.split("\n");
    const chunks: SearchDoc[] = [];
    let currentTitle = title;
    let currentSlug = "";
    let buffer: string[] = [];

    const flush = (): void => {
        const text = buffer.join("\n").trim();
        // Skip boilerplate navigation sections (Next steps, etc.) and chunks
        // whose body is too short to be useful (code-only sections collapse
        // to empty after stripping fenced blocks).
        if (text.length === 0 || SKIP_SECTIONS.has(currentTitle)) {
            buffer = [];
            return;
        }
        const truncated = truncate(text);
        if (truncated.length < 10) {
            buffer = [];
            return;
        }
        chunks.push({
            id: "",
            url: currentSlug ? `${url}#${currentSlug}` : url,
            title: currentTitle,
            text: truncated,
            source: "guide",
        });
        buffer = [];
    };

    for (const line of lines) {
        const h2 = /^## (.+?)\r?$/.exec(line);
        const h3 = /^### (.+?)\r?$/.exec(line);
        if (h2 || h3) {
            flush();
            currentTitle = (h2 ? h2[1] : h3![1]).trim();
            currentSlug = slugify(currentTitle);
        } else if (/^# .+\r?$/.exec(line)) {
            // H1: do not start a new chunk; its following text belongs to the
            // page-title chunk (already seeded with `title`).
            continue;
        } else {
            buffer.push(line);
        }
    }
    flush();
    return chunks;
}

/**
 * Build one `SearchDoc` per operation in the reference manifest.
 *
 * @param manifest Complete operation-reference manifest.
 * @returns One chunk per operation.
 */
export function chunkOperations(manifest: ReferenceManifest): SearchDoc[] {
    return manifest.operations.map((op) => {
        const responseFields = op.response.map((r) => r.name).join(", ");
        const errors = op.errors.map((e) => `${e.error}: ${e.condition}`).join("; ");
        const text = [
            op.purpose,
            `Signature: ${op.signature}`,
            op.auth ? `Auth: ${op.auth}` : "",
            responseFields ? `Returns: ${op.responseType} (${responseFields})` : "",
            errors ? `Errors: ${errors}` : "",
        ]
            .filter(Boolean)
            .join("\n");
        const pageSegment = op.provider === "mal" ? "" : `/${op.category}`;
        return {
            id: "",
            url: `/operations/${op.provider}${pageSegment}#${op.namespace}`,
            title: op.namespace,
            text: truncate(text),
            source: "operation",
        };
    });
}

/**
 * Extract a single chunk from a TypeDoc HTML page: its H1 title and the first
 * comment paragraph. Returns `[]` when the page has no comment.
 *
 * @param html Raw TypeDoc page HTML.
 * @param url Page URL.
 * @returns Zero or one chunk.
 */
export function chunkTypedoc(html: string, url: string): SearchDoc[] {
    // Extract the H1 title, allowing for nested tags (e.g. <code> inside <h1>).
    // Strip the nested tags after extracting so "Class Foo<code>Abstract</code>"
    // becomes "Class Foo Abstract".
    const titleMatch = /<div class="tsd-page-title">[\s\S]*?<h1>([\s\S]*?)<\/h1>/.exec(html);
    const rawTitle = titleMatch ? titleMatch[1].trim() : "";
    const title = rawTitle ? stripHtmlTags(rawTitle).replaceAll(/\s+/g, " ").trim() : "";
    // Skip pages where the title is just the HTML filename (extraction failed).
    if (!title || title.endsWith(".html")) return [];
    const commentMatch = /<div class="tsd-comment tsd-typography">([\s\S]*?)<\/div>/.exec(html);
    if (!commentMatch) return [];
    const firstP = /<p>([\s\S]*?)<\/p>/.exec(commentMatch[1]);
    if (!firstP) return [];
    const text = stripHtmlTags(firstP[1]).replaceAll(/\s+/g, " ").trim();
    if (!text || text.length < 10) return [];
    return [{ id: "", url, title, text: truncate(text), source: "typedoc" }];
}

// ---------------------------------------------------------------------------
// CLI: embed all chunks and write the index.
// ---------------------------------------------------------------------------

const MODEL_ID = "Xenova/bge-small-en-v1.5";
const DIM = 384;
const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "..");

/** Walk a directory recursively for files matching a predicate. */
function walk(root: string, keep: (name: string) => boolean): string[] {
    const out: string[] = [];
    for (const entry of readdirSync(root)) {
        const full = join(root, entry);
        const st = statSync(full);
        if (st.isDirectory()) out.push(...walk(full, keep));
        else if (keep(entry)) out.push(full);
    }
    return out;
}

/** Short stable hash for ids. */
function hashId(s: string): string {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = Math.trunc(h * 31 + (s.codePointAt(i) ?? 0));
    return (h >>> 0).toString(36);
}

/**
 * Inject a `<script>` tag loading the semantic-search bridge into a TypeDoc
 * HTML page, so the same search the VitePress docs use is available on the
 * API reference pages. Idempotent: skips pages that already reference it.
 * The `src` path is relative to the page's depth under `docs/typedoc/`.
 *
 * @param file Absolute path to the TypeDoc HTML file.
 * @param rel Path relative to `docs/` (e.g. `typedoc/classes/Foo.html`).
 */
function injectSearchScript(file: string, rel: string): void {
    const MARKER = "anilink-search.js";
    const html = readFileSync(file, "utf8");
    if (html.includes(MARKER)) return;
    // Depth under docs/typedoc/: `typedoc/classes/Foo.html` → depth 1 → `../assets/`.
    const depth = rel.split("/").length - 2; // -1 for `typedoc`, -1 for filename
    const prefix = "../".repeat(Math.max(0, depth));
    const tag = `<script defer src="${prefix}assets/${MARKER}" id="anilink-search-script"></script>`;
    // Insert before </head> so it loads alongside the other typedoc assets.
    const updated = html.replace("</head>", `${tag}</head>`);
    if (updated !== html) writeFileSync(file, updated, "utf8");
}

/**
 * Index the TypeDoc API reference: sync the custom CSS (which carries the
 * search-modal styles) into the built output, chunk every HTML page, and
 * inject the search bridge script.
 *
 * @param typedocRoot Absolute path to `docs/typedoc`.
 * @param root Absolute path to the repo root.
 * @returns SearchDoc chunks for all TypeDoc pages.
 */
function indexTypedoc(typedocRoot: string, root: string): SearchDoc[] {
    const docsRoot = join(root, "docs");
    const docs: SearchDoc[] = [];
    // Sync the custom CSS so the search-modal styles are current without a
    // full typedoc rebuild (TypeDoc copies it during `typedoc`).
    const cssSrc = join(root, "typedoc-custom.css");
    const cssDest = join(typedocRoot, "assets", "custom.css");
    if (existsSync(cssSrc)) writeFileSync(cssDest, readFileSync(cssSrc, "utf8"), "utf8");

    // Copy the semantic-search bridge JS into the built TypeDoc assets. It
    // lives in `docs-src/lib/` (source) so it survives TypeDoc rebuilds, which
    // regenerate `docs/typedoc/assets/` and would otherwise drop it.
    const bridgeSrc = join(root, "docs-src", "lib", "anilink-search.js");
    const bridgeDest = join(typedocRoot, "assets", "anilink-search.js");
    if (existsSync(bridgeSrc)) writeFileSync(bridgeDest, readFileSync(bridgeSrc, "utf8"), "utf8");

    for (const file of walk(typedocRoot, (n) => n.endsWith(".html"))) {
        const html = readFileSync(file, "utf8");
        const rel = file.slice(docsRoot.length + 1).replaceAll("\\", "/");
        const url = "/" + rel;
        docs.push(...chunkTypedoc(html, url));
        injectSearchScript(file, rel);
    }
    return docs;
}

/** Read the page title (first H1) from a markdown file, or fall back to the name. */
function mdTitle(md: string, fallback: string): string {
    return (/^# (.+?)\r?$/m.exec(md)?.[1] ?? fallback).trim();
}

/** Build-time entrypoint: chunk, embed, and write the index. */
async function main(): Promise<void> {
    const { pipeline } = await import("@huggingface/transformers");
    const extractor = await pipeline("feature-extraction", MODEL_ID, {
        dtype: "q8",
    });

    const docs: SearchDoc[] = [];

    // 1. Guides — skip .vitepress, lib, node_modules.
    const docsSrc = join(ROOT, "docs-src");
    if (existsSync(docsSrc)) {
        for (const file of walk(docsSrc, (n) => n.endsWith(".md"))) {
            if (file.includes(`${sep(".vitepress")}`) || file.includes(`${sep("lib")}`)) continue;
            const md = readFileSync(file, "utf8");
            const rel = file.slice(docsSrc.length + 1).replaceAll("\\", "/");
            const url = "/" + rel.replace(/\.md$/, "");
            const title = mdTitle(md, rel);
            for (const chunk of chunkMarkdown(md, url, title)) docs.push(chunk);
        }
    }

    // 2. Operation reference.
    const opsPath = join(ROOT, "lib", "operation-reference", "operations.json");
    if (existsSync(opsPath)) {
        const manifest: ReferenceManifest = JSON.parse(readFileSync(opsPath, "utf8"));
        docs.push(...chunkOperations(manifest));
    }

    // 3. TypeDoc API reference.
    const typedocRoot = join(ROOT, "docs", "typedoc");
    if (existsSync(typedocRoot)) {
        docs.push(...indexTypedoc(typedocRoot, ROOT));
    }

    // Embed in batches of 16.
    const BATCH = 16;
    for (let i = 0; i < docs.length; i += BATCH) {
        const batch = docs.slice(i, i + BATCH);
        const out = await extractor(
            batch.map((d) => d.text),
            {
                pooling: "mean",
                normalize: true,
            }
        );
        const vectors = out.tolist();
        batch.forEach((d, j) => {
            d.vector = Array.from(vectors[j] as Float32Array);
        });
        process.stdout.write(`  embedded ${Math.min(i + BATCH, docs.length)}/${docs.length}\r`);
    }

    // Stable ids.
    for (const d of docs) d.id = hashId(d.url + "|" + d.title);

    const index: SearchIndex = { model: MODEL_ID, dim: DIM, docs };
    const outPath = join(ROOT, "docs", "search-index.json");
    writeFileSync(outPath, JSON.stringify(index));
    console.log(`\nWrote ${docs.length} chunks to ${outPath}`);
}

/** Join with the OS separator, normalizing for substring checks. */
function sep(part: string): string {
    return process.platform === "win32" ? `\\${part}\\` : `/${part}/`;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
    try {
        await main();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
