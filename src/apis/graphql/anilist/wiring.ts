/**
 * Instance construction and namespace assembly for the AniList facade.
 *
 * The object graph is assembled from the declarative operation registry in
 * `registry.ts` — one entry per operation, keyed by its facade path. Adding
 * an operation therefore touches the operation class and its registry entry,
 * then regenerates the group types under `facade/` with
 * `npm run facade:generate`. The generated facade group modules carry
 * compile-time parity asserts so the registry and the typed surface cannot
 * drift without failing `tsc`.
 *
 * Operations are constructed lazily: each facade property is a getter that
 * instantiates and binds its operation class on first access, then caches the
 * bound method so the same instance is reused on every subsequent call. All
 * operations of one client share a single per-client `stateOwner` (circuit
 * breaker / retry budget / pacing state), so failure streaks, retry budgets,
 * and rate-limit deadlines accumulate across the whole client — a deadline
 * recorded by `query.media` gates `query.user` too — while staying scoped
 * per upstream host inside the state maps. A consumer that only touches
 * `query.media` never pays the construction cost for the other registered
 * operations. Mis-wired entries (a registry key whose operation class lacks
 * the declared method) still fail fast at build time via a cheap prototype
 * check, before any instance is allocated.
 */
import { isNonBlank } from "../../../base/credentials";
import type { BaseOperation } from "../../../base/BaseOperation";
import { CustomRequest } from "./CustomRequest";
import { fuzzyDate } from "./helpers/fuzzyDate";
import { fuzzyDateInt } from "./helpers/fuzzyDateInt";
import { flattenMediaListCollection } from "./helpers/flattenMediaListCollection";
import { crossLink } from "./helpers/crossLink";
import {
    watchNotifications,
    watchActivity,
    type FetchActivitiesPage,
    type FetchNotificationsPage,
    type WatchActivityOptions,
    type WatchNotificationsOptions,
} from "./helpers/watch";
import { paginate, paginatePages, paginateChunks } from "./Paginator";
import { type RequestAuthInput, type RequestOptions } from "../../../base/RequestHandler";
import type { AniListCredentials } from "../../../base/credentials";
import type { AniListApi } from "./facade";
import { ANILIST_OPERATION_REGISTRY, type OperationCategory } from "./registry";
import { buildAniListTokenRefresher, buildRefreshedAuth } from "./tokenRefresh";

/**
 * Validates that every entry in a registry category exposes its declared
 * bound method on the operation class prototype.
 *
 * This is a cheap structural check (no instantiation) run eagerly at build
 * time so a mis-wired registry entry fails fast with the exact method the
 * registry declared, rather than deferring the error to first property
 * access. The shared per-client `stateOwner` and auth/options are not
 * allocated here — only the prototype is inspected.
 *
 * @param category - The registry group to validate.
 */
function validateCategoryMethods(category: OperationCategory): void {
    for (const entry of ANILIST_OPERATION_REGISTRY[category]) {
        const method = (entry.operationClass.prototype as unknown as Record<string, unknown>)[
            entry.methodName
        ];
        if (typeof method !== "function") {
            throw new TypeError(
                `Operation "${entry.name}" does not expose a "${entry.methodName}" method to bind.`
            );
        }
    }
}

/**
 * The subset of a registered operation class instance the wiring seam needs:
 * enough surface to swap refreshed auth material in place through the
 * `BaseOperation` contract. Every registered operation class (and
 * `CustomRequest`) extends `BaseOperation`, so the tracked-instance list is
 * typed without an index signature and the auth swap stays compile-checked.
 */
type OperationInstance = BaseOperation;

