/**
 * Reactive docs theme for components teleported outside the `.docs.theme-*`
 * scope (e.g. the search modal, which teleports to `<body>`).
 *
 * The `--rd-*` design tokens are defined on `.docs.theme-light` /
 * `.docs.theme-dark` in `DocsLayout.vue`. A teleported component escapes that
 * scope, so the variables do not cascade and the UI falls back to hardcoded
 * defaults (which are dark-leaning and unreadable in light mode). This
 * composable reads the active theme from the same source `DocsLayout` uses
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
