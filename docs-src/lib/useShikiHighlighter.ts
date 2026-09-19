/**
 * Shared Shiki highlighter for the redesign themes.
 *
 * Each redesign ships its own token palette. The highlighter emits light
 * and dark dual-theme variables. The redesign CSS maps them to its own
 * palette, so one highlighter covers all five skins.
 */
import { createHighlighterCore, type HighlighterCore } from "shiki/core";
import { createJavaScriptRegexEngine } from "@shikijs/engine-javascript";
import githubLight from "shiki/themes/github-light.mjs";
import githubDark from "shiki/themes/github-dark-default.mjs";
import typescript from "shiki/langs/typescript.mjs";
import bash from "shiki/langs/bash.mjs";
import json from "shiki/langs/json.mjs";

/** The promise is module-scoped, so every consumer shares a single highlighter. */
let highlighterPromise: Promise<HighlighterCore> | undefined;

/**
 * Lazily create and return the shared Shiki highlighter.
 *
 * @returns The shared highlighter. The creation promise is memoized, so
 * concurrent callers all await the same instance.
 */
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
 * Highlight a TypeScript source string with the shared highlighter.
 *
 * Returns an empty string for empty input so the caller can render the
 * raw source as a fallback without a separate conditional.
 *
 * @param source TypeScript source to highlight.
 * @returns Light and dark dual-theme HTML, or an empty string for empty input.
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
