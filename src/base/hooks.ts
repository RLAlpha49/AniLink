/**
 * Lifecycle-hook invocation and error-context construction.
 *
 * Owns the hook-injection utilities that keep user-supplied callbacks isolated
 * from the request pipeline (`safeInvoke`), the error-context builder handed
 * to the error hooks (`buildErrorContext`), and the failure reporter that
 * routes a retryable failure to `onRetry` (falling back to `onError`) and a
 * terminal failure to `onError` only. Keeping these together lets the retry
 * loop stay free of hook-wiring branching.
 */
import { AniLinkApiError, type AniLinkError } from "./AniLinkError";
import type {
    AniLinkDiagnostic,
    DiagnosticsMode,
    HttpMethod,
    OnHookErrorHandler,
    RequestErrorContext,
} from "./transportTypes";
import type { ResolvedRequestOptions } from "./requestOptions";

/**
 * Builds the structured record for one diagnostic. The `requestId` key is
 * omitted entirely when no correlation ID is in scope so serialized records
 * stay minimal for hook failures outside a request context.
 *
 * @param kind - Which diagnostic fired.
 * @param hookName - The hook or diagnostic name the failure is attributed to.
 * @param message - Human-readable description of the failure.
 * @param requestId - The correlation ID of the affected request, when in scope.
 * @returns The populated diagnostic record.
 */
const buildDiagnostic = (
    kind: AniLinkDiagnostic["kind"],
    hookName: string,
    message: string,
    requestId: string | undefined
): AniLinkDiagnostic => ({
    source: "anilink",
    kind,
    hookName,
    ...(requestId === undefined ? {} : { requestId }),
    message,
});

/**
 * Options controlling how {@link reportDiagnostic} emits one diagnostic.
 *
 * @see {@link reportDiagnostic}
 */
export interface ReportDiagnosticOptions {
    /** Which diagnostic fired. */
    kind: AniLinkDiagnostic["kind"];
    /** The hook or diagnostic name the failure is attributed to. */
    hookName: string;
    /** Human-readable description of the failure. */
    message: string;
    /** The correlation ID of the affected request, when in scope. */
    requestId?: string;
    /** Consumer callback observing hook failures, when configured. */
    onHookError?: OnHookErrorHandler;
    /** The resolved diagnostics mode for the request. */
    diagnostics: DiagnosticsMode;
    /**
     * The raw thrown value when the diagnostic reports a throwing hook, so
     * the observer can inspect the original error. Attached as the `cause`
     * of the `Error` handed to `onHookError`. A diagnostic carrying a
     * `rawError` always reaches a configured observer — the diagnostics
     * modes gate only the unsolicited fallback output, never the
     * consumer's own observer.
     */
    rawError?: unknown;
    /**
     * Whether the reported failure is rethrown to the caller after the
     * diagnostic is emitted. When `true`, the `console.warn` fallback is
     * skipped entirely: the caller receives the failure once, as the
     * rejection they already handle, instead of twice — once as console
     * noise and once as the error. A configured observer still receives
     * the diagnostic in every mode.
     */
    rethrown?: boolean;
}

/**
 * The single emit path for the library's unsolicited diagnostics — the
 * hook-failure fallback and the `stateOwner` keying warning. Both produce a
 * structured {@link AniLinkDiagnostic} record so platform log collectors get
 * filterable `source`/`kind`/`hookName`/`requestId` fields instead of prose.
 *
 * Emission follows the configured {@link DiagnosticsMode}: `"silent"`
 * suppresses the unsolicited output entirely; `"hook"` routes through
 * `onHookError` only and never touches the console; `"warn"` routes through
 * `onHookError` when configured, falling back to a `console.warn` of the
 * JSON-serialized record. One exception: a diagnostic carrying a
 * `rawError` (a real hook failure) always reaches a configured observer,
 * in every mode — the consumer asked to observe hook failures, so the
 * modes only control the fallback, never the observer itself. A throwing
 * observer is swallowed — a broken logger must never break the request
 * pipeline.
 *
 * @param options - The diagnostic to emit and how to route it.
 * @returns Whether an emission actually happened: `true` when a configured
 * observer was invoked or the record reached the console, `false` when the
 * configuration suppressed the diagnostic entirely. One-shot emitters key
 * on this result instead of re-deriving the routing — a duplicate of this
 * function's truth can drift from it (a silent-mode trigger with an
 * observer once consumed a one-shot warning while emitting nothing).
 */
export const reportDiagnostic = (options: ReportDiagnosticOptions): boolean => {
    const { kind, hookName, message, requestId, onHookError, diagnostics, rawError, rethrown } =
        options;
    if (onHookError !== undefined && (rawError !== undefined || diagnostics !== "silent")) {
        const record = buildDiagnostic(kind, hookName, message, requestId);
        try {
            onHookError(
                hookName,
                new Error(message, {
                    cause: rawError !== undefined ? rawError : record,
                })
            );
        } catch {
            // A failing observer must never break the request pipeline.
        }
        return true;
    }
    // A rethrown failure reaches the caller as the rejection they already
    // handle; the console fallback would report the same failure twice.
    if (rethrown === true || diagnostics !== "warn") {
        return false;
    }
    console.warn(JSON.stringify(buildDiagnostic(kind, hookName, message, requestId)));
    return true;
};

