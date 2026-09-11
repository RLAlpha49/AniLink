/**
 * Build-time generator for `docs-src/public/llms.txt`.
 *
 * Run: `npx tsx scripts/generate-llms-txt.ts` (or `npm run docs:llms`).
 *
 * Derives the LLM-facing site index from the same sources the site itself
 * uses — the page inventory in `docs-src/lib/content.ts` and each page's
 * frontmatter `description` — so the index cannot drift from the pages it
 * lists. Regenerate via `npm run docs:generate` whenever pages or
 * frontmatter change so the committed file stays current.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { flatPages, type DocPage } from "../docs-src/lib/content";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "..");
const SITE_URL = "https://anilink.alpha49.com";

/** Section headings in output order, keyed by the `DocPage.section` tag. */
const SECTION_TITLES: Record<DocPage["section"], string> = {
    start: "Start here",
    core: "Core concepts",
    cookbook: "Cookbook",
    anilist: "AniList guides",
    mal: "MyAnimeList guides",
    reference: "Operations",
};

/** Read the frontmatter `description` of a docs-src page. */
function frontmatterDescription(relativePath: string): string {
    const file = join(ROOT, "docs-src", relativePath);
    const md = readFileSync(file, "utf8");
    const description = /^description: "(.*)"$/m.exec(md)?.[1];
    if (!description) {
        throw new Error(`Missing frontmatter description in ${file}`);
    }
    return description;
}

/** Map a page path to its docs-src markdown file. */
function sourceForPage(pagePath: string): string {
    if (pagePath === "/operations/index") return "operations/index.md";
    if (pagePath === "/") return "index.md";
    return `${pagePath.replace(/^\//, "")}.md`;
}

/** One llms.txt entry: `- [Title](url): description`. */
function entryFor(page: DocPage): string {
    const url =
        page.path === "/operations/index" ? `${SITE_URL}/operations/` : `${SITE_URL}${page.path}`;
    const description = frontmatterDescription(sourceForPage(page.path));
    return `- [${page.title}](${url}): ${description}`;
}

/**
 * Generate the complete llms.txt content.
 *
 * @returns The file text: site header, landing entry, then one section per
 *   navigation group, each entry derived from page frontmatter.
 */
export function generateLlmsTxt(): string {
    const landing = readFileSync(join(ROOT, "docs-src", "index.md"), "utf8");
    const landingDescription = /^description: "(.*)"$/m.exec(landing)?.[1];
    if (!landingDescription) {
        throw new Error("Missing frontmatter description in docs-src/index.md");
    }

    const lines: string[] = [
        "# AniLink",
        "",
        `> ${landingDescription}`,
        "",
        `- [AniLink home](${SITE_URL}/): ${landingDescription}`,
        "",
    ];

    const sections: DocPage["section"][] = [
        "start",
        "core",
        "cookbook",
        "anilist",
        "mal",
        "reference",
    ];
    for (const section of sections) {
        const pages = flatPages().filter((p) => p.section === section);
        if (pages.length === 0) continue;
        lines.push(`## ${SECTION_TITLES[section]}`);
        lines.push("");
        for (const page of pages) lines.push(entryFor(page));
        lines.push("");
    }

    lines.push("## API Reference");
    lines.push("");
    lines.push(
        `- [TypeDoc API reference](${SITE_URL}/typedoc/): Generated API reference for every public class, interface, type, and function.`
    );
    lines.push(
        `- [TypeDoc llms.txt](${SITE_URL}/typedoc/llms.txt): Machine-readable index of the TypeDoc API reference pages.`
    );
    lines.push("");

    return lines.join("\n");
}

// CLI entry: `npx tsx scripts/generate-llms-txt.ts`
if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
    const outPath = join(ROOT, "docs-src", "public", "llms.txt");
    writeFileSync(outPath, generateLlmsTxt(), "utf8");
    console.log(`Wrote llms.txt to ${outPath}`);
}
