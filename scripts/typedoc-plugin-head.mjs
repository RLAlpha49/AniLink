import { createHash } from "node:crypto";

/**
 * TypeDoc plugin that reproduces the VitePress docs' `<head>` behavior for
 * the TypeDoc HTML output:
 *
 * 1. Google Fonts stylesheet — a `<link rel="stylesheet">` plus `preconnect`
 *    hints. Why a plugin instead of `@import url(...)` in `typedoc-custom.css`:
 *    `@import` starts the font download only after the browser has downloaded
 *    and parsed the custom CSS, so first paint waits on a serialized request
 *    chain. `<link>` elements emitted here load in parallel with the CSS.
 * 2. Google Analytics 4 — consent defaults denied before anything loads;
 *    the gtag library itself is only fetched after the visitor accepts.
 *    The boot script is shared with the VitePress site
 *    (`docs-src/lib/consent.mjs`) and defines the `window.__anilinkConsent`
 *    API; measurement only starts after the visitor accepts in the consent
 *    banner, which this plugin also injects.
 * 3. Per-page metadata — canonical URL, robots, description, and Open
 *    Graph / Twitter tags, mirroring `transformHead` in
 *    `docs-src/.vitepress/config.mts` so the API reference pages get the
 *    same SEO surface as the guides.
 *
 * Registered from `typedoc.json` as `"./scripts/typedoc-plugin-head.mjs"`.
 * The `load` export is the TypeDoc plugin entry point.
 *
 * Implementation note: this plugin deliberately does NOT import anything
 * from the `typedoc` package. TypeDoc loads path-based plugins through
 * `pathToFileURL(normalizePath(...))`, and `normalizePath` uppercases the
 * Windows drive letter, while the CLI's own module URL keeps the case the
 * shell used to start it. When the two cases differ, a plugin-level
 * `import { JSX } from "typedoc"` resolves to a *second* TypeDoc module
 * instance whose `JSX.Fragment` / `JSX.Raw` marker functions fail the
 * renderer's identity checks — the renderer then invokes the marker
 * directly and it throws "Should never be called". Mutating
 * `PageEvent.contents` on the `endPage` event instead sidesteps module
 * identity entirely and keeps the plugin robust against however the CLI
 * was invoked.
 */

/** Site origin for canonical/OG URLs — matches `hostedBaseUrl` in typedoc.json. */
const SITE_URL = "https://anilink.alpha49.com";

/** Fallback description when a reflection has no comment summary. */
const DEFAULT_DESCRIPTION =
    "AniLink API reference — the typed TypeScript client for the AniList GraphQL and MyAnimeList REST APIs.";

/** Rough cap for meta descriptions; crawlers truncate well past this. */
const MAX_DESCRIPTION_LENGTH = 300;

/** Hash an exact inline script for a restrictive static-page CSP. */
function cspHash(content) {
    return `'sha256-${createHash("sha256").update(content, "utf8").digest("base64")}'`;
}

/** Build the meta-delivered CSP for the resources used by these docs pages. */
function contentSecurityPolicy(existingScriptHashes) {
    const scriptHashes = [
        ...new Set(
            [CONSENT_BOOT_SCRIPT, CONSENT_BANNER_SCRIPT].map(cspHash).concat(existingScriptHashes)
        ),
    ];
    return [
        "default-src 'self'",
        "base-uri 'self'",
        "object-src 'none'",
        "form-action 'self'",
        "frame-src 'none'",
        `script-src 'self' 'wasm-unsafe-eval' https://cdn.jsdelivr.net https://www.googletagmanager.com ${scriptHashes.join(" ")}`,
        "style-src 'self' https://fonts.googleapis.com",
        "style-src-attr 'none'",
        "font-src 'self' https://fonts.gstatic.com",
        "img-src 'self' https://www.google-analytics.com",
        "connect-src 'self' https://cdn.jsdelivr.net https://huggingface.co https://www.google-analytics.com",
        "worker-src 'self' blob:",
    ].join("; ");
}

/** Hash every inline script already present in the rendered TypeDoc page. */
function inlineScriptHashes(html) {
    const hashes = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)]
        .filter((match) => !/\bsrc\s*=/.test(match[1]))
        .map((match) => cspHash(match[2]));
    return [...new Set(hashes)];
}