/**
 * Invokes a user-supplied lifecycle hook without letting its exceptions
 * escape into the request pipeline. A throwing hook is reported through the
 * structured {@link reportDiagnostic} emit path — whether or not an
 * `onHookError` observer is configured — and otherwise ignored: it must not
 * crash the request, be counted as an attempt, or distort retry and error
 * classification.
 *
 * Routing the observer path through {@link reportDiagnostic} too keeps one
 * diagnostic contract: the `Error` handed to `onHookError` always carries
 * the structured {@link AniLinkDiagnostic} record (with the raw thrown
 * value as its `cause` when one exists), so an observer never has to handle
 * both a bare user error and a structured record.
 *
 * @param hook - The hook callback, if configured.
 * @param name - The hook's option name, used in the report.
 * @param onHookError - Consumer callback observing hook failures, when configured.
 * @param diagnostics - The resolved diagnostics mode for the request.
 * @param args - Arguments forwarded verbatim to the hook; the tuple type is
 * inferred from the hook's own signature, so a mismatched call site fails
 * compilation instead of needing a cast.
 */
export const safeInvoke = <TArgs extends unknown[]>(
    hook: ((...args: TArgs) => void) | undefined,
    name: string,
    onHookError: OnHookErrorHandler | undefined,
    diagnostics: DiagnosticsMode,
    ...args: TArgs
): void => {
    if (hook === undefined) {
        return;
    }
    try {
        hook(...args);
    } catch (hookError: unknown) {
        const firstArg = args[0];
        const requestId =
            firstArg !== null &&
            typeof firstArg === "object" &&
            "requestId" in firstArg &&
            typeof (firstArg as { requestId?: unknown }).requestId === "string"
                ? (firstArg as { requestId: string }).requestId
                : undefined;
        const detail = hookError instanceof Error ? hookError.message : String(hookError);
        reportDiagnostic({
            kind: "hook-failure",
            hookName: name,
            message: `The ${name} hook threw and was ignored: ${detail}`,
            requestId,
            onHookError,
            diagnostics,
            rawError: hookError,
        });
    }
};

/**
 * The transport-supplied facts that extend {@link buildErrorContext} beyond
 * the error's own shape: cumulative retry timing, the budget-exhaustion
 * signal, and the circuit fast-fail facts. All optional so call sites pass
 * only what they know.
 *
 * @see {@link buildErrorContext}
 */
export interface ErrorContextFacts {
    /** The scheduled retry delay, when the failure will be retried. */
    nextDelayMs?: number;
    /** Total time the logical request spent waiting between attempts, when any wait occurred. */
    retryWaitMs?: number;
    /** Whether the failure surfaced because the retry budget was exhausted. */
    budgetExhausted?: boolean;
    /** The upstream host scope, on circuit fast-fail errors. */
    host?: string;
    /** The cooldown remaining on the open breaker, on circuit fast-fail errors. */
    retryAfterMs?: number;
}

/**
 * Builds the context object handed to the error lifecycle hooks.
 *
 * @param requestId - The correlation ID of the logical request.
 * @param url - The URL the request was sent to.
 * @param method - The HTTP method of the request.
 * @param attempt - The 1-based attempt number.
 * @param normalized - The normalized failure for the attempt.
 * @param facts - The transport-supplied facts: the scheduled retry delay
 * when the failure will be retried, the cumulative retry wait, the
 * budget-exhaustion signal, and the circuit fast-fail facts.
 * @returns The populated hook context.
 */
export const buildErrorContext = (
    requestId: string,
    url: string,
    method: HttpMethod,
    attempt: number,
    normalized: AniLinkError,
    facts: ErrorContextFacts = {}
): RequestErrorContext => ({
    requestId,
    url,
    method,
    attempt,
    code: normalized.code,
    ...(normalized instanceof AniLinkApiError ? { status: normalized.status } : {}),
    ...(normalized instanceof AniLinkApiError && normalized.rateLimit !== undefined
        ? { rateLimit: normalized.rateLimit }
        : {}),
    ...(facts.nextDelayMs === undefined ? {} : { nextDelayMs: facts.nextDelayMs }),
    ...(facts.retryWaitMs === undefined || facts.retryWaitMs <= 0
        ? {}
        : { retryWaitMs: facts.retryWaitMs }),
    ...(facts.budgetExhausted ? { budgetExhausted: true } : {}),
    ...(facts.host === undefined ? {} : { host: facts.host }),
    ...(facts.retryAfterMs === undefined ? {} : { retryAfterMs: facts.retryAfterMs }),
});

/**
 * Reports a failed attempt through the error hooks. A retryable failure goes
 * to `onRetry` (falling back to `onError`) with the scheduled delay; a
 * terminal failure goes to `onError` only.
 *
 * @param requestId - The correlation ID of the logical request.
 * @param url - The URL the request was sent to.
 * @param method - The HTTP method of the request.
 * @param attempt - The 1-based attempt number.
 * @param normalized - The normalized failure for the attempt.
 * @param resolved - The resolved request options carrying the error hooks.
 * @param facts - The transport-supplied context facts: the scheduled retry
 * delay when the failure will be retried, the cumulative retry wait, the
 * budget-exhaustion signal, and the circuit fast-fail facts.
 * @returns Nothing; the failure is only observed, never rethrown.
 */
export const reportFailure = (
    requestId: string,
    url: string,
    method: HttpMethod,
    attempt: number,
    normalized: AniLinkError,
    resolved: ResolvedRequestOptions,
    facts: ErrorContextFacts = {}
): void => {
    const context = buildErrorContext(requestId, url, method, attempt, normalized, facts);
    if (facts.nextDelayMs !== undefined) {
        safeInvoke(
            resolved.onRetry ?? resolved.onError,
            resolved.onRetry === undefined ? "onError" : "onRetry",
            resolved.onHookError,
            resolved.diagnostics,
            normalized,
            context
        );
        return;
    }
    safeInvoke(
        resolved.onError,
        "onError",
        resolved.onHookError,
        resolved.diagnostics,
        normalized,
        context
    );
};
