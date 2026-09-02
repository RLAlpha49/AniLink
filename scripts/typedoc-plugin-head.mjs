/**
 * TypeDoc plugin that loads the Google Fonts stylesheet for the TypeDoc HTML
 * output the same way the VitePress docs do: a `<link rel="stylesheet">` in
 * the server-rendered `<head>` plus `preconnect` hints (see FE-001).
 *
 * Why a plugin instead of `@import url(...)` in `typedoc-custom.css`:
 * `@import` starts the font download only after the browser has downloaded
 * and parsed the custom CSS, so first paint waits on a serialized request
 * chain. `<link>` elements emitted here load in parallel with the CSS.
 *
 * Registered from `typedoc.json` as `"./scripts/typedoc-plugin-head.mjs"`.
 * The `load` export is the TypeDoc plugin entry point.
 */
import { JSX } from "typedoc";

const FONT_CSS =
    "https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@400;500;700;800&family=Zen+Old+Mincho:wght@400;700;900&family=IBM+Plex+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap";

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
            JSX.createElement("link", { rel: "stylesheet", href: FONT_CSS })
        )
    );
}