const FONT_CSS =
    "https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@400;500;700;800&family=Zen+Old+Mincho:wght@400;700;900&family=IBM+Plex+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap";

/** Shared consent contract — the same boot script the VitePress site injects. */
const { CONSENT_BOOT_SCRIPT } = await import(`../docs-src/lib/consent.mjs`);

/**
 * Escape a value for use inside a double-quoted HTML attribute.
 *
 * @param {string} value Raw attribute value.
 * @returns HTML-escaped attribute value.
 */
function escapeAttribute(value) {
    return value.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;");
}

/**
 * Derive the meta description from a reflection's comment summary: join the
 * plain-text parts of the summary, collapse whitespace, and truncate on a
 * word boundary. Falls back to a sensible default when the reflection has
 * no comment.
 *
 * @param {import("typedoc").Reflection} model The page's reflection.
 * @returns A description string safe for attribute embedding.
 */
function descriptionFor(model) {
    const summary = model?.comment?.summary ?? [];
    const text = summary
        .map((part) => {
            // Plain text contributes as-is; `{@link X}` inline tags
            // contribute their link text so sentences like "`{@link AniLink}`
            // is the public entry point" keep their subject.
            if (part.kind === "text" || part.kind === "inline-tag") return part.text;
            return "";
        })
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();
    if (!text) return DEFAULT_DESCRIPTION;
    if (text.length <= MAX_DESCRIPTION_LENGTH) return text;
    const cut = text.lastIndexOf(" ", MAX_DESCRIPTION_LENGTH);
    return text.slice(0, cut > 0 ? cut : MAX_DESCRIPTION_LENGTH) + "…";
}

/**
 * Classify a TypeDoc page from its output route and reflection ancestry.
 * Source paths help classify member pages whose own names omit the provider.
 *
 * @param {import("typedoc").Reflection} model The page's reflection.
 * @param {string} pageUrl The TypeDoc output-relative page URL.
 * @returns A social-card context used by the docs site.
 */
function socialCardContextFor(model, pageUrl) {
    const details = [pageUrl];
    const visited = new Set();
    for (
        let reflection = model;
        reflection && !visited.has(reflection);
        reflection = reflection.parent
    ) {
        visited.add(reflection);
        details.push(reflection.name ?? "", reflection.url ?? "");
    }
    for (const source of model?.sources ?? []) {
        details.push(source.fileName ?? "");
    }

    const identity = details.join("/").toLowerCase();
    if (/(^|[^a-z])anilist([^a-z]|$)/.test(identity)) return "AniList";
    if (/(^|[^a-z])(?:mal|myanimelist)([^a-z]|$)/.test(identity)) return "MyAnimeList";
    if (/(^|[\\/._-])(?:operations?|queries?|mutations?)(?:[\\/._-]|$)/.test(identity)) {
        return "operation reference";
    }
    return "documentation";
}

/** Select the same branded social image used by VitePress for this context. */
function socialCardFor(context) {
    if (context === "AniList") return `${SITE_URL}/social-card-anilist.png`;
    if (context === "MyAnimeList") return `${SITE_URL}/social-card-mal.png`;
    if (context === "operation reference") return `${SITE_URL}/social-card-operations.png`;
    return `${SITE_URL}/social-card.png`;
}

/** Alt text naming the docs area selected for a TypeDoc page. */
function socialCardAltFor(context) {
    if (context === "AniList") return "AniLink, typed AniList GraphQL client for TypeScript";
    if (context === "MyAnimeList") return "AniLink, typed MyAnimeList REST client for TypeScript";
    if (context === "operation reference") {
        return "AniLink, AniList and MyAnimeList operation reference";
    }
    return "AniLink, typed AniList and MyAnimeList client for TypeScript";
}

/**
 * Build the per-page head injection: CSP, fonts, consent boot script, canonical
 * URL, robots directive, description, and Open Graph / Twitter tags. The
 * tag set mirrors `transformHead` in `docs-src/.vitepress/config.mts` so
 * guides and API reference pages share one SEO surface.
 *
 * @param {string} pageTitle The page's `<title>` text (already rendered).
 * @param {string} canonicalUrl Absolute URL of the page.
 * @param {string} description Meta description for the page.
 * @param {import("typedoc").Reflection} model The page's reflection.
 * @param {string} pageUrl The TypeDoc output-relative page URL.
 * @param {string[]} existingScriptHashes Hashes for inline scripts in TypeDoc's rendered page.
 * @returns The HTML fragment spliced into the head.
 */
