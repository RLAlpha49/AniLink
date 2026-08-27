/**
 * Per-provider credential shapes accepted by the `AniLink` constructor.
 *
 * Every provider owns its own credentials: AniList authenticates with a
 * bearer token, while REST providers such as MyAnimeList carry their own
 * access-token and PKCE fields. All shapes extend {@link ProviderCredentials}
 * so transport settings stay uniform across providers.
 */
import { type RequestAuthInput, type RequestOptions } from "./RequestHandler";

/**
 * Transport settings shared by every provider's slot in an
 * {@link AniLinkCredentials} object. Provider-specific credential types
 * extend this with their own authentication fields; the settings always
 * apply to that provider's operations only.
 */
export interface ProviderCredentials extends RequestOptions {
    /** Provider-specific credentials are defined by the provider implementation. */
    readonly [credential: string]: unknown;
}

/**
 * AniList-specific credentials. Currently a bearer token plus transport
 * settings; OAuth helper functions live in `apis/graphql/anilist/auth`.
 */
export interface AniListCredentials extends ProviderCredentials {
    /** The bearer token sent on authenticated AniList requests. */
    authToken?: string;
}

/**
 * MyAnimeList-specific credentials consumed by the REST provider.
 *
 * MAL authenticates with an OAuth2 access token obtained through its PKCE
 * flow; `accessToken` and `clientId` are translated into the provider-neutral
 * request-auth value without leaking either field into other providers'
 * requests.
 */
export interface MalCredentials extends ProviderCredentials {
    /** The MAL OAuth2 access token, kept in this provider's credential slot. */
    accessToken?: string;
    /** The MAL OAuth2 refresh token used to obtain a new access token. */
    refreshToken?: string;
    /** The MAL application client ID used by OAuth helpers. */
    clientId?: string;
    /** The MAL application secret, when the application requires one. */
    clientSecret?: string;
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
    /** Credentials for the MyAnimeList provider surface. */
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
export interface ResolvedProviderCredentials {
    /** Authentication material for the provider's request operations. */
    auth?: RequestAuthInput;
    /** Transport settings with provider-only authentication fields removed. */
    options?: RequestOptions;
}

const resolveTransportOptions = (
    credentials: ProviderCredentials,
    providerFields: readonly string[]
): RequestOptions | undefined => {
    const options = Object.fromEntries(
        Object.entries(credentials).filter(([key]) => !providerFields.includes(key))
    ) as RequestOptions;
    return Object.keys(options).length === 0 ? undefined : options;
};

/**
 * Splits AniList authentication from the shared transport settings.
 *
 * @param credentials - The AniList credential slot.
 * @returns Provider authentication and transport settings, or empty values when omitted.
 */
export function resolveAniListCredentials(
    credentials: AniListCredentials | undefined
): ResolvedProviderCredentials {
    if (credentials === undefined) return {};
    return {
        auth: credentials.authToken,
        options: resolveTransportOptions(credentials, ["authToken"]),
    };
}

/**
 * Splits MAL authentication and OAuth fields from the shared transport settings.
 *
 * @param credentials - The MAL credential slot.
 * @returns Provider authentication and transport settings, or empty values when omitted.
 */
export function resolveMalCredentials(
    credentials: MalCredentials | undefined
): ResolvedProviderCredentials {
    if (credentials === undefined) return {};
    const headers =
        credentials.clientId === undefined
            ? undefined
            : { "X-MAL-CLIENT-ID": credentials.clientId };
    return {
        auth:
            credentials.accessToken === undefined && headers === undefined
                ? undefined
                : { token: credentials.accessToken, headers },
        options: resolveTransportOptions(credentials, [
            "accessToken",
            "refreshToken",
            "clientId",
            "clientSecret",
        ]),
    };
}

/**
 * Copies an AniList credential slot for legacy callers.
 *
 * @param credentials - The AniList credential slot.
 * @returns A shallow copy of the slot, or undefined.
 */
export function resolveProviderCredentials(
    credentials: AniListCredentials | undefined
): AniListCredentials | undefined {
    return credentials === undefined ? undefined : { ...credentials };
}
