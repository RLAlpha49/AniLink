import { isNonBlank, resolveMalCredentials, type MalCredentials } from "../../../base/credentials";
import type { BaseOperation } from "../../../base/BaseOperation";
import type { MyAnimeListApi } from "./facade";
import { malPaginate, malPaginatePages } from "./Paginator";
import {
    MAL_OPERATION_REGISTRY,
    type MalOperationConstructor,
    type MalOperationEntry,
    type MalOperationGroup,
} from "./registry";
import { buildMalTokenRefresher, buildRefreshedAuth } from "./tokenRefresh";

/**
 * {@link buildMyAnimeListApi} is the wiring helper that builds the {@link MyAnimeListApi} from provider-owned {@link MalCredentials}.
 *
 * It resolves credentials through {@link resolveMalCredentials} and composes every operation registered in {@link MAL_OPERATION_REGISTRY} into the {@link MyAnimeListApi} facade exposed as `aniLink.mal` — one construction-and-bind loop drives every member in both refresh modes, so an operation added to the registry appears here without editing this file (the registry's parity asserts keep the group interfaces in `facade.ts` in step). Transport settings from {@link MalCredentials} flow to `MalRequestOptions` without leaking between providers.
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
    // The registered operations share one resilience state owner so the
    // circuit breaker, retry budget, and rate-limit pacing span the whole
    // client: a failure streak on `anime.get` advances the same breaker that
    // gates `user.me` (still scoped per upstream host inside the state maps).
    const sharedStateOwner: object = stateOwner ?? {};

    // One pass over the registry constructs every registered operation
    // against the shared auth material, transport options, and state owner,
    // keeping each entry paired with its instance for the binding loop
    // below. The group list itself is derived from the registry — no
    // second enumeration of what exists.
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

    // The automatic refresh lifecycle is opt-in: it activates only when both
    // the refresh token and client ID are configured (non-blank — a
    // whitespace-only value is treated as missing, matching the empty-string
    // case). Without them every facade member stays the direct bound method
    // — zero wrapper overhead, zero behavior change.
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

    // One binding loop drives every facade member: each registry entry names
    // its group, facade key, and method, so adding an operation is one
    // registry entry — never another hand-written `.bind()`/`wrap()` pair.
    const groupMembers = Object.fromEntries(groups.map((group) => [group, {}] as const)) as Record<
        MalOperationGroup,
        Record<string, unknown>
    >;
    for (const { group, entry, instance } of wired) {
        // The dynamic method lookup is the one place the seam needs a cast:
        // the entry's method name is only known as `string` here, while the
        // instance is typed as `BaseOperation`. Existence is guaranteed by
        // the registry's `op()`, which constrains the facade key to a real
        // method on the operation class at registry-definition time.
        const method = (instance as unknown as Record<string, unknown>)[entry.methodName];
        groupMembers[group][entry.name] = maybeWrap(
            (method as (...args: unknown[]) => Promise<unknown>).bind(instance)
        );
    }

    // The object below is assembled dynamically from the registry, so the
    // cast through `unknown` is the mechanical bridge to the handwritten
    // facade type. The compile-time contract lives elsewhere and is not
    // weakened by it: the registry's parity asserts keep the group member
    // sets equal to `MyAnimeListApi`'s group interfaces, and the registry's
    // `op()` entries keep every facade key bound to a real operation-class
    // method — the same division of labor AniList's wiring uses.
    return {
        ...groupMembers,
        // The pagination helpers are provider-owned pure functions over
        // the shared engine — no transport state to bind, so they are
        // exposed directly alongside the wired groups.
        paginate: malPaginate,
        paginatePages: malPaginatePages,
    } as unknown as MyAnimeListApi;
}
