/**
 * Simulate `count` units of request latency by yielding to the microtask
 * queue, so tests get varied settle orders deterministically instead of
 * racing real timer durations on loaded CI runners.
 *
 * @param count - How many microtask ticks to yield.
 * @returns A promise that resolves once `count` ticks have settled.
 */
export async function microtaskLatency(count: number): Promise<void> {
    for (let i = 0; i < count; i += 1) {
        await Promise.resolve();
    }
}
