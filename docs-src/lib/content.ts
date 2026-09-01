/**
 * Shared content model for the AniLink documentation.
 *
 * The site renders a single page tree at the `docs-src/` root through
 * the unified DocsLayout. This module is the single source of truth for
 * the page inventory, navigation groups, and link helpers.
 */

/** Which provider a page or sidebar entry belongs to. */
export type ProviderTag = "anilist" | "mal" | "shared";

/** A single documentation page rendered by every redesign. */
export interface DocPage {
    /** URL path inside a redesign, without the `/N` prefix. */
    path: string;
    /** Human title used in navigation, TOC, and page headers. */
    title: string;
    /** Short one-line summary shown in redesign indexes. */
    summary: string;
    /** Provider scope chip. */
    provider: ProviderTag;
    /** Which redesign index sections include this page. */
    section: "start" | "core" | "cookbook" | "anilist" | "mal" | "reference";
    /** Nested child pages rendered as an indented sub-list under this entry. */
    children?: DocPage[];
}

/** A labelled group of pages in a redesign's navigation. */
export interface NavGroup {
    title: string;
    pages: DocPage[];
}

/** The full page inventory, in canonical reading order per section. */
export const PAGES: DocPage[] = [
    {
        path: "/introduction",
        title: "Introduction",
        summary: "What AniLink is, and when to reach for each provider.",
        provider: "shared",
        section: "start",
    },
    {
        path: "/getting-started",
        title: "Getting started",
        summary: "Install the package and make your first typed calls.",
        provider: "shared",
        section: "start",
    },
    {
        path: "/provider-configuration",
        title: "Provider configuration",
        summary: "Constructor forms, credential slots, and provider isolation.",
        provider: "shared",
        section: "start",
    },
    {
        path: "/error-handling",
        title: "Error handling",
        summary: "Normalized error classes and stable codes.",
        provider: "shared",
        section: "core",
    },
    {
        path: "/retries-and-resilience",
        title: "Retries & resilience",
        summary: "Backoff, pacing, and the circuit breaker.",
        provider: "shared",
        section: "core",
    },
    {
        path: "/cancellation-and-timeouts",
        title: "Cancellation & timeouts",
        summary: "Abort signals and per-request deadlines.",
        provider: "shared",
        section: "core",
    },
    {
        path: "/per-request-options",
        title: "Per-request options",
        summary: "Override transport behavior for a single call.",
        provider: "shared",
        section: "core",
    },
    {
        path: "/observability",
        title: "Observability",
        summary: "Logging hooks and request telemetry.",
        provider: "shared",
        section: "core",
    },
    {
        path: "/recipes",
        title: "Recipes",
        summary: "Copy-paste solutions for common tasks.",
        provider: "shared",
        section: "cookbook",
    },
    {
        path: "/typescript-patterns",
        title: "TypeScript patterns",
        summary: "Narrowing, generics, and inference tricks.",
        provider: "shared",
        section: "cookbook",
    },
    {
        path: "/troubleshooting",
        title: "Troubleshooting",
        summary: "Frequent failures and their fixes.",
        provider: "shared",
        section: "cookbook",
    },
    {
        path: "/guides/anilist/authentication",
        title: "AniList authentication",
        summary: "OAuth token setup for the GraphQL surface.",
        provider: "anilist",
        section: "anilist",
    },
    {
        path: "/guides/anilist/configuration",
        title: "AniList configuration",
        summary: "Client options for the AniList provider.",
        provider: "anilist",
        section: "anilist",
    },
    {
        path: "/guides/anilist/querying",
        title: "Querying data",
        summary: "Typed GraphQL queries over media, characters, staff.",
        provider: "anilist",
        section: "anilist",
    },
    {
        path: "/guides/anilist/page-queries",
        title: "Page queries",
        summary: "The Page schema and its collection queries.",
        provider: "anilist",
        section: "anilist",
    },
    {
        path: "/guides/anilist/pagination",
        title: "Pagination",
        summary: "Cursor and page-based iteration helpers.",
        provider: "anilist",
        section: "anilist",
    },
    {
        path: "/guides/anilist/mutations",
        title: "Mutations",
        summary: "Authenticated writes: lists, ratings, favorites.",
        provider: "anilist",
        section: "anilist",
    },
    {
        path: "/guides/anilist/custom-queries",
        title: "Custom queries",
        summary: "Raw GraphQL with typed variables.",
        provider: "anilist",
        section: "anilist",
    },
    {
        path: "/guides/anilist/helpers",
        title: "Helpers",
        summary: "Formatting and date utilities for AniList data.",
        provider: "anilist",
        section: "anilist",
    },
    {
        path: "/guides/mal/authentication",
        title: "MAL authentication",
        summary: "PKCE OAuth2 flow for MyAnimeList.",
        provider: "mal",
        section: "mal",
    },
    {
        path: "/guides/mal/configuration",
        title: "MAL configuration",
        summary: "Client options for the MAL provider.",
        provider: "mal",
        section: "mal",
    },
    {
        path: "/guides/mal/operations",
        title: "MAL operations",
        summary: "Anime and user endpoints on the REST surface.",
        provider: "mal",
        section: "mal",
    },
    {
        path: "/operations/index",
        title: "Operation reference",
        summary: "The generated per-operation catalog.",
        provider: "shared",
        section: "reference",
    },
    {
        path: "/operations/anilist",
        title: "AniList catalog",
        summary: "Query, page, mutation, and custom categories.",
        provider: "anilist",
        section: "reference",
        children: [
            {
                path: "/operations/anilist/query",
                title: "Query operations",
                summary: "Single-resource and collection queries.",
                provider: "anilist",
                section: "reference",
            },
            {
                path: "/operations/anilist/page",
                title: "Page-query operations",
                summary: "Paginated collection queries.",
                provider: "anilist",
                section: "reference",
            },
            {
                path: "/operations/anilist/mutation",
                title: "Mutation operations",
                summary: "Authenticated write operations.",
                provider: "anilist",
                section: "reference",
            },
            {
                path: "/operations/anilist/custom",
                title: "Custom operations",
                summary: "Flexible custom GraphQL requests.",
                provider: "anilist",
                section: "reference",
            },
        ],
    },
    {
        path: "/operations/mal",
        title: "MAL catalog",
        summary: "mal.anime.get and mal.user.me on the REST surface.",
        provider: "mal",
        section: "reference",
    },
];

