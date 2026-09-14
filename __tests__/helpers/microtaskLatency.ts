/**
 * Simulate `count` units of request latency by yielding to the microtask
 * queue, so tests get varied settle orders deterministically instead of
 * racing real timer durations on loaded CI runners.
 */
export async function microtaskLatency(count: number): Promise<void> {
    for (let i = 0; i < count; i += 1) {
        await Promise.resolve();
    }
}
