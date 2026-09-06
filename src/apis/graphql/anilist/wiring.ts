/**
 * Instance construction and namespace assembly for the AniList facade.
 *
 * The object graph is assembled from the declarative operation registry in
 * `registry.ts` — one entry per operation, keyed by its facade path. Adding an
 * operation therefore touches exactly two sites: the registry entry and the
 * matching declaration on the group type under `facade/`. The facade group
 * modules carry a compile-time `Record<RegistryXxxKeys, true>` parity constant
 * so the two sites cannot drift without failing `tsc`.
 *
 * Operations are constructed lazily: each facade property is a getter that
 * instantiates and binds its operation class on first access, then caches the
 * bound method so the same instance — and its per-instance `stateOwner`
 * (circuit breaker / retry budget state) — is reused on every subsequent
 * call. A consumer that only touches `query.media` never pays the
 * construction cost for the other registered operations. Mis-wired entries
 * (a registry key whose operation class lacks the declared method) still
 * fail fast at build time via a cheap prototype check, before any instance is
 * allocated.
 */
import { CustomRequest } from "./CustomRequest";
import { fuzzyDate } from "./helpers/fuzzyDate";
import { flattenMediaListCollection } from "./helpers/flattenMediaListCollection";
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
 * access. The per-instance `stateOwner` and auth/options are not allocated
 * here — only the prototype is inspected.
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
 * shared auth material and transport options, binds the declared method, and
 * caches the bound function in a closure variable; every subsequent access
 * returns the same bound function — and therefore the same instance, so the
 * per-instance `stateOwner` (circuit breaker / retry budget state) stays
 * stable for the lifetime of the facade.
 *
 * @param category - The registry group to wire.
 * @param authToken - The authentication material shared by every operation instance.
 * @param options - Timeout, cancellation, and debugging settings for API requests.
 * @returns A plain object whose keys are the registry entries' facade names.
 */
function buildLazyGroup(
    category: OperationCategory,
    authToken: RequestAuthInput | undefined,
    options: RequestOptions | undefined
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
                    const instance = new entry.operationClass(
                        authToken,
                        options
                    ) as unknown as Record<string, unknown>;
                    const method = instance[entry.methodName];
                    if (typeof method !== "function") {
                        throw new TypeError(
                            `Operation "${entry.name}" does not expose a "${entry.methodName}" method to bind.`
                        );
                    }
                    bound = (method as (...args: unknown[]) => unknown).bind(instance);
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
 * {@link buildLazyGroup}); only the registry is validated eagerly. The
 * `custom` escape hatch is likewise constructed on first access.
 *
 * @param authToken - The authentication material shared by every operation instance. A plain string is treated as a bearer token; a structured {@link RequestAuthInput} carries explicit headers for schemes such as Basic auth or a provider API key.
 * @param options - Timeout, cancellation, and debugging settings for API requests.
 * @returns The composed AniList API surface.
 */
export function buildAniListWiring(
    authToken?: RequestAuthInput,
    options?: RequestOptions
): AniListApi {
    for (const category of ["query", "page", "mutation"] as const) {
        validateCategoryMethods(category);
    }

    const queryFacade = buildLazyGroup("query", authToken, options);
    const pageFacade = buildLazyGroup("page", authToken, options);
    const mutationFacade = buildLazyGroup("mutation", authToken, options);

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
            flattenMediaListCollection,
        },
        {
            custom: {
                enumerable: true,
                configurable: false,
                get() {
                    if (customBound === undefined) {
                        const customInstance = new CustomRequest(authToken, options);
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