/** Navigation groups in sidebar order. */
export const NAV_GROUPS: NavGroup[] = [
    { title: "Start here", pages: PAGES.filter((p) => p.section === "start") },
    { title: "Core concepts", pages: PAGES.filter((p) => p.section === "core") },
    { title: "Cookbook", pages: PAGES.filter((p) => p.section === "cookbook") },
    { title: "AniList · GraphQL", pages: PAGES.filter((p) => p.section === "anilist") },
    { title: "MyAnimeList · REST", pages: PAGES.filter((p) => p.section === "mal") },
    { title: "Operation reference", pages: PAGES.filter((p) => p.section === "reference") },
];

/**
 * Flatten a page list, expanding any nested `children` after their parent.
 * Used by the pager and active-link lookup so nested operation pages are
 * reachable even though `NAV_GROUPS` only lists top-level entries.
 */
export function flatPages(pages: DocPage[] = PAGES): DocPage[] {
    const out: DocPage[] = [];
    for (const page of pages) {
        out.push(page);
        if (page.children) out.push(...flatPages(page.children));
    }
    return out;
}

/** Look up a page by its unprefixed path. */
export function findPage(path: string): DocPage | undefined {
    return flatPages().find((p) => p.path === path);
}

/** The previous and next pages in canonical reading order. */
export function neighborsOf(path: string): { prev?: DocPage; next?: DocPage } {
    const flat = flatPages();
    const index = flat.findIndex((p) => p.path === path);
    if (index === -1) return {};
    return {
        prev: index > 0 ? flat[index - 1] : undefined,
        next: index < flat.length - 1 ? flat[index + 1] : undefined,
    };
}

/** Rewrite root-absolute href/src attributes in an HTML fragment. */
export function prefixHtmlLinks(html: string, prefix: string): string {
    return html.replace(/\b(href|src)="(\/[^"\/][^"]*)"/g, (match, attr: string, href: string) => {
        if (href.startsWith("/typedoc/")) return match;
        return `${attr}="${prefix}${href}"`;
    });
}

/** Extract the H1 title from a content markdown document. */
export function extractTitle(markdown: string): string | undefined {
    const match = markdown.match(/^#\s+(.+)$/m);
    return match?.[1]?.trim();
}

/** Strip the leading H1 from a content markdown document. */
export function stripH1(markdown: string): string {
    return markdown.replace(/^#\s+.+\n/, "");
}

/** Remove a leading frontmatter block from a content markdown document. */
export function stripFrontmatter(markdown: string): string {
    if (!markdown.startsWith("---")) return markdown;
    const end = markdown.indexOf("\n---", 3);
    if (end === -1) return markdown;
    return markdown.slice(markdown.indexOf("\n", end + 1) + 1);
}
