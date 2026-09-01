import { defineLoader } from "vitepress";
import { loadOperations } from "../../lib/load-ops";

/** Build-time data loader for AniList mutation operations. */
export default defineLoader({
    load() {
        return loadOperations("anilist", "mutation");
    },
});
