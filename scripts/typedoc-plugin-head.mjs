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
 *
 * Registered from `typedoc.json` as `"./scripts/typedoc-plugin-head.mjs"`.
 * The `load` export is the TypeDoc plugin entry point.
 */
import { JSX } from "typedoc";

const FONT_CSS =
    "https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@400;500;700;800&family=Zen+Old+Mincho:wght@400;700;900&family=IBM+Plex+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap";

/** Shared consent contract — the same boot script the VitePress site injects. */
const { CONSENT_BOOT_SCRIPT } = await import(`../docs-src/lib/consent.mjs`);

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
    app.renderer.hooks.on("head.begin", () =>
        JSX.createElement(
            JSX.Fragment,
            null,
            JSX.createElement("link", {
                rel: "preconnect",
                href: "https://fonts.googleapis.com",
            }),
            JSX.createElement("link", {
                rel: "preconnect",
                href: "https://fonts.gstatic.com",
                crossorigin: "",
            }),
            JSX.createElement("link", { rel: "stylesheet", href: FONT_CSS }),
            // Consent defaults run first; the gtag library itself is only
            // fetched (by the boot script or the banner) after acceptance.
            JSX.createElement(
                "script",
                {},
                JSX.createElement(JSX.Raw, { html: CONSENT_BOOT_SCRIPT })
            )
        )
    );

    app.renderer.hooks.on("body.end", () =>
        JSX.createElement("script", {}, JSX.createElement(JSX.Raw, { html: CONSENT_BANNER_SCRIPT }))
    );
}
