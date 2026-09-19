import { isNonBlank, resolveMalCredentials, type MalCredentials } from "../../../base/credentials";
import { MalAnimeOperation } from "./operations/AnimeOperation";
import { MalForumOperation } from "./operations/ForumOperation";
import { MalMangaOperation } from "./operations/MangaOperation";
import { MalUserOperation } from "./operations/UserOperation";
import type { MyAnimeListApi } from "./facade";
import { buildMalTokenRefresher, buildRefreshedAuth } from "./tokenRefresh";

/**
 * {@link buildMyAnimeListApi} is the wiring helper that builds the {@link MyAnimeListApi} from provider-owned {@link MalCredentials}.
 *
 * It resolves credentials through {@link resolveMalCredentials} and composes {@link MalAnimeOperation}, {@link MalMangaOperation}, and {@link MalUserOperation} into the {@link MyAnimeListApi} facade exposed as `aniLink.mal`. Transport settings from {@link MalCredentials} flow to `MalRequestOptions` without leaking between providers.
 *
 * @param credentials - MAL access and OAuth credentials plus transport settings; a {@link MalCredentials} slot.
 * @param stateOwner - Stable per-client object keying the shared transport state (breaker, budget, pacing); when omitted, a fresh one is allocated for this client.
 * @returns The composed {@link MyAnimeListApi} surface.
 * @example
 * ```typescript
 * const api = buildMyAnimeListApi({ accessToken: "mal-token" });
 * const anime = await api.anime.get({ id: 21 });
 * ```
 * @see https://myanimelist.net/apiconfig/references/api/v2
 */
export function buildMyAnimeListApi(
    credentials?: MalCredentials,
    stateOwner?: object
): MyAnimeListApi {
    const { auth, options } = resolveMalCredentials(credentials);
    // The three operations share one resilience state owner so the circuit
    // breaker, retry budget, and rate-limit pacing span the whole client: a
    // failure streak on `anime.get` advances the same breaker that gates
    // `user.me` (still scoped per upstream host inside the state maps).
    const sharedStateOwner: object = stateOwner ?? {};
    const anime = new MalAnimeOperation(auth, options, sharedStateOwner);
    const manga = new MalMangaOperation(auth, options, sharedStateOwner);
    const user = new MalUserOperation(auth, options, sharedStateOwner);
    const forum = new MalForumOperation(auth, options, sharedStateOwner);

    // The automatic refresh lifecycle is opt-in: it activates only when both
    // the refresh token and client ID are configured (non-blank — a
    // whitespace-only value is treated as missing, matching the empty-string
    // case). Without them the facade keeps the direct bound methods — zero
    // wrapper overhead, zero behavior change.
    // Values are trimmed before use so a credential copied with trailing
    // whitespace still authenticates (matching the AniList wiring).
    const refresher =
        isNonBlank(credentials?.refreshToken) && isNonBlank(credentials?.clientId)
            ? buildMalTokenRefresher({
                  clientId: credentials.clientId.trim(),
                  refreshToken: credentials.refreshToken.trim(),
                  clientSecret: credentials.clientSecret?.trim(),
                  onTokenRefresh: credentials.onTokenRefresh,
                  onTokenRefreshError: credentials.onTokenRefreshError,
                  onHookError: credentials.onHookError,
                  diagnostics: credentials.diagnostics,
                  applyAccessToken: (accessToken) => {
                      for (const operation of [anime, manga, user, forum]) {
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
                search: anime.search.bind(anime),
                seasonal: anime.seasonal.bind(anime),
                ranking: anime.ranking.bind(anime),
                suggestions: anime.suggestions.bind(anime),
                updateMyListStatus: anime.updateMyListStatus.bind(anime),
                deleteFromList: anime.deleteFromList.bind(anime),
            },
            manga: {
                get: manga.get.bind(manga),
                search: manga.search.bind(manga),
                ranking: manga.ranking.bind(manga),
                updateMyListStatus: manga.updateMyListStatus.bind(manga),
                deleteFromList: manga.deleteFromList.bind(manga),
            },
            user: {
                me: user.me.bind(user),
                get: user.get.bind(user),
                animeList: user.animeList.bind(user),
                mangaList: user.mangaList.bind(user),
            },
            forum: {
                boards: forum.boards.bind(forum),
                topics: forum.topics.bind(forum),
                topic: forum.topic.bind(forum),
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
            search: wrap(anime.search.bind(anime)),
            seasonal: wrap(anime.seasonal.bind(anime)),
            ranking: wrap(anime.ranking.bind(anime)),
            suggestions: wrap(anime.suggestions.bind(anime)),
            updateMyListStatus: wrap(anime.updateMyListStatus.bind(anime)),
            deleteFromList: wrap(anime.deleteFromList.bind(anime)),
        },
        manga: {
            get: wrap(manga.get.bind(manga)),
            search: wrap(manga.search.bind(manga)),
            ranking: wrap(manga.ranking.bind(manga)),
            updateMyListStatus: wrap(manga.updateMyListStatus.bind(manga)),
            deleteFromList: wrap(manga.deleteFromList.bind(manga)),
        },
        user: {
            me: wrap(user.me.bind(user)),
            get: wrap(user.get.bind(user)),
            animeList: wrap(user.animeList.bind(user)),
            mangaList: wrap(user.mangaList.bind(user)),
        },
        forum: {
            boards: wrap(forum.boards.bind(forum)),
            topics: wrap(forum.topics.bind(forum)),
            topic: wrap(forum.topic.bind(forum)),
        },
    };
}
