import { describe, expectTypeOf, it } from "vitest";
import type {
    MalAnimeListStatusUpdateParams,
    MalMangaListStatusUpdateParams,
    MalUserAnimeListParams,
    MalUserMangaListParams,
} from "../src/mal";

describe("MAL param types", () => {
    it("updateMyListStatus params carry the id plus every payload field", () => {
        expectTypeOf<MalAnimeListStatusUpdateParams>().toEqualTypeOf<{
            id: number;
            status?: "watching" | "completed" | "on_hold" | "dropped" | "plan_to_watch";
            num_watched_episodes?: number;
            score?: number;
            start_date?: string;
            finish_date?: string;
            comments?: string;
            is_rewatching?: boolean;
            num_times_rewatched?: number;
            rewatch_value?: number;
            priority?: number;
            tags?: readonly string[];
        }>();
    });

    it("manga updateMyListStatus params carry the id plus every payload field", () => {
        expectTypeOf<MalMangaListStatusUpdateParams>().toEqualTypeOf<{
            id: number;
            status?: "reading" | "completed" | "on_hold" | "dropped" | "plan_to_read";
            num_chapters_read?: number;
            num_volumes_read?: number;
            score?: number;
            start_date?: string;
            finish_date?: string;
            comments?: string;
            is_rereading?: boolean;
            num_times_reread?: number;
            reread_value?: number;
            priority?: number;
            tags?: readonly string[];
        }>();
    });

    it("animeList params carry the username plus every list filter", () => {
        expectTypeOf<MalUserAnimeListParams>().toEqualTypeOf<{
            username: string;
            status?: "watching" | "completed" | "on_hold" | "dropped" | "plan_to_watch";
            sort?:
                "list_score" | "list_updated_at" | "anime_title" | "anime_start_date" | "anime_id";
            limit?: number;
            offset?: number;
        }>();
    });

    it("mangaList params carry the username plus every list filter", () => {
        expectTypeOf<MalUserMangaListParams>().toEqualTypeOf<{
            username: string;
            status?: "reading" | "completed" | "on_hold" | "dropped" | "plan_to_read";
            sort?:
                "list_score" | "list_updated_at" | "manga_title" | "manga_start_date" | "manga_id";
            limit?: number;
            offset?: number;
        }>();
    });
});
