import { createSSRApp } from "vue";
import type { App } from "vue";
import DocsLayout from "./DocsLayout.vue";
import NotFound from "./NotFound.vue";
import Callout from "../../lib/components/Callout.vue";
import CodeBlock from "../../lib/components/CodeBlock.vue";
import Home from "../../lib/components/Home.vue";
import Icon from "../../lib/components/Icon.vue";
import Mermaid from "../../lib/components/Mermaid.vue";
import OptionTable from "../../lib/components/OptionTable.vue";
import ProviderTabs from "../../lib/components/ProviderTabs.vue";
import SearchModal from "../../lib/components/SearchModal.vue";
import SemanticSearch from "../../lib/components/SemanticSearch.vue";
import "./styles/base.css";

/** Register the theme's global components on the given app instance. */
function registerComponents(app: App): void {
    app.component("Callout", Callout);
    app.component("CodeBlock", CodeBlock);
    app.component("Home", Home);
    app.component("Icon", Icon);
    app.component("Mermaid", Mermaid);
    app.component("OptionTable", OptionTable);
    app.component("ProviderTabs", ProviderTabs);
    app.component("SearchModal", SearchModal);
    app.component("SemanticSearch", SemanticSearch);
    app.component("NotFound", NotFound);
}

/** Create the Vue app instance for the custom theme. */
export default {
    Layout: DocsLayout,
    enhanceApp({ app }: { app: App }): void {
        registerComponents(app);
    },
};

// Re-export so VitePress's virtual module resolution finds the default export.
export { DocsLayout };

// SSR-safe app creation helper required by VitePress custom themes.
export function createApp(): App {
    return createSSRApp(DocsLayout);
}
