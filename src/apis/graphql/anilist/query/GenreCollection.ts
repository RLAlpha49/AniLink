import { AniListOperation } from "../AniListOperation";
import type { RequestOptions } from "../../../../base/RequestHandler";

/**
 * {@link GenreCollectionQuery} fetches AniList's complete genre collection.
 * It extends {@link AniListOperation} and exposes {@link GenreCollectionQuery.genreCollection}.
 *
 * Takes no variables.
 *
 * @param options - Optional per-request transport settings merged over the instance-level ones for this call only; see {@link RequestOptions}.
 * @returns The list of genre strings.
 * @see https://docs.anilist.co/reference/query
 */
export class GenreCollectionQuery extends AniListOperation {
    /**
     * {@link GenreCollectionQuery.genreCollection} sends a query request to get genre collections.
     *
     * @returns The genre strings returned by AniList.
     * @see https://docs.anilist.co/reference/query
     * @param options - Optional {@link RequestOptions} merged over the instance-level settings for this call only.
     * @example
     * ```typescript
     * const genres = await new GenreCollectionQuery().genreCollection();
     * ```
     */
    async genreCollection(options?: RequestOptions): Promise<string> {
        const query = `
      query {
        GenreCollection
      }
    `;

        return await this.execute<string>(query, undefined, { transportOptions: options });
    }
}
