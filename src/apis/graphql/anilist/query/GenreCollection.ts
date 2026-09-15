import { AniListOperation } from "../AniListOperation";
import type { RequestOptions } from "../../../../base/RequestHandler";

/**
 * {@link GenreCollectionQuery} executes the AniList genre-collection query through {@link AniListOperation}.
 * Its public operation is {@link GenreCollectionQuery.genreCollection}.
 * @see https://docs.anilist.co/reference/query
 */
export class GenreCollectionQuery extends AniListOperation {
    /**
     * {@link GenreCollectionQuery.genreCollection} sends a query request to get AniList's complete genre
     * collection. Takes no variables.
     *
     * @returns The list of genre strings returned by AniList.
     * @see https://docs.anilist.co/reference/query
     * @param options - Optional {@link RequestOptions} merged over the instance-level settings for this call only.
     * @example
     * ```typescript
     * const genres = await new GenreCollectionQuery().genreCollection();
     * ```
     */
    async genreCollection(options?: RequestOptions): Promise<string[]> {
        const query = `
      query {
        GenreCollection
      }
    `;

        return await this.execute<string[]>(query, undefined, { transportOptions: options });
    }
}
