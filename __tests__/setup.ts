/**
 * Global test setup, loaded by every Vitest suite via `setupFiles`.
 *
 * Hard-fails any accidental real network access: both `global.fetch` and the
 * `axios` module are replaced with a function that throws. Suites that need
 * HTTP behavior must mock the AniLink transport (see
 * {@link mockSendRequest}) or the axios double (see {@link createAxiosStub})
 * instead of letting a stray call escape to the network.
 */
import { vi } from "vitest";

/**
 * The shared "network is off" guard installed for `fetch` and `axios`.
 *
 * @returns Never; always throws to surface unintended network calls loudly.
 * @throws Error when invoked, so any unmocked request fails the test fast.
 */
const networkDisabled = (): never => {
    throw new Error(
        "Network access is disabled in tests. Mock the AniLink request transport instead."
    );
};

global.fetch = networkDisabled as typeof fetch;

vi.mock("axios", () => ({
    __esModule: true,
    default: Object.assign(networkDisabled, {
        create: () => networkDisabled,
    }),
}));
