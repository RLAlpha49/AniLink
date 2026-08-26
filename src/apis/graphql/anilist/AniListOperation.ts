import { GraphQLOperation } from "../GraphQLOperation";

/**
 * The AniList GraphQL endpoint used by every AniLink operation. It is defined
 * once here and imported everywhere it is needed.
 */
export const ANILIST_GRAPHQL_URL = "https://graphql.anilist.co";

/**
 * `AniListOperation` is the AniList binding of the shared GraphQL protocol
 * layer.
 *
 * It pins the AniList endpoint onto {@link GraphQLOperation}; everything else
 * — request shaping, variable validation, envelope unwrapping, and transport
 * behaviour — is inherited unchanged. Concrete AniList operations extend this
 * class exactly as they previously extended `APIWrapper`.
 */
export abstract class AniListOperation extends GraphQLOperation {
    /**
     * The AniList GraphQL endpoint every document is POSTed to.
     */
    protected readonly graphqlUrl = ANILIST_GRAPHQL_URL;
}
