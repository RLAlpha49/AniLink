import { resolveMalCredentials, type MalCredentials } from "../../../base/credentials";
import { MalAnimeOperation } from "./operations/AnimeOperation";
import { MalMangaOperation } from "./operations/MangaOperation";
import { MalUserOperation } from "./operations/UserOperation";
import type { MyAnimeListApi } from "./facade";
import { buildRefreshedAuth, MalTokenRefresher } from "./tokenRefresh";

/**
 * Whether a credential string is present with at least one non-whitespace
 * character. A whitespace-only value must not activate the refresh
 * lifecycle: it would construct a refresher whose every 401 performs a
 * doomed refresh grant before replaying, instead of surfacing the 401.
 *
 * @param value - The credential string, when configured.
 * @returns Whether the value is non-blank.
 */
const isNonBlank = (value: string | undefined): value is string =>
    typeof value === "string" && value.trim() !== "";

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
 * const anime = await api.anime.get({ id: 21 });
 * ```
 * @see https://myanimelist.net/apiconfig/references/api/v2
 */
export function buildMyAnimeListApi(credentials?: MalCredentials): MyAnimeListApi {
    const { auth, options } = resolveMalCredentials(credentials);
    const anime = new MalAnimeOperation(auth, options);
    const manga = new MalMangaOperation(auth, options);
    const user = new MalUserOperation(auth, options);

    // The automatic refresh lifecycle is opt-in: it activates only when both
    // the refresh token and client ID are configured (non-blank — a
    // whitespace-only value is treated as missing, matching the empty-string
    // case). Without them the facade keeps the direct bound methods — zero
    // wrapper overhead, zero behavior change.
    const refresher =
        isNonBlank(credentials?.refreshToken) && isNonBlank(credentials?.clientId)
            ? new MalTokenRefresher({
                  clientId: credentials.clientId,
                  refreshToken: credentials.refreshToken,
                  clientSecret: credentials.clientSecret,
                  onTokenRefresh: credentials.onTokenRefresh,
                  onHookError: credentials.onHookError,
                  applyAccessToken: (accessToken) => {
                      for (const operation of [anime, manga, user]) {
                          operation.updateAuth(
                              buildRefreshedAuth(operation.getAuth(), accessToken)
                          );
                      }
                  },
              })
            : undefined;

    if (refresher === undefined) {
        return {
            anime: {
                get: anime.get.bind(anime),
                seasonal: anime.seasonal.bind(anime),
                ranking: anime.ranking.bind(anime),
                suggestions: anime.suggestions.bind(anime),
                updateMyListStatus: anime.updateMyListStatus.bind(anime),
                deleteFromList: anime.deleteFromList.bind(anime),
            },
            manga: {
                get: manga.get.bind(manga),
                updateMyListStatus: manga.updateMyListStatus.bind(manga),
                deleteFromList: manga.deleteFromList.bind(manga),
            },
            user: {
                me: user.me.bind(user),
                animeList: user.animeList.bind(user),
                mangaList: user.mangaList.bind(user),
            },
        };
    }

    // With refresh credentials, every facade method runs under the refresh
    // lifecycle: a 401 triggers one deduplicated refresh, the fresh auth
    // material is swapped onto all three operation instances, and the
    // original request is replayed once.
    const wrap =
        <A extends unknown[], R>(
            method: (...args: A) => Promise<R>
        ): ((...args: A) => Promise<R>) =>
        (...args: A) =>
            refresher.executeWithRefresh(() => method(...args));

    return {
        anime: {
            get: wrap(anime.get.bind(anime)),
            seasonal: wrap(anime.seasonal.bind(anime)),
            ranking: wrap(anime.ranking.bind(anime)),
            suggestions: wrap(anime.suggestions.bind(anime)),
            updateMyListStatus: wrap(anime.updateMyListStatus.bind(anime)),
            deleteFromList: wrap(anime.deleteFromList.bind(anime)),
        },
        manga: {
            get: wrap(manga.get.bind(manga)),
            updateMyListStatus: wrap(manga.updateMyListStatus.bind(manga)),
            deleteFromList: wrap(manga.deleteFromList.bind(manga)),
        },
        user: {
            me: wrap(user.me.bind(user)),
            animeList: wrap(user.animeList.bind(user)),
            mangaList: wrap(user.mangaList.bind(user)),
        },
    };
}
