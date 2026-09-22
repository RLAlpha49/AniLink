/**
 * Per-provider credential shapes accepted by the {@link AniLink} constructor.
 *
 * Every provider owns its own credentials: AniList authenticates with a
 * bearer token, while REST providers such as MyAnimeList carry their own
 * access-token and PKCE fields. All shapes extend {@link ProviderCredentials}
 * so transport settings stay uniform across providers.
 */
import { type RequestAuthInput, type RequestOptions } from "./RequestHandler";
import { TRANSPORT_OPTION_KEYS } from "./requestOptions";

/**
 * Transport settings shared by every provider's slot in an
 * {@link AniLinkCredentials} object. Provider-specific credential types
 * extend this with their own authentication fields; the settings always
 * apply to that provider's operations only.
 *
 * @see {@link AniLinkCredentials}
 */
export interface ProviderCredentials extends RequestOptions {
    /** Provider-specific credentials are defined by the provider implementation. */
    readonly [credential: string]: unknown;
}

/**
 * AniList-specific credentials: a bearer token, optional automatic
 * token-refresh fields, and transport settings. OAuth helper functions
 * live in `apis/graphql/anilist/auth`.
 *
 * The refresh fields (`refreshToken`, `clientId`, `clientSecret`,
 * `onTokenRefresh`, `onTokenRefreshError`) opt a client into the automatic
 * token-refresh lifecycle (the shared `TokenRefresher`, bound to AniList's
 * grant in `apis/graphql/anilist/tokenRefresh.ts` and wired in
 * `apis/graphql/anilist/wiring.ts`): a 401 from an expired access token
 * — or a missing token on an auth-required operation — triggers one
 * deduplicated refresh grant and a single replayed request.
 *
 * @see {@link resolveAniListCredentials}
 */
export interface AniListCredentials extends ProviderCredentials {
    /** The bearer token sent on authenticated AniList requests. */
    authToken?: string;
    /** The AniList OAuth2 refresh token used to obtain a new access token. */
    refreshToken?: string;
    /** The AniList application client ID used by OAuth helpers. */
    clientId?: string;
    /** The AniList application secret, required by AniList's refresh grant. */
    clientSecret?: string;
    /**
     * Called after every successful automatic token refresh so callers can
     * persist the new access/refresh token pair. Enables the automatic
     * refresh lifecycle together with `refreshToken`, `clientId`, and
     * `clientSecret`.
     */
    onTokenRefresh?: import("../apis/graphql/anilist/tokenRefresh").AniListTokenRefreshCallback;
    /**
     * Called when an automatic token-refresh grant fails, with the sanitized
     * refresh error the awaiting caller catches. Fires once per failed
     * grant — concurrent 401s share one failure event.
     */
    onTokenRefreshError?: import("../apis/graphql/anilist/tokenRefresh").AniListTokenRefreshErrorCallback;
}

/**
 * MyAnimeList-specific credentials consumed by the REST provider.
 *
 * MAL authenticates with an OAuth2 access token obtained through its PKCE
 * flow; `accessToken` and `clientId` are translated into the provider-neutral
 * request-auth value without leaking either field into other providers'
 * requests.
 *
 * The inherited transport-level `onHookError` (a {@link RequestOptions} field,
 * not a MAL-specific one) does double duty on this slot: the transport
 * invokes it for request-hook failures, and the automatic token-refresh
 * lifecycle (the shared `TokenRefresher`, bound to MAL's grant in
 * `apis/rest/mal/tokenRefresh.ts` and wired in `apis/rest/mal/wiring.ts`)
 * consumes the same value for token-refresh observer failures — a failed
 * refresh grant is reported under the `malTokenRefresh` hook name and a
 * throwing `onTokenRefresh` callback under the `onTokenRefresh` hook name.
 * A slot-level `onHookError` therefore covers both failure classes; the
 * client-level `onHookError` on {@link AniLinkCredentials} covers them only
 * when the slot defines no observer of its own.
 *
 * @see {@link resolveMalCredentials}
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
    /**
     * Called after every successful automatic token refresh so callers can
     * persist the new access/refresh token pair. Enables the automatic
     * refresh lifecycle together with `refreshToken` and `clientId`.
     */
    onTokenRefresh?: import("../apis/rest/mal/tokenRefresh").MalTokenRefreshCallback;
    /**
     * Called when an automatic token-refresh grant fails, with the sanitized
     * refresh error the awaiting caller catches. Fires once per failed
     * grant — concurrent 401s share one failure event.
     */
    onTokenRefreshError?: import("../apis/rest/mal/tokenRefresh").MalTokenRefreshErrorCallback;
}

/**
 * The per-provider credentials object accepted by the {@link AniLink} constructor.
 *
 * Each key targets exactly one provider namespace (`aniLink.anilist`,
 * `aniLink.mal`, …); credentials given under one key are never applied to
 * another provider's requests. The optional top-level `onHookError` is a
 * client-level default applied to every provider slot that does not define
 * its own, so a single hook-error logger can be wired once instead of
 * repeated per slot.
 *
 * @see {@link ProviderCredentials}
 */
