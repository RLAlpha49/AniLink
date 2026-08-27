import { RestOperation } from "../../RestOperation";
import { MAL_API_BASE_URL } from "../constants";
import type { MalRequestOptions, MalUser } from "../types";

/**
 * {@link MalUserOperation} is the REST operation adapter for the authenticated MyAnimeList user endpoint.
 *
 * It extends `RestOperation` and is composed into `MyAnimeListApi` via `buildMyAnimeListApi`, exposing {@link MalUser} through {@link MalRequestOptions} and `MyAnimeListUserApi.me`.
 *
 * @see https://myanimelist.net/apiconfig/references/api/v2#tag/users/operation/users_user_id_get
 */
export class MalUserOperation extends RestOperation {
    /** The base URL for MyAnimeList API v2, from {@link MAL_API_BASE_URL}. */
    protected readonly baseUrl = MAL_API_BASE_URL;

    /**
     * {@link MalUserOperation.me} gets the currently authenticated MyAnimeList user.
     *
     * It calls `GET /users/@me` through `RestOperation.execute` with `requiresAuth` and returns a {@link MalUser} shaped by {@link MalRequestOptions.fields}. The facade alias is `MyAnimeListUserApi.me` and it requires `MalCredentials.accessToken`.
     *
     * @param options - Optional field selection and transport settings; a {@link MalRequestOptions} merged over the instance defaults.
     * @returns The authenticated {@link MalUser}.
     * @throws An `AniLinkAuthError` without an access token, or a normalized request error.
     * @example
     * ```typescript
     * const api = new AniLink({ mal: { accessToken: "mal-token" } }).mal;
     * const user = await api.user.me({ fields: ["id", "name"] });
     * ```
     * @see https://myanimelist.net/apiconfig/references/api/v2#tag/users/operation/users_user_id_get
     */
    public async me(options: MalRequestOptions = {}): Promise<MalUser> {
        const { fields, ...transportOptions } = options;
        return await this.execute<MalUser>(
            "/users/@me",
            { requiresAuth: true, transportOptions },
            fields === undefined
                ? undefined
                : { fields: Array.isArray(fields) ? fields.join(",") : fields }
        );
    }
}
