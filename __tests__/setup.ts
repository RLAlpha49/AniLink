import { vi } from "vitest";

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