/**
 * Builds a lazy facade group object for one registry category.
 *
 * Each registered key becomes an enumerable getter on the returned object.
 * The first access of a key constructs the operation instance against the
 * shared auth material, transport options, and shared per-client
 * `stateOwner`, binds the declared method, and caches the bound function in
 * a closure variable; every subsequent access returns the same bound
 * function — and therefore the same instance. The resilience state itself
 * (circuit breaker / retry budget / pacing deadlines) lives in the shared
 * per-client owner, so it spans every operation of the client, not just this
 * one.
 *
 * The auth material is read through the `getAuth` accessor at
 * construction time instead of capturing a static value: with the automatic
 * token-refresh lifecycle configured, the accessor reads the wiring's live
 * auth cell, so an instance constructed after a refresh grant starts life
 * with the already-refreshed token. The bound method passes through
 * `maybeWrap` so the lifecycle can intercept every call without breaking
 * the construct-once caching.
 *
 * @param category - The registry group to wire.
 * @param getAuth - Accessor returning the authentication material shared by every operation instance; re-read on each first access so lazily-constructed operations pick up refreshed auth.
 * @param options - Timeout, cancellation, and debugging settings for API requests.
 * @param stateOwner - The shared per-client owner of cross-request transport state (circuit breaker, retry budget, pacing deadlines), passed to every constructed operation so resilience state spans the whole client.
 * @param onConstructed - Called with each operation instance right after construction so the token-refresh lifecycle can reach operations that do not exist at wiring time.
 * @param maybeWrap - Applied to each bound method at bind time; the identity pass-through when the refresh lifecycle is off.
 * @returns A plain object whose keys are the registry entries' facade names.
 */
function buildLazyGroup(
    category: OperationCategory,
    getAuth: () => RequestAuthInput | undefined,
    options: RequestOptions | undefined,
    stateOwner: object,
    onConstructed?: (operation: OperationInstance) => void,
    maybeWrap: <A extends unknown[], R>(
        method: (...args: A) => Promise<R>
    ) => (...args: A) => Promise<R> = (method) => method
): Record<string, unknown> {
    const entries = ANILIST_OPERATION_REGISTRY[category];
    const descriptors: PropertyDescriptorMap = {};
    for (const entry of entries) {
        let bound: ((...args: unknown[]) => unknown) | undefined;
        descriptors[entry.name] = {
            enumerable: true,
            configurable: false,
            get() {
                if (bound === undefined) {
                    // Method existence is guaranteed by `validateCategoryMethods`,
                    // which ran over the class prototype before this group was
                    // built — bind directly without a second check.
                    const instance = new entry.operationClass(
                        getAuth(),
                        options,
                        stateOwner
                    ) as unknown as OperationInstance;
                    onConstructed?.(instance);
                    // The dynamic method lookup is the one place the seam
                    // needs a cast: the registry entry's method name is only
                    // known as `string` here, while the instance is typed as
                    // `BaseOperation`. Existence is guaranteed by
                    // `validateCategoryMethods`.
                    const method = (
                        (instance as unknown as Record<string, unknown>)[entry.methodName] as (
                            ...args: unknown[]
                        ) => Promise<unknown>
                    ).bind(instance);
                    bound = maybeWrap(method) as (...args: unknown[]) => unknown;
                }
                return bound;
            },
        };
    }
    return Object.defineProperties({}, descriptors);
}

/**
 * Builds the AniList facade from the operation classes.
 *
 * Operations are constructed lazily on first property access (see
 * `buildLazyGroup`); only the registry is validated eagerly. The
 * `custom` escape hatch is likewise constructed on first access. Every
 * operation — including `custom` — is constructed with one shared per-client
 * `stateOwner`, so circuit-breaker streaks, retry budgets, and rate-limit
 * pacing deadlines span every operation of the returned client (still keyed
 * per upstream host inside the state maps). When the caller supplies a
 * `stateOwner` (the composition seam does, so `AniLink#getTransportState`
 * can snapshot the client's resilience state), that object is used; a
 * direct `buildAniListApi` call without one allocates a fresh owner exactly
 * as before.
 *
 * When the credential slot carries refresh fields, every facade method is
 * wrapped with the automatic token-refresh lifecycle (see
 * automatic refresh lifecycle); without them the facade keeps the direct bound
 * methods — zero wrapper overhead, zero behavior change.
 *
 * @param authToken - The authentication material shared by every operation instance. A plain string is treated as a bearer token; a structured {@link RequestAuthInput} carries explicit headers for schemes such as Basic auth or a provider API key.
 * @param options - Timeout, cancellation, and debugging settings for API requests.
 * @param stateOwner - Stable per-client object keying the shared transport state (breaker, budget, pacing); when omitted, a fresh one is allocated for this client.
 * @param credentials - The raw AniList credential slot, read for the optional automatic token-refresh lifecycle fields; transport settings on the slot are ignored here because they already flow through `options`.
 * @returns The composed AniList API surface.
 */
