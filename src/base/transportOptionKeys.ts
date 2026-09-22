/**
 * The complete set of `RequestOptions` keys, used by the credential
 * seam to allowlist transport fields and reject mistyped credential keys
 * (for example `accesstoken` instead of `accessToken`) at client
 * construction instead of silently ignoring them.
 */
import type { RequestOptions } from "./transportTypes";

/**
 * Every key of {@link RequestOptions}, in one array.
 *
 * The `satisfies` clause and the exhaustiveness assertion below bind this
 * list to the interface: adding a field to `RequestOptions` without adding
 * it here fails `tsc`, and listing a key the interface does not have fails
 * too. The array cannot drift from the type it enumerates.
 */
export const TRANSPORT_OPTION_KEYS = [
    "timeout",
    "signal",
    "exposeRawAxiosError",
    "retry",
    "paceWithRateLimit",
    "rateLimitFloor",
    "circuitBreaker",
    "retryBudget",
    "maxSockets",
    "maxFreeSockets",
    "onError",
    "onRetry",
    "onRequestStart",
    "onResponse",
    "onPace",
    "onHookError",
    "diagnostics",
    "onCircuitOpen",
    "onCircuitClose",
    "ignorePaceDeadline",
    "allowPartialData",
    "responseCache",
    "bypassResponseCache",
] as const satisfies readonly (keyof RequestOptions)[];

/**
 * The `RequestOptions` keys missing from {@link TRANSPORT_OPTION_KEYS}.
 * Empty (`never`) as long as the array lists every key.
 *
 * @internal
 */
type MissingTransportOptionKeys = Exclude<
    keyof RequestOptions,
    (typeof TRANSPORT_OPTION_KEYS)[number]
>;

/**
 * Compile-time proof that {@link TRANSPORT_OPTION_KEYS} lists every
 * `RequestOptions` key: the missing-keys union must satisfy the `never`
 * constraint. When a new option is added to `RequestOptions` without its
 * array entry, this assertion fails the build naming the missing key.
 *
 * @internal
 */
type AssertAllTransportOptionsListed<T extends never> = T;
type _TransportOptionKeysComplete = AssertAllTransportOptionsListed<MissingTransportOptionKeys>;
