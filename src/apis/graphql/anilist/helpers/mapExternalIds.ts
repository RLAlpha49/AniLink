import { sendRequest, type RequestOptions } from "../../../../base/RequestHandler";
import { mergeOptions } from "../../../../base/requestOptions";

/**
 * ARM identifier sources supported by the AniList/MAL mapping helper.
 *
 * @see https://arm.haglund.dev/
 */
export type MapExternalIdsSource = "anilist" | "myanimelist";

/**
 * Optional request settings for {@link mapExternalIds}.
 *
 * @see https://arm.haglund.dev/
 */
export type MapExternalIdsOptions = RequestOptions;

/**
 * Bidirectional AniList/MAL lookup maps returned by {@link mapExternalIds}.
 *
 * @see https://arm.haglund.dev/
 */
export interface MapExternalIdsResult {
    /** AniList media id → MyAnimeList id, for mapped entries. */
    anilistToMal: ReadonlyMap<number, number>;

    /** MyAnimeList id → AniList media id, for mapped entries. */
    malToAnilist: ReadonlyMap<number, number>;

    /** Input ids without a mapping to the other source, in input order. */
    unmapped: readonly number[];
}

interface ArmIdRelation {
    anilist?: number | null;
    myanimelist?: number | null;
}

const ARM_IDS_URL = "https://arm.haglund.dev/api/v2/ids?include=anilist,myanimelist";
const ARM_MAX_IDS_PER_REQUEST = 100;

/**
 * Query ARM for AniList↔MyAnimeList mappings for a batch of ids.
 *
 * This opt-in helper makes an unauthenticated request to ARM's ID mapping
 * service through AniLink's shared transport. It is separate from `crossLink`,
 * which builds maps from media already fetched and makes no network requests.
 * Missing ARM mappings are included in `unmapped`. AniList credentials are
 * never sent to ARM.
 *
 * See the ARM API documentation for its current request and response contract.
 *
 * @param source - The source of the input ids, either `anilist` or `myanimelist`.
 * @param ids - The source ids to map. An empty array returns empty maps without a request.
 * @param options - Optional AniLink transport settings, including timeout, cancellation,
 * retries, and request hooks.
 * @returns Bidirectional id maps and the input ids without a mapping, as a {@link MapExternalIdsResult}.
 * @see https://arm.haglund.dev/
 * @see https://github.com/BeeeQueue/arm-server
 * @example
 * ```typescript
 * const { anilistToMal, unmapped } = await mapExternalIds("anilist", [21, 22]);
 * const malId = anilistToMal.get(21);
 * ```
 */
export async function mapExternalIds(
    source: MapExternalIdsSource,
    ids: readonly number[],
    options: MapExternalIdsOptions = {}
): Promise<MapExternalIdsResult> {
    return requestMapExternalIds(source, ids, options, options);
}

/**
 * Binds the standalone ARM helper to AniList instance settings and shared transport state.
 *
 * @param instanceOptions - AniList-wide transport settings.
 * @param stateOwner - The per-client owner shared with AniList operations.
 * @returns A facade function that accepts per-call transport overrides.
 * @internal
 */
export const buildMapExternalIdsFacade =
    (instanceOptions: RequestOptions | undefined, stateOwner: object) =>
    (
        source: MapExternalIdsSource,
        ids: readonly number[],
        options?: MapExternalIdsOptions
    ): Promise<MapExternalIdsResult> =>
        requestMapExternalIds(source, ids, mergeOptions(instanceOptions, options), stateOwner);

const requestMapExternalIds = async (
    source: MapExternalIdsSource,
    ids: readonly number[],
    options: RequestOptions | undefined,
    stateOwner: object
): Promise<MapExternalIdsResult> => {
    const anilistToMal = new Map<number, number>();
    const malToAnilist = new Map<number, number>();
    const unmapped: number[] = [];

    if (ids.length === 0) {
        return { anilistToMal, malToAnilist, unmapped };
    }

    for (let offset = 0; offset < ids.length; offset += ARM_MAX_IDS_PER_REQUEST) {
        const batchIds = ids.slice(offset, offset + ARM_MAX_IDS_PER_REQUEST);
        const responseBody = await sendRequest<unknown>(
            ARM_IDS_URL,
            "POST",
            batchIds.map((id) => ({ [source]: id })),
            undefined,
            {
                options,
                protocol: "rest",
                stateOwner,
            }
        );
        if (!Array.isArray(responseBody) || responseBody.length !== batchIds.length) {
            throw new TypeError("ARM ID mapping response did not contain one result per input id.");
        }

        for (let index = 0; index < batchIds.length; index += 1) {
            const relation = responseBody[index] as ArmIdRelation | null;
            const inputId = batchIds[index];
            const mappedId = source === "anilist" ? relation?.myanimelist : relation?.anilist;

            if (typeof mappedId !== "number") {
                unmapped.push(inputId);
                continue;
            }

            if (source === "anilist") {
                anilistToMal.set(inputId, mappedId);
                malToAnilist.set(mappedId, inputId);
            } else {
                anilistToMal.set(mappedId, inputId);
                malToAnilist.set(inputId, mappedId);
            }
        }
    }

    return { anilistToMal, malToAnilist, unmapped };
};
