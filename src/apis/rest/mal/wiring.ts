import { isNonBlank, resolveMalCredentials, type MalCredentials } from "../../../base/credentials";
import type { BaseOperation } from "../../../base/BaseOperation";
import type { MyAnimeListApi } from "./facade";
import { buildMalAuthorizationUrl, getMalAccessToken } from "./auth";
import { malPaginate, malPaginatePages } from "./Paginator";
import {
    MAL_OPERATION_REGISTRY,
    type MalOperationConstructor,
    type MalOperationEntry,
    type MalOperationGroup,
} from "./registry";
import { buildMalTokenRefresher, buildRefreshedAuth } from "./tokenRefresh";

/**
 * {@link buildMyAnimeListApi} builds the {@link MyAnimeListApi} from
 * {@link MalCredentials}.
 *
 * It resolves credentials through {@link resolveMalCredentials} and builds
 * the {@link MyAnimeListApi} exposed as `aniLink.mal` from the operations in
 * {@link MAL_OPERATION_REGISTRY}. One loop constructs and binds each member,
 * with or without token refresh. To add an operation, update the registry;
 * its parity checks keep the group interfaces in `facade.ts` in sync. The
 * function passes transport settings from {@link MalCredentials} to
 * `MalRequestOptions` without sharing them across providers.
 *
 * @param credentials - MAL access and OAuth credentials plus transport settings; a {@link MalCredentials} slot.
 * @param stateOwner - Stable per-client object keying the shared transport state (breaker, budget, pacing); when omitted, a fresh one is allocated for this client.
 * @returns The composed {@link MyAnimeListApi}.
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
    // One shared state owner lets every MAL operation use the same circuit
    // breaker, retry budget, and rate-limit pacing state. State remains
    // scoped to each upstream host.
    const sharedStateOwner: object = stateOwner ?? {};
    // The registry defines the groups and operations. Construct each
    // operation with the shared auth material, transport options, and state
    // owner, and keep its entry paired with the instance for binding.
    const groups = Object.keys(MAL_OPERATION_REGISTRY) as MalOperationGroup[];
    const wired: {
        group: MalOperationGroup;
        entry: MalOperationEntry<MalOperationConstructor, string>;
        instance: BaseOperation;
    }[] = [];
    for (const group of groups) {
        for (const entry of MAL_OPERATION_REGISTRY[group]) {
            const operationClass: MalOperationConstructor = entry.operationClass;
            wired.push({
                group,
                entry,
                instance: new operationClass(auth, options, sharedStateOwner),
            });
        }
    }
    // Automatic refresh is opt-in. It activates only when both the refresh
    // token and client ID are non-blank. A whitespace-only value counts as
    // missing, like an empty string. Without both values, each facade member
    // remains a directly bound method with no wrapper or behavior change.
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
                      // Every registered operation was constructed above, so
                      // the swap reaches the whole client: the fresh auth
                      // material is moved onto each instance inside the
                      // deduplicated grant, and the original request is
                      // replayed once against it.
                      for (const { instance } of wired) {
                          instance.updateAuth(buildRefreshedAuth(instance.getAuth(), accessToken));
                      }
                  },
              })
            : undefined;

    // The per-method refresh wrapper, or the identity pass-through when the
    // lifecycle is off, so both modes run the same binding loop below.
    const maybeWrap =
        refresher === undefined
            ? <A extends unknown[], R>(
                  method: (...args: A) => Promise<R>
              ): ((...args: A) => Promise<R>) => method
            : <A extends unknown[], R>(
                      method: (...args: A) => Promise<R>
                  ): ((...args: A) => Promise<R>) =>
                  (...args: A) =>
                      refresher.executeWithRefresh(() => method(...args));

    // Bind every facade member in one loop. Each registry entry names its
    // group, facade key, and method, so adding an operation requires only a
    // registry entry, not another hand-written `.bind()`/`wrap()` pair.
    const groupMembers = Object.fromEntries(groups.map((group) => [group, {}] as const)) as Record<
        MalOperationGroup,
        Record<string, unknown>
    >;
    for (const { group, entry, instance } of wired) {
        // The entry's method name is typed as `string`, and the instance is
        // typed as `BaseOperation`, so this lookup needs a cast. The registry's
        // `op()` helper guarantees that the method exists because it
        // constrains the facade key to a method on the operation class.
        const method = (instance as unknown as Record<string, unknown>)[entry.methodName];
        groupMembers[group][entry.name] = maybeWrap(
            (method as (...args: unknown[]) => Promise<unknown>).bind(instance)
        );
    }

    // The registry builds this object dynamically, so cast it through
    // `unknown` to the handwritten facade type. The registry's parity checks
    // keep its group members equal to `MyAnimeListApi`'s group interfaces.
    // Each `op()` entry also binds a facade key to an operation-class method.
    // AniList's wiring uses the same arrangement.
    return {
        ...groupMembers,
        auth: {
            buildAuthorizationUrl: buildMalAuthorizationUrl,
            exchangeCode: getMalAccessToken,
        },
        // The pagination helpers are provider-owned pure functions over
        // the shared engine. They need no transport state, so they are
        // exposed directly alongside the wired groups.
        paginate: malPaginate,
        paginatePages: malPaginatePages,
    } as unknown as MyAnimeListApi;
}
