import { defineLoader } from "vitepress";
import { loadOperations } from "../../lib/load-ops";

/** Build-time data loader for MyAnimeList anime operations. */
export default defineLoader({
    load() {
        return loadOperations("mal", "anime");
    },
});
