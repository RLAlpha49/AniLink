/**
 * Shared Shiki highlighter for the redesign themes.
 *
 * Each redesign ships its own token palette; the highlighter emits both
 * light and dark dual-theme variables and the redesign CSS maps them to
 * its own palette, so one highlighter serves all five skins.
 */
import { createHighlighterCore, type HighlighterCore } from "shiki/core";
import { createJavaScriptRegexEngine } from "@shikijs/engine-javascript";
import githubLight from "shiki/themes/github-light.mjs";
import githubDark from "shiki/themes/github-dark-default.mjs";
import typescript from "shiki/langs/typescript.mjs";
import bash from "shiki/langs/bash.mjs";
import json from "shiki/langs/json.mjs";

/** Module-scoped promise so a single highlighter is shared by every consumer. */
let highlighterPromise: Promise<HighlighterCore> | undefined;

/** Lazily create and return the shared Shiki highlighter. */
export function getSharedHighlighter(): Promise<HighlighterCore> {
    if (!highlighterPromise) {
        highlighterPromise = createHighlighterCore({
            themes: [githubLight, githubDark],
            langs: [typescript, bash, json],
            engine: createJavaScriptRegexEngine(),
        });
    }
    return highlighterPromise;
}

/**
 * Highlight a TypeScript source string, reusing the shared highlighter.
 *
 * Returns an empty string for empty input so the caller can render the
 * raw source as a fallback without a separate conditional.
 */
export async function highlightTypeScript(source: string): Promise<string> {
    if (!source) return "";
    const highlighter = await getSharedHighlighter();
    return highlighter.codeToHtml(source, {
        lang: "typescript",
        themes: { light: "github-light", dark: "github-dark-default" },
        defaultColor: false,
    });
}
