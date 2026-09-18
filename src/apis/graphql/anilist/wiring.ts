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
import { CustomRequest } from "./CustomRequest";
import { fuzzyDate } from "./helpers/fuzzyDate";
import { fuzzyDateInt } from "./helpers/fuzzyDateInt";
import { flattenMediaListCollection } from "./helpers/flattenMediaListCollection";
import { crossLink } from "./helpers/crossLink";
import { paginate, paginatePages, paginateChunks } from "./Paginator";
import { type RequestAuthInput, type RequestOptions } from "../../../base/RequestHandler";
import type { AniListApi } from "./facade";
import { ANILIST_OPERATION_REGISTRY, type OperationCategory } from "./registry";

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
 * @param category - The registry group to wire.
 * @param authToken - The authentication material shared by every operation instance.
 * @param options - Timeout, cancellation, and debugging settings for API requests.
 * @param stateOwner - The shared per-client owner of cross-request transport state (circuit breaker, retry budget, pacing deadlines), passed to every constructed operation so resilience state spans the whole client.
 * @returns A plain object whose keys are the registry entries' facade names.
 */
function buildLazyGroup(
    category: OperationCategory,
    authToken: RequestAuthInput | undefined,
    options: RequestOptions | undefined,
    stateOwner: object
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
                        authToken,
                        options,
                        stateOwner
                    ) as unknown as Record<string, unknown>;
                    bound = (instance[entry.methodName] as (...args: unknown[]) => unknown).bind(
                        instance
                    );
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
 * @param authToken - The authentication material shared by every operation instance. A plain string is treated as a bearer token; a structured {@link RequestAuthInput} carries explicit headers for schemes such as Basic auth or a provider API key.
 * @param options - Timeout, cancellation, and debugging settings for API requests.
 * @param stateOwner - Stable per-client object keying the shared transport state (breaker, budget, pacing); when omitted, a fresh one is allocated for this client.
 * @returns The composed AniList API surface.
 */
export function buildAniListWiring(
    authToken?: RequestAuthInput,
    options?: RequestOptions,
    stateOwner?: object
): AniListApi {
    for (const category of ["query", "page", "mutation"] as const) {
        validateCategoryMethods(category);
    }

    // One shared owner for the whole client: every operation constructed
    // below keys its cross-request transport state (breaker, budget, pacing)
    // through this object, so resilience spans operations instead of being
    // siloed per operation instance.
    const sharedStateOwner: object = stateOwner ?? {};

    const queryFacade = buildLazyGroup("query", authToken, options, sharedStateOwner);
    const pageFacade = buildLazyGroup("page", authToken, options, sharedStateOwner);
    const mutationFacade = buildLazyGroup("mutation", authToken, options, sharedStateOwner);

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
        },
        {
            custom: {
                enumerable: true,
                configurable: false,
                get() {
                    if (customBound === undefined) {
                        const customInstance = new CustomRequest(
                            authToken,
                            options,
                            sharedStateOwner
                        );
                        customBound = customInstance.custom.bind(customInstance) as (
                            ...args: never[]
                        ) => unknown;
                    }
                    return customBound;
                },
            },
        }
    ) as AniListApi;
}
