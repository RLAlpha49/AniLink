/**
 * The complete set of `RequestOptions` keys, used by the credential
 * seam to allowlist transport fields and reject mistyped credential keys
 * (for example `accesstoken` instead of `accessToken`) at client
 * construction instead of silently ignoring them.
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
] as const;
