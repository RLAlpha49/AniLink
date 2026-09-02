/**
 * Font loading helper shared by the redesign layouts.
 */
import { onMounted } from "vue";

/**
 * Ensure a Google Fonts stylesheet is present on the document.
 *
 * No-op without an `href`; the configured `<head>` stylesheet covers
 * production.
 *
 * @param href - Optional stylesheet URL to inject as a fallback.
 */
export function useFonts(href?: string): void {
    if (!href) return;
    onMounted(() => {
        if (typeof document === "undefined") return;
        if (document.querySelector(`link[href="${href}"]`)) return;
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = href;
        document.head.appendChild(link);
    });
}
