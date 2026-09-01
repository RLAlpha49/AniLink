/**
 * Reactive docs theme for components that need to know the active light/dark
 * state (e.g. to re-render theme-baked SVGs).
 *
 * The `--rd-*` design tokens are defined globally on `:root` / `html.dark`
 * (set before first paint by the inline head script in config.mts), so they
 * cascade everywhere — including teleported content — without this composable.
 * This is only for code that needs the theme as a *value* (not just the CSS
 * tokens). It reads the active theme from the same source `DocsLayout` uses
 * (`localStorage["anilink-docs-theme"]`, falling back to the OS preference)
 * and keeps a reactive `theme` ref in sync, including live updates when the
 * user toggles the theme elsewhere on the page.
 */
import { onBeforeUnmount, onMounted, ref, type Ref } from "vue";

export type DocsTheme = "light" | "dark";

const STORAGE_KEY = "anilink-docs-theme";

/** Read the active theme from storage or the OS preference. */
function readTheme(): DocsTheme {
    if (typeof localStorage !== "undefined") {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored === "light" || stored === "dark") return stored;
    }
    if (typeof window !== "undefined" && window.matchMedia) {
        return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    return "light";
}

/**
 * Reactive theme ref that stays in sync with the docs theme.
 *
 * @returns A reactive ref holding the current `"light"` | `"dark"` theme.
 */
export function useSearchTheme(): Ref<DocsTheme> {
    const theme = ref<DocsTheme>("light");

    function sync(): void {
        theme.value = readTheme();
    }

    onMounted(() => {
        sync();
        if (typeof window === "undefined") return;
        // The docs layout toggles `html.dark` and writes localStorage. Watch
        // both: storage events (cross-tab) and a MutationObserver on the
        // <html> class for same-tab toggles.
        window.addEventListener("storage", sync);
        const html = document.documentElement;
        const observer = new MutationObserver(sync);
        observer.observe(html, { attributes: true, attributeFilter: ["class"] });
        onBeforeUnmount(() => {
            window.removeEventListener("storage", sync);
            observer.disconnect();
        });
    });

    return theme;
}
