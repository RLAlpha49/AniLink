/**
 * Abort-aware delay primitive shared by the retry loop and rate-limit pacing.
 *
 * Resolves after `ms` unless the supplied `AbortSignal` fires first, in which
 * case it rejects with an `ABORTED` {@link AniLinkNetworkError} stamped with
 * the request's correlation ID. The timer is `unref`-ed so it never keeps the
 * event loop alive on its own. Kept as a standalone module so both the retry
 * loop (`./RequestHandler`) and the pacing wait (`./pacing`) share one
 * implementation without forming a cycle.
 */
import { AniLinkErrorCodes, AniLinkNetworkError } from "./AniLinkError";
import { stampRequestId } from "./errors";

export const sleep = (ms: number, signal?: AbortSignal, requestId?: string): Promise<void> =>
    new Promise((resolve, reject) => {
        const timeout: NodeJS.Timeout = setTimeout(() => {
            signal?.removeEventListener("abort", abort);
            resolve();
        }, ms);
        timeout.unref();

        const abort = (): void => {
            clearTimeout(timeout);
            const error = new AniLinkNetworkError(
                AniLinkErrorCodes.ABORTED,
                "The request was cancelled."
            );
            stampRequestId(error, requestId);
            reject(error);
        };

        if (signal?.aborted) {
            abort();
            return;
        }
        signal?.addEventListener("abort", abort, { once: true });
    });
