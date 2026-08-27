import { resolveMalCredentials, type MalCredentials } from "../../../base/credentials";
import { MalAnimeOperation } from "./operations/AnimeOperation";
import { MalUserOperation } from "./operations/UserOperation";
import type { MyAnimeListApi } from "./facade";

/**
 * Builds the MyAnimeList REST facade from provider-owned credentials.
 *
 * @param credentials - MAL access and OAuth credentials plus transport settings.
 * @returns The composed MyAnimeList API surface.
 * @example
 * ```typescript
 * const api = buildMyAnimeListApi({ accessToken: "mal-token" });
 * ```
 * @see https://myanimelist.net/apiconfig/references/api/v2
 */
export function buildMyAnimeListApi(credentials?: MalCredentials): MyAnimeListApi {
    const { auth, options } = resolveMalCredentials(credentials);
    const anime = new MalAnimeOperation(auth, options);
    const user = new MalUserOperation(auth, options);

    return {
        anime: { get: anime.get.bind(anime) },
        user: { me: user.me.bind(user) },
    };
}
