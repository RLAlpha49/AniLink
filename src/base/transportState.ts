/**
 * Read-only transport-state snapshots.
 *
 * Owns the public snapshot types and the single {@link snapshotTransportState}
 * builder that composes them from the three resilience state maps (circuit
 * breaker, retry budget, rate-limit pacing). The snapshot answers the
 * monitoring questions the lifecycle hooks cannot — "is the breaker open
 * right now?", "how many budget retries are spent?", "when does the pacing
 * deadline elapse?" — without pre-wiring any hook and without mutating the
 * state it observes: it reads through the dedicated `peek*` helpers, which
 * never create state entries, roll the retry-budget window, clear stale
 * pacing deadlines, or refresh circuit-scope LRU recency.
 */
import { peekCircuitStates } from "./circuitBreaker";
import { peekRetryBudgetState } from "./retry";
import { peekPaceDeadlines } from "./pacing";

/**
 * A frozen copy of one host-scoped {@link CircuitState} record, as exposed by
 * {@link snapshotTransportState}. The `host` field names the upstream the
 * breaker state is scoped to; the remaining fields mirror the live record's
 * values at snapshot time.
 */
export interface CircuitStateSnapshot {
    /** The upstream host the breaker state is scoped to. */
    host: string;
    /** Consecutive availability failures since the last success. */
    consecutiveFailures: number;
    /** Epoch milliseconds at which the breaker opened, or `null` while closed. */
    openedAt: number | null;
    /** Whether the reserved half-open probe is currently in flight. */
    probeInFlight: boolean;
    /** Consecutive failed half-open probes since the breaker last opened. */
    failedProbes: number;
}

/**
 * A frozen copy of the per-owner {@link RetryBudgetState} record, as exposed
 * by {@link snapshotTransportState}. Present on a snapshot only when the
 * observed client has a recorded budget window (a `retryBudget`-configured
 * client that has dispatched at least one request); a disabled or
 * not-yet-exercised budget yields no `retryBudget` field at all.
 */
export interface RetryBudgetSnapshot {
    /** Retries spent in the current window. */
    retriesUsed: number;
    /** Epoch milliseconds at which the current window ends and resets. */
    windowEndsAt: number;
}

/**
 * A frozen copy of one host-scoped rate-limit pacing deadline, as exposed by
 * {@link snapshotTransportState}. The `deadlineMs` field is the epoch
 * millisecond at which the recorded window resets — the same value the next
 * dispatch to `host` waits for.
 */
export interface PaceDeadlineSnapshot {
    /** The upstream host the pacing deadline applies to. */
    host: string;
    /** Epoch milliseconds at which the rate-limit window resets. */
    deadlineMs: number;
}

/**
 * The read-only transport-state snapshot for one state owner, as returned by
 * {@link snapshotTransportState} and exposed per provider by
 * `AniLink#getTransportState`. Every nested object and array is deep-frozen:
 * mutating a snapshot throws (in strict mode) instead of silently succeeding,
 * and the snapshot never aliases the live mutable state, so a consumer cannot
 * perturb transport behavior through it.
 *
 * The snapshot is a point-in-time copy, not a live view: fields reflect the
 * values observed when the snapshot was taken.
 */
export interface TransportStateSnapshot {
    /** Frozen per-host circuit-breaker records, one per host the client has sent breaker-tracked traffic to. */
    circuit: readonly CircuitStateSnapshot[];
    /** Frozen retry-budget record, present only when the client has a recorded budget window. */
    retryBudget?: RetryBudgetSnapshot;
    /** Frozen per-host rate-limit pacing deadlines, one per host with a recorded (not yet elapsed-and-cleared) deadline. */
    paceDeadlines: readonly PaceDeadlineSnapshot[];
}

/**
 * Builds a deep-frozen, point-in-time copy of one state owner's transport
 * state — circuit-breaker scopes, retry-budget window, and rate-limit pacing
 * deadlines — for monitoring and introspection.
 *
 * The snapshot is strictly read-only in both directions: it never aliases the
 * live mutable state (consumers get frozen copies), and building it never
 * mutates the state it observes. Reading does not create a circuit-state
 * entry for an unseen host, does not roll an elapsed retry-budget window
 * forward (a spent window is reported as spent), and does not clear a stale
 * pacing deadline — so polling `getTransportState` on a schedule is safe
 * alongside live traffic.
 *
 * @param owner - The stable per-client state owner threaded through the
 * provider wiring (exposed on the `stateOwners` field of
 * {@link ProviderClients}).
 * @returns A deep-frozen {@link TransportStateSnapshot} of the owner's
 * recorded state.
 * @example
 * ```typescript
 * const state = aniLink.getTransportState();
 * for (const breaker of state.anilist.circuit) {
 *     console.log(breaker.host, breaker.openedAt === null ? "closed" : "open");
 * }
 * ```
 */
export const snapshotTransportState = (owner: object): TransportStateSnapshot => {
    const circuitScopes = peekCircuitStates(owner);
    const circuit: CircuitStateSnapshot[] =
        circuitScopes === undefined
            ? []
            : Array.from(circuitScopes, ([host, state]) =>
                  Object.freeze({
                      host,
                      consecutiveFailures: state.consecutiveFailures,
                      openedAt: state.openedAt,
                      probeInFlight: state.probeInFlight,
                      failedProbes: state.failedProbes,
                  })
              );

    const budget = peekRetryBudgetState(owner);
    const deadlines = peekPaceDeadlines(owner);
    const paceDeadlines: PaceDeadlineSnapshot[] =
        deadlines === undefined
            ? []
            : Array.from(deadlines, ([host, deadlineMs]) => Object.freeze({ host, deadlineMs }));

    return Object.freeze({
        circuit: Object.freeze(circuit),
        ...(budget !== undefined
            ? {
                  retryBudget: Object.freeze({
                      retriesUsed: budget.retriesUsed,
                      windowEndsAt: budget.windowEndsAt,
                  }),
              }
            : {}),
        paceDeadlines: Object.freeze(paceDeadlines),
    });
};
