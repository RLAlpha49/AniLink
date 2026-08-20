import { APIWrapper } from "../../../base/APIWrapper";
import { sendRequest } from "../../../base/RequestHandler";
import { validateVariables } from "../../../base/ValidateVariables";
import { type BasicUser, BasicUserSchema } from "../interfaces/Basic";
import { type LikeableType, LikeableTypeMappings } from "../types/Type";

/**
 * `LikeVariables` is an interface representing the variables for the `LikeQuery`.
 * It includes the id and type of the likeable item.
 * @see https://docs.anilist.co/reference/query
 */
export interface LikeVariables {
    /**
     * `likeableId` is a number representing the id of the likeable item.
     */
    likeableId: number;

    /**
     * `type` is a string representing the type of the likeable item.
     */
    type: LikeableType;
}

/**
 * `LikeQuery` is a class representing a query for users who liked a model.
 * It includes a method to send the like query and receive the response.
 * @see https://docs.anilist.co/reference/query
 */
export class LikeQuery extends APIWrapper {
    /**
     * `authToken` is a string representing the authentication token.
     */
    private readonly authToken?: string;

    /**
     * Constructs a new `LikeQuery` instance.
     *
     * @param authToken - The authentication token.
     */
    constructor(authToken?: string) {
        super("https://graphql.anilist.co");
        this.authToken = authToken;
    }

    /**
     * `like` is a method that sends a query request to get users who liked a model.
     *
     * @param variables - The variables for the query.
     * @returns The response from the query request.
     * @see https://docs.anilist.co/reference/query
     */
    async like(variables: LikeVariables): Promise<BasicUser> {
        if (!variables) {
            throw new Error("At least one variable must be set");
        }

        validateVariables(variables, {
            likeableId: "number",
            type: LikeableTypeMappings,
        });

        const query = `
      query ($likeableId: Int, $type: LikeableType) {
        Like (likeableId: $likeableId, type: $type) {
          ${BasicUserSchema}
        }
      }
    `;

        return await sendRequest(this.baseURL, "POST", { query, variables }, this.authToken);
    }
}
