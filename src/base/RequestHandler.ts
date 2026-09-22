/**
 * Public re-export facade for the provider-agnostic transport.
 *
 * The ordered request implementation lives in `./requestPipeline`. This
 * module keeps the existing transport import path and re-exports the option,
 * hook, cache-adjacent, envelope, retry, and agent APIs unchanged.
 */
export { sendRequest } from "./requestPipeline";
export type { SendRequestOptions } from "./requestPipeline";
export { DEFAULT_REQUEST_TIMEOUT, MAX_FREE_SOCKETS, MAX_SOCKETS } from "./transportTypes";
export type {
    RetryBudget,
    RetryPolicy,
    HttpMethod,
    RequestAuth,
    RequestAuthInput,
    RequestErrorContext,
    OnErrorHandler,
    RequestContext,
    OnRequestStartHandler,
    OnResponseHandler,
    OnPaceHandler,
    OnHookErrorHandler,
    AniLinkDiagnostic,
    DiagnosticsMode,
    CircuitOpenContext,
    OnCircuitOpenHandler,
    OnCircuitCloseHandler,
    RequestOptions,
} from "./transportTypes";
export { destroyCachedAgents } from "./agents";
export type { GraphQLResponseEnvelope, UnwrapOptions } from "./envelope";
export { unwrapSingleRootField, unwrapGraphQLResponse } from "./envelope";
export { parseRetryAfter, getBackoffDelay, applyJitter } from "./retry";