export function buildAniListWiring(
    authToken?: RequestAuthInput,
    options?: RequestOptions,
    stateOwner?: object,
    credentials?: AniListCredentials
): AniListApi {
    for (const category of ["query", "page", "mutation"] as const) {
        validateCategoryMethods(category);
    }

    // One shared owner for the whole client: every operation constructed
    // below keys its cross-request transport state (breaker, budget, pacing)
    // through this object, so resilience spans operations instead of being
    // siloed per operation instance.
    const sharedStateOwner: object = stateOwner ?? {};

    // Live auth cell for the whole wiring. Lazy getters read it through
    // `getAuth` at construction time; without the refresh lifecycle the
    // cell is written exactly once (below), matching the previous
    // static-capture behavior.
    let currentAuth: RequestAuthInput | undefined = authToken;

    // Tracks every operation instance as it is lazily constructed so the
    // refresher can swap auth onto instances that do not exist yet at wiring
    // time. Never written (and never iterated) when the lifecycle is off.
    const createdOperations: OperationInstance[] = [];

    // The token-refresh lifecycle is opt-in: it activates only when the
    // refresh token, client ID, and client secret are all configured
    // (non-blank — a whitespace-only value is treated as missing, matching
    // the empty-string case and MAL's wiring). AniList's refresh grant
    // requires the client secret, unlike MAL where it is optional: without
    // the full set every 401 would trigger a doomed refresh grant instead of
    // surfacing the 401, so the lifecycle stays off entirely. Values are
    // trimmed before use so a credential copied with trailing whitespace
    // still authenticates.
    const refresher =
        isNonBlank(credentials?.refreshToken) &&
        isNonBlank(credentials?.clientId) &&
        isNonBlank(credentials?.clientSecret)
            ? buildAniListTokenRefresher({
                  clientId: credentials.clientId.trim(),
                  clientSecret: credentials.clientSecret.trim(),
                  refreshToken: credentials.refreshToken.trim(),
                  onTokenRefresh: credentials.onTokenRefresh,
                  onTokenRefreshError: credentials.onTokenRefreshError,
                  onHookError: credentials.onHookError,
                  diagnostics: credentials.diagnostics,
                  applyAccessToken: (accessToken) => {
                      // Two swap paths, because instances do not all exist
                      // yet: the auth-cell write covers operations
                      // constructed after this refresh (their getters read
                      // the cell at construction time), and the
                      // tracked-instance updateAuth calls cover the ones the
                      // replayed request is about to hit. Both run inside the
                      // deduplicated grant, so concurrent 401s observe one
                      // swap. Each tracked instance rebuilds from its live
                      // auth so headers on structured auth survive the swap.
                      const refreshed = buildRefreshedAuth(currentAuth, accessToken);
                      currentAuth = refreshed;
                      for (const operation of createdOperations) {
                          operation.updateAuth(
                              buildRefreshedAuth(operation.getAuth(), accessToken)
                          );
                      }
                  },
              })
            : undefined;

    const trackOperation = refresher
        ? (operation: OperationInstance): void => {
              createdOperations.push(operation);
          }
        : undefined;

    // The per-method refresh wrapper, or the identity pass-through when the
    // lifecycle is off so lazy getters bind the raw method unchanged.
    const maybeWrap = refresher
        ? <A extends unknown[], R>(
                  method: (...args: A) => Promise<R>
              ): ((...args: A) => Promise<R>) =>
              (...args: A) =>
                  refresher.executeWithRefresh(() => method(...args))
        : <A extends unknown[], R>(
              method: (...args: A) => Promise<R>
          ): ((...args: A) => Promise<R>) => method;

    const getAuth = (): RequestAuthInput | undefined => currentAuth;
    const queryFacade = buildLazyGroup(
        "query",
        getAuth,
        options,
        sharedStateOwner,
        trackOperation,
        maybeWrap
    );
    const pageFacade = buildLazyGroup(
        "page",
        getAuth,
        options,
        sharedStateOwner,
        trackOperation,
        maybeWrap
    );
    const mutationFacade = buildLazyGroup(
        "mutation",
        getAuth,
        options,
        sharedStateOwner,
        trackOperation,
        maybeWrap
    );

    // The nested `page` namespace lives on the query facade as a plain
    // enumerable value (its own lazy-getter object), so `Object.keys` on
    // `query` lists it alongside the query keys.
    Object.defineProperty(queryFacade, "page", {
        value: pageFacade,
        enumerable: true,
        configurable: false,
        writable: false,
    });

    let customBound: ((...args: never[]) => unknown) | undefined;
    let customPageBound: ((...args: never[]) => unknown) | undefined;

    // The `watch` namespace wires each helper to the page facade's already-
    // lazily-bound operation methods (`query.page.notifications` /
    // `query.page.activities`): the getters construct the operation against
    // the shared auth cell, transport options, and per-client `stateOwner`
    // and pass it through the token-refresh wrapper, so the watchers' poll
    // requests join the client's resilience state exactly like a direct
    // `query.page.notifications` call. The watchers themselves stay pure
    // helpers over a fetch closure.
    //
    // `buildLazyGroup` erases its members to `unknown` (the registry only
    // names them), so the wrappers below narrow the facade through the
    // *public* facade contract instead of casting to the watcher's fetch
    // type: the call sites are compile-checked against `AniListApi`'s
    // declared page operations, so a signature drift on either side fails
    // the build instead of surfacing mid-poll.
    const page = pageFacade as unknown as Pick<
        AniListApi["query"]["page"],
        "notifications" | "activities"
    >;
    const notificationsFetch: FetchNotificationsPage = (variables, options) =>
        page.notifications(variables, options);
    const activitiesFetch: FetchActivitiesPage = (variables, options) =>
        page.activities(variables, options);
    const watchFacade = {
        notifications: (watchOptions?: WatchNotificationsOptions) =>
            watchNotifications(notificationsFetch, watchOptions),
        activity: (watchOptions?: WatchActivityOptions) =>
            watchActivity(activitiesFetch, watchOptions),
    };

    return Object.defineProperties(
        {
            query: queryFacade,
            mutation: mutationFacade,
            paginate,
            paginatePages,
            paginateChunks,
            fuzzyDate,
            fuzzyDateInt,
            flattenMediaListCollection,
            crossLink,
            watch: watchFacade,
        },
        {
            custom: {
                enumerable: true,
                configurable: false,
                get() {
                    if (customBound === undefined) {
                        const customInstance = new CustomRequest(
                            getAuth(),
                            options,
                            sharedStateOwner
                        );
                        trackOperation?.(customInstance);
                        customBound = maybeWrap(customInstance.custom.bind(customInstance)) as (
                            ...args: never[]
                        ) => unknown;
                    }
                    return customBound;
                },
            },
            customPage: {
                enumerable: true,
                configurable: false,
                get() {
                    if (customPageBound === undefined) {
                        const customPageInstance = new CustomRequest(
                            getAuth(),
                            options,
                            sharedStateOwner
                        );
                        trackOperation?.(customPageInstance);
                        customPageBound = maybeWrap(
                            customPageInstance.customPage.bind(customPageInstance)
                        ) as (...args: never[]) => unknown;
                    }
                    return customPageBound;
                },
            },
        }
    ) as AniListApi;
}
