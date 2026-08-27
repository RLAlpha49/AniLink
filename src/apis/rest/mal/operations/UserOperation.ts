import { RestOperation } from "../../RestOperation";
import { MAL_API_BASE_URL } from "../constants";
import type { MalRequestOptions, MalUser } from "../types";

/** REST operation adapter for the authenticated MyAnimeList user endpoint. */
export class MalUserOperation extends RestOperation {
    protected readonly baseUrl = MAL_API_BASE_URL;

    /**
     * Gets the currently authenticated MyAnimeList user.
     *
     * @param options - Optional field selection and transport settings.
     * @returns The authenticated MAL user.
     * @throws An `AniLinkAuthError` without an access token, or a normalized request error.
     * @example
     * ```typescript
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
