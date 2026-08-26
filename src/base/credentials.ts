/**
 * Per-provider credential shapes accepted by the `AniLink` constructor.
 *
 * Every provider owns its own credentials: AniList authenticates with a
 * bearer token, while REST providers such as MyAnimeList carry their own
 * access-token (and later PKCE) fields. All shapes extend
 * {@link ProviderCredentials} so transport settings stay uniform across
 * providers.
 */
import type { RequestOptions } from "./RequestHandler";

/**
 * Credential and transport settings shared by every provider's slot in an
 * {@link AniLinkCredentials} object. A provider-specific credentials type
 * extends this with its own auth fields; the transport settings always apply
 * to that provider's operations only.
 */
export interface ProviderCredentials extends RequestOptions {
    /**
     * The bearer token sent as the `Authorization` header on authenticated
     * requests for this provider. Optional: omit it to use only public
     * endpoints.
     */
    authToken?: string;
}

/**
 * AniList-specific credentials. Currently a bearer token plus transport
 * settings; OAuth helper functions live in `apis/graphql/anilist/auth`.
 */
export type AniListCredentials = ProviderCredentials;

/**
 * MyAnimeList-specific credentials reserved by the multi-provider seam.
 *
 * MAL authenticates with an OAuth2 access token obtained through its PKCE
 * flow; `accessToken` is the field name used by the future MAL wiring so the
 * constructor can already accept and store it without leaking it into other
 * providers' requests.
 */
export interface MalCredentials extends ProviderCredentials {
    /**
     * The MAL OAuth2 access token. Distinct from {@link ProviderCredentials.authToken}
     * so each provider's token is stored under its own name until the MAL
     * provider module consumes it.
     */
    accessToken?: string;
}

/**
 * The per-provider credentials object accepted by the `AniLink` constructor.
 *
 * Each key targets exactly one provider namespace (`aniLink.anilist`,
 * `aniLink.mal`, …); credentials given under one key are never applied to
 * another provider's requests.
 */
export interface AniLinkCredentials {
    /** Credentials for the AniList provider surface. */
    anilist?: AniListCredentials;
    /** Credentials for the MyAnimeList provider surface (reserved). */
    mal?: MalCredentials;
}

/**
 * Normalizes a provider credentials slot into the transport options that
 * provider's wiring consumes.
 *
 * The returned object carries both the transport settings and the provider
 * authToken field (when set), so a single object flows through the existing
 * (authToken, options) operation-constructor seam without any provider
 * learning another provider's credential fields.
 *
 * @param credentials - The credentials given under one provider key.
 * @returns The merged options for that provider, or undefined when no credentials were given.
 */
export function resolveProviderCredentials(
    credentials: ProviderCredentials | undefined
): ProviderCredentials | undefined {
    if (credentials === undefined) return undefined;
    const { authToken, ...transportOptions } = credentials;
    return authToken === undefined ? { ...transportOptions } : { ...transportOptions, authToken };
}
