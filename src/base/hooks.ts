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
import type { HttpMethod, OnHookErrorHandler, RequestErrorContext } from "./transportTypes";
import type { ResolvedRequestOptions } from "./requestOptions";

/**
 * Invokes a user-supplied lifecycle hook without letting its exceptions
 * escape into the request pipeline. A throwing hook is reported through the
 * configured `onHookError` callback (falling back to a console warning) and
 * otherwise ignored: it must not crash the request, be counted as an attempt,
 * or distort retry and error classification.
 *
 * @param hook - The hook callback, if configured.
 * @param name - The hook's option name, used in the report.
 * @param onHookError - Consumer callback observing hook failures, when configured.
 * @param args - Arguments forwarded verbatim to the hook.
 */
export const safeInvoke = (
    hook: ((...args: never[]) => void) | undefined,
    name: string,
    onHookError: OnHookErrorHandler | undefined,
    ...args: unknown[]
): void => {
    if (hook === undefined) {
        return;
    }
    try {
        (hook as (...hookArgs: unknown[]) => void)(...args);
    } catch (hookError: unknown) {
        if (onHookError !== undefined) {
            try {
                onHookError(name, hookError);
            } catch {
                // A failing observer must never break the request pipeline.
            }
            return;
        }
        const firstArg = args[0];
        const requestId =
            firstArg !== null &&
            typeof firstArg === "object" &&
            "requestId" in firstArg &&
            typeof (firstArg as { requestId?: unknown }).requestId === "string"
                ? (firstArg as { requestId: string }).requestId
                : undefined;
        const correlation = requestId === undefined ? "" : ` (requestId: ${requestId})`;
        console.warn(
            `[AniLink] ${name} hook threw and was ignored${correlation}:`,
            hookError instanceof Error ? hookError.message : hookError
        );
    }
};

/**
 * Builds the context object handed to the error lifecycle hooks.
 *
 * @param requestId - The correlation ID of the logical request.
 * @param url - The URL the request was sent to.
 * @param method - The HTTP method of the request.
 * @param attempt - The 1-based attempt number.
 * @param normalized - The normalized failure for the attempt.
 * @param nextDelayMs - The scheduled retry delay, when the failure will be retried.
 * @returns The populated hook context.
 */
export const buildErrorContext = (
    requestId: string,
    url: string,
    method: HttpMethod,
    attempt: number,
    normalized: AniLinkError,
    nextDelayMs?: number
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
    ...(nextDelayMs === undefined ? {} : { nextDelayMs }),
});

/**
 * Reports a failed attempt through the error hooks. A retryable failure goes
 * to `onRetry` (falling back to `onError`) with the scheduled delay; a
 * terminal failure goes to `onError` only.
 */
export const reportFailure = (
    requestId: string,
    url: string,
    method: HttpMethod,
    attempt: number,
    normalized: AniLinkError,
    resolved: ResolvedRequestOptions,
    nextDelayMs?: number
): void => {
    const context = buildErrorContext(requestId, url, method, attempt, normalized, nextDelayMs);
    if (nextDelayMs !== undefined) {
        safeInvoke(
            resolved.onRetry ?? resolved.onError,
            resolved.onRetry === undefined ? "onError" : "onRetry",
            resolved.onHookError,
            normalized,
            context
        );
        return;
    }
    safeInvoke(resolved.onError, "onError", resolved.onHookError, normalized, context);
};