function headHtml(pageTitle, canonicalUrl, description, model, pageUrl, existingScriptHashes) {
    const escTitle = escapeAttribute(pageTitle);
    const escUrl = escapeAttribute(canonicalUrl);
    const escDesc = escapeAttribute(description);
    const socialCardContext = socialCardContextFor(model, pageUrl);
    const socialCard = escapeAttribute(socialCardFor(socialCardContext));
    const socialCardAlt = escapeAttribute(socialCardAltFor(socialCardContext));
    return [
        `<meta http-equiv="Content-Security-Policy" content="${contentSecurityPolicy(existingScriptHashes)}">`,
        `<link rel="preconnect" href="https://fonts.googleapis.com">`,
        `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>`,
        `<link rel="stylesheet" href="${FONT_CSS}">`,
        // Consent defaults run first; the gtag library itself is only
        // fetched (by the boot script or the banner) after acceptance.
        `<script>${CONSENT_BOOT_SCRIPT}</script>`,
        `<link rel="canonical" href="${escUrl}">`,
        `<meta name="robots" content="index,follow">`,
        `<meta name="description" content="${escDesc}">`,
        `<meta property="og:title" content="${escTitle}">`,
        `<meta property="og:description" content="${escDesc}">`,
        `<meta property="og:type" content="website">`,
        `<meta property="og:url" content="${escUrl}">`,
        `<meta property="og:image" content="${socialCard}">`,
        `<meta property="og:image:width" content="1200">`,
        `<meta property="og:image:height" content="630">`,
        `<meta property="og:image:alt" content="${socialCardAlt}">`,
        `<meta name="twitter:card" content="summary_large_image">`,
        `<meta name="twitter:title" content="${escTitle}">`,
        `<meta name="twitter:description" content="${escDesc}">`,
        `<meta name="twitter:image" content="${socialCard}">`,
        `<meta name="twitter:image:alt" content="${socialCardAlt}">`,
    ].join("");
}

/**
 * Splice `injection` into `html` immediately after the first `marker` tag.
 * Idempotent: returns the input unchanged when `sentinel` is already
 * present, so repeated builds of the same output never duplicate tags.
 *
 * @param {string} html The rendered page HTML.
 * @param {string} marker The opening tag to splice after (e.g. `"<head>"`).
 * @param {string} sentinel A substring that marks the injection as present.
 * @param {string} injection The HTML fragment to insert.
 * @returns The patched HTML.
 */
function spliceAfter(html, marker, sentinel, injection) {
    if (html.includes(sentinel)) return html;
    const at = html.indexOf(marker);
    if (at === -1) return html;
    const from = at + marker.length;
    return html.slice(0, from) + injection + html.slice(from);
}

/**
 * Splice `injection` into `html` immediately before the closing `marker`
 * tag. Idempotent on the same `sentinel` contract as `spliceAfter`.
 *
 * @param {string} html The rendered page HTML.
 * @param {string} marker The closing tag to splice before (e.g. `"</body>"`).
 * @param {string} sentinel A substring that marks the injection as present.
 * @param {string} injection The HTML fragment to insert.
 * @returns The patched HTML.
 */
function spliceBefore(html, marker, sentinel, injection) {
    if (html.includes(sentinel)) return html;
    const at = html.indexOf(marker);
    if (at === -1) return html;
    return html.slice(0, at) + injection + html.slice(at);
}

/**
 * Consent banner for TypeDoc pages: same storage key, choice semantics, and
 * visual design as the VitePress banner. The click handler delegates to the
 * `window.__anilinkConsent` API defined by the shared boot script (injected
 * at `head.begin` below), so accepting and declining — including the `_ga`
 * cookie cleanup on decline — behave exactly like the VitePress site. When
 * a valid choice is already stored, a settings button
 * (`#anilink-consent-settings`, bottom-right corner) reopens the banner
 * instead — the same reopen control the Vue component renders — so a
 * previous accept or decline can always be changed. The markup mirrors the
 * Vue component's structure (consent-text / consent-actions / consent-btn
 * classes) so `typedoc-custom.css` styles both surfaces with one set of
 * rules against the shared --rd-* design tokens.
 */
