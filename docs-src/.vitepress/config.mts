import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, extname, join, normalize, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, type HeadConfig, type Plugin } from "vitepress";
import { CONSENT_BOOT_SCRIPT } from "../lib/consent.mjs";

const docsConfigDir = dirname(fileURLToPath(import.meta.url));
const packageJsonPath = normalize(join(docsConfigDir, "..", "..", "package.json"));
const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8")) as {
    version?: unknown;
};

const SITE_URL = "https://anilink.alpha49.com";
const DEFAULT_SITE_DESCRIPTION =
    "AniLink is the TypeScript docs and reference for AniList and MyAnimeList integrations, including authentication, paging, GraphQL queries, and API patterns.";

const SOCIAL_CARD_ALT = "AniLink — typed AniList and MyAnimeList client for TypeScript";

if (typeof packageJson.version !== "string" || packageJson.version.length === 0) {
    throw new Error(`Missing valid version in ${packageJsonPath}`);
}

function routeFromRelativePath(relativePath: string | undefined): string {
    if (!relativePath) return "/";
    const normalized = relativePath.replaceAll("\\", "/");
    if (normalized === "index.md") return "/";
    const withoutExt = normalized.replace(/\.md$/, "");
    const withoutIndex = withoutExt.replace(/\/index$/, "");
    return `/${withoutIndex}`;
}

function describeRouteContext(route: string): string {
    if (route.includes("/guides/anilist") || route.includes("/operations/anilist")) {
        return "AniList";
    }
    if (route.includes("/guides/mal") || route.includes("/operations/mal")) {
        return "MyAnimeList";
    }
    if (route.includes("/guides")) {
        return "integration guide";
    }
    if (route.includes("/operations")) {
        return "operation reference";
    }
    return "documentation";
}

function pageDescriptionFor(title: string | undefined, relativePath: string | undefined): string {
    const route = routeFromRelativePath(relativePath);
    const baseTitle = title?.trim() || "AniLink documentation";
    const context = describeRouteContext(route);

    return `${baseTitle} — AniLink ${context} for TypeScript. Learn the patterns, client setup, and API usage needed to integrate AniList and MyAnimeList reliably.`;
}

/**
 * Map a sitemap URL back to the docs-src markdown file that produced it.
 *
 * Sitemap URLs carry no leading slash and no extension: "" is the landing
 * page, "guides/anilist/pagination" is a regular page, and "operations/" is a
 * directory index. Returns null when no source file matches so callers can
 * fall back.
 */
function sourceFileForSitemapUrl(url: string): string | null {
    const route = url.replace(/\/+$/, "");
    const candidates = route === "" ? ["index.md"] : [`${route}.md`, join(route, "index.md")];
    for (const candidate of candidates) {
        const file = normalize(join(docsConfigDir, "..", candidate));
        if (existsSync(file) && statSync(file).isFile()) {
            return file;
        }
    }
    return null;
}

/**
 * File → last-commit-date map for every docs-src page, built with one git
 * process. `git log --name-only` walks history newest-first; the first
 * (newest) commit touching each file wins. Files with no history (new,
 * uncommitted pages) are absent from the map.
 *
 * Returns an empty map when git is unavailable or the build runs outside a
 * repository — callers then omit lastmod rather than guessing.
 */
function gitLastmodMap(): Map<string, string> {
    const map = new Map<string, string>();
    try {
        // One process for the whole tree instead of one per sitemap URL
        // (a per-URL spawn cost ~0.5s each on Windows, ~15s per build).
        const output = execFileSync(
            "git",
            ["log", "--format=%cI", "--name-only", "--", "docs-src"],
            {
                cwd: normalize(join(docsConfigDir, "..", "..")),
                encoding: "utf8",
                stdio: ["ignore", "pipe", "ignore"],
                maxBuffer: 32 * 1024 * 1024,
            }
        );
        let date: string | null = null;
        for (const line of output.split("\n")) {
            const trimmed = line.trim();
            if (trimmed === "") continue;
            if (/^\d{4}-\d{2}-\d{2}T/.test(trimmed)) {
                date = trimmed;
            } else if (date !== null) {
                // Git prints repo-relative paths with forward separators;
                // make them absolute and OS-normalized so the sitemap
                // lookup (which builds absolute paths) matches on every
                // platform. History walks newest-first, so only the first
                // (newest) commit touching each file sets its date.
                const absolute = normalize(join(docsConfigDir, "..", "..", trimmed));
                if (!map.has(absolute)) {
                    map.set(absolute, date);
                }
            }
        }
    } catch {
        // No git, shallow history, or not a repo: leave the map empty.
    }
    return map;
}

/**
 * Last-modified timestamp for a sitemap URL, as an ISO 8601 string — or
 * undefined to omit the field.
 *
 * Uses the file's last git commit date. When the date cannot be resolved
 * (uncommitted page, no git history, git unavailable), the lastmod field is
 * omitted rather than stamped with the build time: a sitemap whose every
 * entry says "modified just now" on each deploy teaches crawlers to ignore
 * the field. The sitemap spec allows omission.
 */
