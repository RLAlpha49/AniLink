import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, extname, join, normalize, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, type Plugin } from "vitepress";

const docsConfigDir = dirname(fileURLToPath(import.meta.url));
const packageJsonPath = normalize(join(docsConfigDir, "..", "..", "package.json"));
const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8")) as {
    version?: unknown;
};

const SITE_URL = "https://anilink.alpha49.com";
const DEFAULT_SITE_DESCRIPTION =
    "AniLink is the TypeScript docs and reference for AniList and MyAnimeList integrations, including authentication, paging, GraphQL queries, and API patterns.";

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
        // `/typedoc` and `/typedoc/` both map to the typedoc index page.
        const relative =
            decoded === "/typedoc" || decoded === "/typedoc/"
                ? ""
                : decoded.replace(/^\/typedoc\//, "");
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
    themeConfig: {
        search: {
            provider: "local",
            options: {
                translations: {
                    button: { buttonText: "Search docs" },
                },
            },
        },
    },
    head: [
        ["meta", { name: "theme-color", content: "#0b1220" }],
        ["meta", { name: "robots", content: "index,follow" }],
        ["meta", { property: "og:site_name", content: "AniLink" }],
        ["meta", { name: "twitter:site", content: "@AniLinkAPI" }],
        ["link", { rel: "icon", type: "image/svg+xml", href: "/logo.svg" }],
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

        return [
            ["meta", { name: "description", content: description }],
            ["meta", { property: "og:title", content: pageTitle }],
            ["meta", { property: "og:description", content: description }],
            ["meta", { property: "og:type", content: "website" }],
            ["meta", { property: "og:url", content: canonicalUrl }],
            ["meta", { property: "og:image", content: `${SITE_URL}/logo.png` }],
            ["meta", { name: "twitter:card", content: "summary_large_image" }],
            ["meta", { name: "twitter:title", content: pageTitle }],
            ["meta", { name: "twitter:description", content: description }],
            ["meta", { name: "twitter:image", content: `${SITE_URL}/logo.png` }],
            ["script", { type: "application/ld+json" }, JSON.stringify(jsonLd)],
            ["link", { rel: "canonical", href: canonicalUrl }],
        ];
    },
});
