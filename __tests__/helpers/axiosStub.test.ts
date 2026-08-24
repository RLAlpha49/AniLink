import { describe, expect, test } from "vitest";
import { createAxiosStub, makeAxiosCancelError, makeAxiosResponseError } from "./axiosStub";

/**
 * Meta-tests guarding the shared axios double against fixture drift.
 *
 * The transport suites run against this stub instead of real axios, so any
 * gap between the stub's surface and the members `RequestHandler` actually
 * consumes would let regressions slip through green suites. These tests pin
 * the stub's contract explicitly; when axios grows new consumed members,
 * extend both the stub and this file together.
 */
describe("shared axios stub contract", () => {
    test("exposes every axios member the request pipeline consumes", () => {
        const stub = createAxiosStub();

        expect(typeof stub.module.default.create).toBe("function");
        expect(typeof stub.module.default.isAxiosError).toBe("function");
        expect(typeof stub.module.default.isCancel).toBe("function");

        expect(stub.module.default.isAxiosError(makeAxiosResponseError(500))).toBe(true);
        expect(stub.module.default.isAxiosError(new Error("plain"))).toBe(false);
        expect(stub.module.default.isCancel(makeAxiosCancelError())).toBe(true);
        expect(stub.module.default.isCancel(makeAxiosResponseError(500))).toBe(false);
    });

    test("create records its config and returns an instance backed by the request mock", async () => {
        const stub = createAxiosStub();

        const instance = stub.module.default.create({ timeout: 123 });
        expect(stub.create).toHaveBeenCalledWith({ timeout: 123 });

        const request = instance as unknown as (config: unknown) => Promise<unknown>;
        await expect(request({ url: "https://graphql.anilist.co" })).resolves.toEqual({
            data: { data: { Media: { id: 1 } } },
        });
        expect(stub.request).toHaveBeenCalledTimes(1);
    });

    test("the response-error factory mirrors the axios error shape the normalizer reads", () => {
        const error = makeAxiosResponseError(429, { "retry-after": "2" }, { message: "slow down" });

        expect(error.isAxiosError).toBe(true);
        expect(error.response?.status).toBe(429);
        expect(error.response?.data).toEqual({ message: "slow down" });
        expect((error.response?.headers as Record<string, string>)["retry-after"]).toBe("2");
    });
});
