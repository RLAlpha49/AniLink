import { defineLoader } from "vitepress";
import { loadOperations } from "../../lib/load-ops";

/** Build-time data loader for AniList page-query operations. */
export default defineLoader({
    load() {
        return loadOperations("anilist", "page");
    },
});