const CONSENT_BANNER_SCRIPT = `
(() => {
  try {
    if (!window.__anilinkConsent) return;
    if (window.__anilinkConsent.globalPrivacyControl?.()) return;
    const COOKIE_SVG =
      '<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5"/>' +
      '<path d="M8.5 8.5v.01"/>' +
      '<path d="M16 15.5v.01"/>' +
      '<path d="M12 12v.01"/>' +
      '<path d="M11 17v.01"/>' +
      '<path d="M7 14v.01"/>' +
      "</svg>";
    const el = document.createElement("div");
    el.id = "anilink-consent-banner";
    el.setAttribute("role", "region");
    el.setAttribute("aria-label", "Analytics consent");
    el.innerHTML =
      '<p class="consent-text">This site uses Google Analytics to understand how the docs are used. ' +
      "No measurement happens until you accept. See the <a href=\\"/privacy\\">privacy page</a> for details.</p>" +
      '<div class="consent-actions">' +
      '<button type="button" class="consent-btn consent-accept" data-consent="accept">Accept</button>' +
      '<button type="button" class="consent-btn consent-decline" data-consent="decline">Decline</button>' +
      "</div>";
    el.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-consent]");
      if (!button) return;
      window.__anilinkConsent.set(button.dataset.consent === "accept");
      el.remove();
      document.body.append(settings);
    });
    const settings = document.createElement("button");
    settings.id = "anilink-consent-settings";
    settings.type = "button";
    settings.setAttribute("aria-label", "Analytics settings");
    settings.title = "Analytics settings";
    settings.innerHTML = COOKIE_SVG;
    settings.addEventListener("click", () => {
      settings.remove();
      document.body.append(el);
    });
    if (window.__anilinkConsent.needsChoice()) {
      document.body.append(el);
    } else {
      document.body.append(settings);
    }
  } catch (e) {
    /* storage unavailable — leave consent denied */
  }
})();`;

/** @param {import("typedoc").Application} app - The TypeDoc application. */
export function load(app) {
    // endPage fires per rendered page, just before the HTML is written to
    // disk; `contents` is the final page HTML and is documented as mutable.
    // String-splicing here avoids importing TypeDoc's JSX runtime, which —
    // see the header comment — can resolve to a second TypeDoc instance on
    // Windows and crash the render with "Should never be called".
    app.renderer.on("endPage", (event) => {
        let html = event.contents ?? "";
        const titleMatch = /<title>([^<]*)<\/title>/.exec(html);
        const pageTitle = titleMatch ? titleMatch[1].trim() : "AniLink API reference";
        // The TypeDoc output is served under /typedoc/ on the site, so the
        // canonical URL is the site origin plus the page's output-relative
        // URL (e.g. `classes/AniLink.AniLink.html`).
        const canonicalUrl = new URL(`typedoc/${event.url}`, `${SITE_URL}/`).toString();
        // TypeDoc's own SitemapPlugin emits a canonical for index.html that
        // assumes a root deployment; the reference actually lives under
        // /typedoc/, so drop that link to avoid two conflicting canonicals.
        html = html.replace(
            /<link rel="canonical" href="[^"]*"\/>(?=<meta http-equiv="x-ua-compatible")/,
            ""
        );
        const head = headHtml(
            pageTitle,
            canonicalUrl,
            descriptionFor(event.model),
            event.model,
            event.url,
            inlineScriptHashes(html)
        );
        // The sentinel must be unique to this plugin's tags: TypeDoc's own
        // SitemapPlugin already emits a canonical link on index.html, so
        // keying on `rel="canonical"` would skip the whole injection there.
        event.contents = spliceAfter(html, "<head>", 'property="og:title"', head);
        event.contents = spliceBefore(
            event.contents,
            "</body>",
            "anilink-consent-banner",
            `<script>${CONSENT_BANNER_SCRIPT}</script>`
        );
    });
}
