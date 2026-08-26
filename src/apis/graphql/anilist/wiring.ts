/**
 * Instance construction and namespace assembly for the AniList facade.
 *
 * The object graph is assembled from the declarative operation registry in
 * `registry.ts` — one entry per operation, keyed by its facade path. Adding an
 * operation therefore touches exactly two sites: the registry entry and the
 * matching declaration on the group type under `facade/`.
 */
import { CustomRequest } from "./CustomRequest";
import { fuzzyDate } from "./helpers/fuzzyDate";
import { flattenMediaListCollection } from "./helpers/flattenMediaListCollection";
import { paginate, paginatePages, paginateChunks } from "./Paginator";
import { type RequestOptions } from "../../../base/RequestHandler";
import type { AniListApi } from "./facade";
import { ANILIST_OPERATION_REGISTRY, type OperationCategory } from "./registry";

/**
 * Instantiated form of a registry entry: the entry's facade key and bound
 * method name paired with a live instance constructed against the shared auth
 * token and transport options.
 */
interface InstantiatedEntry {
    name: string;
    methodName?: string;
    instance: Record<string, unknown>;
}

/**
 * Instantiates every registered operation of one category against the shared
 * auth token and transport options.
 *
 * @param category - The registry group to instantiate.
 * @param authToken - The authentication token shared by every operation instance.
 * @param options - Timeout, cancellation, and debugging settings for API requests.
 * @returns The live operation instances in registry order.
 */
function instantiateCategory(
    category: OperationCategory,
    authToken?: string,
    options?: RequestOptions
): InstantiatedEntry[] {
    return ANILIST_OPERATION_REGISTRY[category].map((entry) => ({
        name: entry.name,
        methodName: entry.methodName,
        instance: new entry.operationClass(authToken, options) as unknown as Record<
            string,
            unknown
        >,
    }));
}

/**
 * Binds instantiated entries into the facade shape: `{ name: boundMethod }`.
 *
 * @param entries - Instantiated registry entries.
 * @returns The bound methods keyed by their facade name.
 */
function bindEntries(entries: InstantiatedEntry[]): Record<string, unknown> {
    const bound: Record<string, unknown> = {};
    for (const { name, instance, methodName } of entries) {
        const method = instance[methodName ?? name];
        if (typeof method !== "function") {
            throw new TypeError(
                `Operation "${name}" does not expose a "${methodName ?? name}" method to bind.`
            );
        }
        bound[name] = (method as (...args: unknown[]) => unknown).bind(instance);
    }
    return bound;
}

/**
 * Builds the AniList facade from the operation classes.
 *
 * @param authToken - The authentication token shared by every operation instance.
 * @param options - Timeout, cancellation, and debugging settings for API requests.
 * @returns The composed AniList API surface.
 */
export function buildAniListWiring(authToken?: string, options?: RequestOptions): AniListApi {
    const customInstance = new CustomRequest(authToken, options);

    const [queryEntries, pageEntries, mutationEntries] = (
        ["query", "page", "mutation"] as const
    ).map((category) => instantiateCategory(category, authToken, options));

    return {
        custom: customInstance.custom.bind(customInstance),
        query: {
            ...bindEntries(queryEntries),
            page: bindEntries(pageEntries),
        },
        mutation: bindEntries(mutationEntries),
        paginate,
        paginatePages,
        paginateChunks,
        fuzzyDate,
        flattenMediaListCollection,
    } as AniListApi;
}
