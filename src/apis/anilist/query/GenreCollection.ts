import { APIWrapper } from "../../../base/APIWrapper";

/**
 * `GenreCollectionQuery` is a class representing a query for genre collections.
 * It includes a method to get genre collections.
 * @see https://docs.anilist.co/reference/query
 */
export class GenreCollectionQuery extends APIWrapper {
    /**
     * `genreCollection` is a method that sends a query request to get genre collections.
     *
     * @returns The response from the query request.
     * @see https://docs.anilist.co/reference/query
     */
    async genreCollection(): Promise<string> {
        const query = `
      query {
        GenreCollection
      }
    `;

        return await this.execute<string>(query, undefined, {});
    }
}