function lastmodForSitemapUrl(url: string, gitDates: Map<string, string>): string | undefined {
    const file = sourceFileForSitemapUrl(url);
    if (!file) return undefined;
    return gitDates.get(file);
}

/**
 * Vite plugin that serves the TypeDoc output (`../docs/typedoc`) from the
 * VitePress dev server under `/typedoc/...`.
 *
 * In production the built site (`../docs`) is served statically, so the
 * TypeDoc pages live alongside the VitePress output and Just Work. In dev,
 * VitePress serves from `docs-src/` (the `srcDir`), which does not contain
 * the TypeDoc output, so `/typedoc/...` requests fall through to the SPA
 * `index.html` fallback and render the VitePress 404. This middleware
 * mirrors the production layout during `vitepress dev`.
 *
 * It also handles the clean-URL form: because `cleanUrls` is enabled, the
 * browser may request `/typedoc/classes/AniLink.AniLink` (no `.html`); the
 * middleware rewrites that to the on-disk `.html` file, matching how
 * GitHub Pages serves clean URLs.
 */
function serveTypedoc(): Plugin {
    // `../docs/typedoc` relative to this config file.
    const configDir = dirname(fileURLToPath(import.meta.url));
    const typedocRoot = normalize(join(configDir, "..", "..", "docs", "typedoc"));

    const MIME: Record<string, string> = {
        ".html": "text/html; charset=utf-8",
        ".js": "text/javascript; charset=utf-8",
        ".mjs": "text/javascript; charset=utf-8",
        ".css": "text/css; charset=utf-8",
        ".json": "application/json; charset=utf-8",
        ".svg": "image/svg+xml",
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".gif": "image/gif",
        ".webp": "image/webp",
        ".ico": "image/x-icon",
        ".txt": "text/plain; charset=utf-8",
        ".woff": "font/woff",
        ".woff2": "font/woff2",
    };

    /** Resolve a `/typedoc/...` URL to a file under `typedocRoot`, or null. */
    function resolveFile(urlPath: string): string | null {
        const decoded = decodeURIComponent(urlPath);
        const relative = decoded === "/typedoc/" ? "" : decoded.replace(/^\/typedoc\//, "");
        if (relative.startsWith("..") || relative.includes("\0")) return null;

        const candidate = normalize(join(typedocRoot, relative));
        // Guard against path traversal outside the typedoc root.
        if (!candidate.startsWith(typedocRoot + sep) && candidate !== typedocRoot) {
            return null;
        }

        // Direct file hit.
        if (existsSync(candidate) && statSync(candidate).isFile()) {
            return candidate;
        }

        // Clean-URL fallback: `/foo/bar` -> `/foo/bar.html`. TypeDoc page names
        // contain dots (e.g. `AniLink.AniLink`), so checking `extname` is
        // unreliable; only skip when the path already ends in `.html`.
        if (!decoded.endsWith(".html")) {
            const withHtml = candidate + ".html";
            if (existsSync(withHtml) && statSync(withHtml).isFile()) {
                return withHtml;
            }
        }

        // Directory index: `/foo/` -> `/foo/index.html`.
        if (decoded.endsWith("/")) {
            const index = join(candidate, "index.html");
            if (existsSync(index) && statSync(index).isFile()) {
                return index;
            }
        }

        return null;
    }

    return {
        name: "anilink:serve-typedoc",
        configureServer(server) {
            // Insert before Vite's built-in SPA fallback so typedoc files win.
            server.middlewares.use((req, res, next) => {
                const url = req.url ?? "";
                // Strip query/hash before resolving.
                const path = url.split("?", 1)[0].split("#", 1)[0];
                if (!path.startsWith("/typedoc/") && path !== "/typedoc") {
                    return next();
                }

                if (path === "/typedoc") {
                    const searchAndHash = url.slice(path.length);
                    res.statusCode = 301;
                    res.setHeader("Location", `/typedoc/${searchAndHash}`);
                    res.end();
                    return;
                }

                const file = resolveFile(path);
                if (!file) return next();

                try {
                    const body = readFileSync(file);
                    res.setHeader(
                        "Content-Type",
                        MIME[extname(file)] ?? "application/octet-stream"
                    );
                    res.end(body);
                } catch {
                    return next();
                }
            });
        },
    };
}

/**
 * Vite plugin that serves the precomputed search index (`../docs/search-index.json`)
 * from the VitePress dev server under `/search-index.json`.
 *
 * In production the built site (`../docs`) is served statically, so the index
 * lives alongside the VitePress output and is served as a normal static file.
 * In dev, VitePress serves from `docs-src/` (the `srcDir`), which does not
 * contain the index, so `/search-index.json` would fall through to the SPA
 * `index.html` fallback. This middleware mirrors the production layout during
 * `vitepress dev`.
 */
function serveSearchIndex(): Plugin {
    const configDir = dirname(fileURLToPath(import.meta.url));
    const indexFile = normalize(join(configDir, "..", "..", "docs", "search-index.json"));

    return {
        name: "anilink:serve-search-index",
        configureServer(server) {
            server.middlewares.use((req, res, next) => {
                const url = req.url ?? "";
                const path = url.split("?", 1)[0].split("#", 1)[0];
                if (path !== "/search-index.json") return next();
                if (!existsSync(indexFile)) return next();
                try {
                    const body = readFileSync(indexFile);
                    res.setHeader("Content-Type", "application/json; charset=utf-8");
                    res.setHeader("Cache-Control", "no-cache");
                    res.end(body);
                } catch {
                    return next();
                }
            });
        },
    };
}

export default defineConfig({
    lang: "en-US",
    title: "AniLink",
    description: DEFAULT_SITE_DESCRIPTION,
    base: "/",
    srcDir: ".",
    outDir: "../docs",
    cleanUrls: true,
    sitemap: {
        hostname: SITE_URL,
        // Drop the 404 page (it must not be crawlable) and stamp every
        // remaining entry with a lastmod date from its git history. Entries
        // whose date cannot be resolved keep lastmod omitted (undefined)
        // instead of a misleading build-time stamp.
        transformItems: (items) => {
            const gitDates = gitLastmodMap();
            return items
                .filter((item) => {
                    const path = item.url.replace(/\/+$/, "");
                    return path !== "404" && !path.endsWith("/404");
                })
                .map((item) => ({ ...item, lastmod: lastmodForSitemapUrl(item.url, gitDates) }));
        },
    },
    ignoreDeadLinks: [/^\/typedoc\//],
    srcExclude: ["**/README.md", ".vitepress/**", "lib/**"],
    markdown: {
        headers: true,
    },
    appearance: false,
    vite: {
        define: {
            __ANILINK_VERSION__: JSON.stringify(packageJson.version),
        },
        plugins: [serveTypedoc(), serveSearchIndex()],
    },
    head: [
        ["link", { rel: "preconnect", href: "https://fonts.googleapis.com" }],
        ["link", { rel: "preconnect", href: "https://fonts.gstatic.com", crossorigin: "" }],
        [
            "link",
            {
                rel: "stylesheet",
                href: "https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@400;500;700;800&family=Zen+Old+Mincho:wght@400;700;900&family=IBM+Plex+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap",
            },
        ],
        ["meta", { name: "theme-color", content: "#0b1220" }],
        ["meta", { property: "og:site_name", content: "AniLink" }],
        ["meta", { name: "twitter:site", content: "@AniLinkAPI" }],
        ["link", { rel: "icon", type: "image/svg+xml", href: "/logo.svg" }],
        ["script", {}, CONSENT_BOOT_SCRIPT],
        [
            "script",
            { id: "anilink-restore-theme" },
            `(() => {
               try {
                 const stored = localStorage.getItem('anilink-docs-theme');
                 const dark = stored
                   ? stored === 'dark'
                   : window.matchMedia('(prefers-color-scheme: dark)').matches;
                 if (dark) document.documentElement.classList.add('dark');
               } catch (e) {}
             })();`,
        ],
    ],
    transformHead: ({ pageData, title }) => {
        const route = pageData.relativePath ? routeFromRelativePath(pageData.relativePath) : "/";
        const isNotFound = route === "/404";
        const canonicalUrl = `${SITE_URL}${route === "/" ? "/" : route}`;
        const pageTitle = title ? `${title} | AniLink` : "AniLink";
        const description =
            (pageData.frontmatter.description as string | undefined) ||
            pageDescriptionFor(title, pageData.relativePath);
        const jsonLd = {
            "@context": "https://schema.org",
            "@type": route === "/" ? "WebSite" : "WebPage",
            name: pageTitle,
            description,
            url: canonicalUrl,
            inLanguage: "en-US",
            isPartOf: {
                "@type": "WebSite",
                name: "AniLink",
                url: SITE_URL,
            },
            publisher: {
                "@type": "Organization",
                name: "AniLink",
                url: SITE_URL,
                logo: `${SITE_URL}/logo.png`,
            },
        };

        const head: HeadConfig[] = [
            ["meta", { name: "robots", content: isNotFound ? "noindex,follow" : "index,follow" }],
            ["meta", { name: "description", content: description }],
            ["meta", { property: "og:title", content: pageTitle }],
            ["meta", { property: "og:description", content: description }],
            ["meta", { property: "og:type", content: "website" }],
            ["meta", { property: "og:url", content: canonicalUrl }],
            ["meta", { property: "og:image", content: `${SITE_URL}/social-card.png` }],
            ["meta", { property: "og:image:width", content: "1200" }],
            ["meta", { property: "og:image:height", content: "630" }],
            ["meta", { property: "og:image:alt", content: SOCIAL_CARD_ALT }],
            ["meta", { name: "twitter:card", content: "summary_large_image" }],
            ["meta", { name: "twitter:title", content: pageTitle }],
            ["meta", { name: "twitter:description", content: description }],
            ["meta", { name: "twitter:image", content: `${SITE_URL}/social-card.png` }],
            ["meta", { name: "twitter:image:alt", content: SOCIAL_CARD_ALT }],
            ["script", { type: "application/ld+json" }, JSON.stringify(jsonLd)],
        ];

        if (!isNotFound) {
            head.push(["link", { rel: "canonical", href: canonicalUrl }]);
        }

        return head;
    },
});