export interface AniLinkCredentials {
    /** Credentials for the AniList provider surface. */
    anilist?: AniListCredentials;
    /** Credentials for the MyAnimeList provider surface. */
    mal?: MalCredentials;
    /**
     * Client-level default for the `onHookError` lifecycle hook, applied to
     * every provider slot that does not define its own `onHookError`. Lets
     * consumers route hook failures to a real logger once per client instead
     * of repeating the wiring on every call or accepting uncorrelated
     * `console.warn` noise.
     */
    onHookError?: import("./RequestHandler").OnHookErrorHandler;
    /**
     * Client-level default for the `diagnostics` mode, applied to every
     * provider slot that does not define its own `diagnostics`. Lets
     * consumers silence the library's unsolicited diagnostics for the whole
     * client (for example `"silent"` in captured-console environments)
     * instead of repeating the setting on every slot.
     */
    diagnostics?: import("./transportTypes").DiagnosticsMode;
}

/**
 * Whether a credential string is configured: a non-empty string whose
 * whitespace-only values count as missing, exactly like the empty string.
 *
 * Both provider wirings apply this same rule when deciding whether the
 * automatic token-refresh lifecycle activates, so a whitespace-only
 * `refreshToken` or `clientId` never triggers a doomed refresh grant on
 * every 401.
 *
 * @param value - The credential value to test.
 * @returns `true` when the value is a string with at least one non-whitespace character.
 */
export const isNonBlank = (value: string | undefined): value is string =>
    typeof value === "string" && value.trim() !== "";

/**
 * Normalized authentication and transport settings for one provider slot.
 *
 * Credential resolvers use this shape to keep provider-specific fields out of
 * the shared operation-constructor seam while preserving provider-only auth.
 *
 * @see {@link resolveAniListCredentials}
 * @see {@link resolveMalCredentials}
 */
export interface ResolvedProviderCredentials {
    /** Authentication material for the provider's request operations. */
    auth?: RequestAuthInput;
    /** Transport settings with provider-only authentication fields removed. */
    options?: RequestOptions;
}

/**
 * Splits a provider credential slot into plain transport options, dropping
 * the provider's own auth fields and rejecting unknown keys.
 *
 * An unknown key is usually a mistyped credential field (for example
 * `accesstoken` instead of `accessToken`), so it throws a `TypeError` naming
 * the valid transport and provider fields instead of silently ignoring the
 * value.
 *
 * @param credentials - The provider credential slot to split.
 * @param providerFields - The provider's own auth field names, excluded from the transport options.
 * @returns The transport options, or `undefined` when the slot carried none.
 * @throws A `TypeError` when the slot carries an unknown credential key.
 */
const resolveTransportOptions = (
    credentials: ProviderCredentials,
    providerFields: readonly string[]
): RequestOptions | undefined => {
    const allowedKeys = new Set<string>([...TRANSPORT_OPTION_KEYS, ...providerFields]);
    const options: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(credentials)) {
        if (providerFields.includes(key)) continue;
        if (!allowedKeys.has(key)) {
            throw new TypeError(
                `Unknown credential key "${key}". Valid transport options are: ${TRANSPORT_OPTION_KEYS.join(
                    ", "
                )}. Provider auth fields are: ${providerFields.join(", ")}.`
            );
        }
        options[key] = value;
    }
    return Object.keys(options).length === 0 ? undefined : (options as RequestOptions);
};

/**
 * Splits AniList authentication from the shared transport settings.
 *
 * Unknown keys are rejected with a `TypeError` at client construction so a
 * mistyped credential field (for example `accesstoken` instead of
 * `authToken`) fails immediately instead of being silently ignored.
 *
 * @param credentials - The AniList credential slot.
 * @returns Provider authentication and transport settings, or empty values when omitted.
 * @throws A `TypeError` when the slot carries an unknown credential key.
 *
 * @see {@link AniListCredentials}
 */
export function resolveAniListCredentials(
    credentials: AniListCredentials | undefined
): ResolvedProviderCredentials {
    if (credentials === undefined) return {};
    return {
        auth: credentials.authToken,
        options: resolveTransportOptions(credentials, [
            "authToken",
            "refreshToken",
            "clientId",
            "clientSecret",
            "onTokenRefresh",
            "onTokenRefreshError",
        ]),
    };
}

/**
 * Splits MAL authentication and OAuth fields from the shared transport settings.
 *
 * The `X-MAL-CLIENT-ID` header is attached only when no access token is
 * configured: that is MAL's documented use for the header (client-ID-only
 * access to public endpoints). When a bearer token is present,
 * `Authorization: Bearer` is the authentication and the extra header would
 * only widen client-ID exposure to intermediaries that log request headers.
 *
 * Unknown keys are rejected with a `TypeError` at client construction so a
 * mistyped credential field fails immediately instead of being silently
 * ignored.
 *
 * @param credentials - The MAL credential slot.
 * @returns Provider authentication and transport settings, or empty values when omitted.
 * @throws A `TypeError` when the slot carries an unknown credential key.
 *
 * @see {@link MalCredentials}
 */
export function resolveMalCredentials(
    credentials: MalCredentials | undefined
): ResolvedProviderCredentials {
    if (credentials === undefined) return {};
    const headers =
        credentials.clientId !== undefined && credentials.accessToken === undefined
            ? { "X-MAL-CLIENT-ID": credentials.clientId }
            : undefined;
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
            "onTokenRefresh",
            "onTokenRefreshError",
        ]),
    };
}
