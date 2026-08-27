import type { AxiosError, AxiosResponse, AxiosStatic } from "axios";
import { vi } from "vitest";

/**
 * A faithful, shared double of the axios surface `RequestHandler` consumes.
 *
 * The transport suites previously assembled this shape inline per file and the
 * copies drifted (different `isCancel` predicates, different default
 * responses). This helper is the single source for that double so upgrades to
 * axios flag stub gaps in one place instead of silently diverging per suite.
 *
 * The stub mirrors the real axios contract:
 * - `isAxiosError` checks the `isAxiosError: true` marker axios sets on its
 *   errors.
 * - `isCancel` checks the `isCanceled: true` marker (`ERR_CANCELED`) set by
 *   real cancellations.
 * - `create(config)` returns a callable instance whose calls are recorded by
 *   the returned `request` mock; the config is captured so tests can assert
 *   keep-alive agent wiring if needed.
 */
export interface AxiosStub {
    /** The recorded request function backing every created instance. */
    request: ReturnType<typeof vi.fn>;
    /** The `axios.create` mock; resolves to {@link AxiosStub.request}. */
    create: ReturnType<typeof vi.fn>;
    /** The `axios.isAxiosError` implementation. */
    isAxiosError: (error: unknown) => boolean;
    /** The `axios.isCancel` implementation. */
    isCancel: (error: unknown) => boolean;
    /** The full module shape passed to `vi.mock("axios", ...)`. */
    module: { default: AxiosStatic };
}

/**
 * Builds the shared axios double. Call it inside `vi.hoisted(() => ...)` and
 * spread `module` into the `vi.mock("axios", ...)` factory exactly as shown
 * in the handler suites.
 *
 * @param defaultResponse - What request calls resolve with until a test overrides them. Defaults to a single-root-field GraphQL envelope.
 * @returns The stub pieces plus the ready-to-spread mock module shape.
 */
export const createAxiosStub = (
    defaultResponse: Partial<AxiosResponse> = { data: { data: { Media: { id: 1 } } } }
): AxiosStub => {
    const request = vi.fn(async (): Promise<Partial<AxiosResponse>> => ({ ...defaultResponse }));
    const create = vi.fn(() => request);
    const isAxiosError = (error: unknown): boolean =>
        Boolean((error as { isAxiosError?: boolean } | null)?.isAxiosError);
    const isCancel = (error: unknown): boolean =>
        Boolean((error as { isCanceled?: boolean } | null)?.isCanceled);

    return {
        request,
        create,
        isAxiosError,
        isCancel,
        module: {
            default: Object.assign(vi.fn(), {
                create,
                isAxiosError,
                isCancel,
            }) as unknown as AxiosStatic,
        },
    };
};

/**
 * Builds an error object shaped like a real AxiosError response failure.
 *
 * Real axios errors carry `isAxiosError: true`, a `response` with status,
 * body, and headers, and a config object. Tests that assert normalization or
 * retry behavior should build failures through this factory instead of
 * hand-rolling objects so they cannot drift from the real shape.
 *
 * @param status - The HTTP status to report on the fake response.
 * @param headers - Response headers; defaults to none.
 * @param data - The response body; defaults to a minimal message envelope.
 * @returns An axios-error-shaped object accepted by the shared stub's `isAxiosError`.
 */
export const makeAxiosResponseError = (
    status: number,
    headers: Record<string, string> = {},
    data: unknown = { message: `status ${status}` }
): AxiosError =>
    ({
        isAxiosError: true,
        code: "ERR_BAD_RESPONSE",
        response: { status, data, headers },
        config: {},
    }) as unknown as AxiosError;

/**
 * Builds an error object shaped like a real axios cancellation.
 *
 * @param message - The cancellation message.
 * @returns An axios-error-shaped cancellation accepted by the shared stub's `isCancel`.
 */
export const makeAxiosCancelError = (message = "canceled"): AxiosError =>
    ({
        isAxiosError: true,
        isCanceled: true,
        code: "ERR_CANCELED",
        message,
        config: {},
    }) as unknown as AxiosError;

declare global {
    var __anilinkAxiosStub: AxiosStub | undefined;
}

/**
 * Hands the stub created inside a `vi.mock("axios", ...)` factory to the
 * suite's test bodies.
 *
 * `vi.hoisted` cannot reference statically imported helpers (the hoisted
 * callback runs before module imports initialize), so suites create the stub
 * inside an async mock factory and stash it here; tests retrieve it with
 * {@link getAxiosStub}. This works identically under every Vitest pool.
 *
 * @param stub - The stub created inside the mock factory.
 * @returns Nothing; stores the stub for later retrieval by the suite.
 */
export const stashAxiosStub = (stub: AxiosStub): void => {
    globalThis.__anilinkAxiosStub = stub;
};

/**
 * Retrieves the stub stashed by the suite's `vi.mock("axios", ...)` factory.
 *
 * @returns The active stub.
 * @throws When called before the mock factory ran (wrong setup order).
 */
export const getAxiosStub = (): AxiosStub => {
    const stub = globalThis.__anilinkAxiosStub;
    if (!stub) {
        throw new Error(
            'axios stub is not installed yet; create it inside vi.mock("axios", ...) via stashAxiosStub first'
        );
    }
    return stub;
};
