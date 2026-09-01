/**
 * Font loading helper shared by the redesign layouts.
 *
 * Injects a Google Fonts stylesheet link once per href, SSR-safe.
 */
import { onMounted } from "vue";

/** Ensure a Google Fonts stylesheet is present on the document. */
export function useFonts(href: string): void {
    onMounted(() => {
        if (typeof document === "undefined") return;
        if (document.querySelector(`link[href="${href}"]`)) return;
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = href;
        document.head.appendChild(link);
    });
}
