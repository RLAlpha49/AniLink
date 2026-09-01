import { defineLoader } from "vitepress";
import { loadOperations } from "../../lib/load-ops";

/** Build-time data loader for AniList custom operations. */
export default defineLoader({
    load() {
        return loadOperations("anilist", "custom");
    },
});
