import { resolveMalCredentials, type MalCredentials } from "../../../base/credentials";
import { MalAnimeOperation } from "./operations/AnimeOperation";
import { MalMangaOperation } from "./operations/MangaOperation";
import { MalUserOperation } from "./operations/UserOperation";
import type { MyAnimeListApi } from "./facade";

/**
 * {@link buildMyAnimeListApi} is the wiring helper that builds the {@link MyAnimeListApi} from provider-owned {@link MalCredentials}.
 *
 * It resolves credentials through {@link resolveMalCredentials} and composes {@link MalAnimeOperation}, {@link MalMangaOperation}, and {@link MalUserOperation} into the {@link MyAnimeListApi} facade exposed as `aniLink.mal`. Transport settings from {@link MalCredentials} flow to `MalRequestOptions` without leaking between providers.
 *
 * @param credentials - MAL access and OAuth credentials plus transport settings; a {@link MalCredentials} slot.
 * @returns The composed {@link MyAnimeListApi} surface.
 * @example
 * ```typescript
 * const api = buildMyAnimeListApi({ accessToken: "mal-token" });
 * const anime = await api.anime.get(21);
 * ```
 * @see https://myanimelist.net/apiconfig/references/api/v2
 */
export function buildMyAnimeListApi(credentials?: MalCredentials): MyAnimeListApi {
    const { auth, options } = resolveMalCredentials(credentials);
    const anime = new MalAnimeOperation(auth, options);
    const manga = new MalMangaOperation(auth, options);
    const user = new MalUserOperation(auth, options);

    return {
        anime: {
            get: anime.get.bind(anime),
            updateMyListStatus: anime.updateMyListStatus.bind(anime),
            deleteFromList: anime.deleteFromList.bind(anime),
        },
        manga: {
            get: manga.get.bind(manga),
            updateMyListStatus: manga.updateMyListStatus.bind(manga),
            deleteFromList: manga.deleteFromList.bind(manga),
        },
        user: { me: user.me.bind(user) },
    };
}
