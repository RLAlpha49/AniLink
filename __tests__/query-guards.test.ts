import { AniLinkValidationError } from "../src/base/AniLinkError";
import { requireVariables } from "../src/base/ValidateVariables";
import { describe, expect, test } from "vitest";

describe("requireVariables helper", () => {
    test("kind one passes when at least one variable is set", () => {
        expect(() =>
            requireVariables({ asHtml: true }, { kind: "one" }, "needs one")
        ).not.toThrow();
    });

    test("kind one throws when every variable is undefined or null", () => {
        expect(() =>
            requireVariables({ id: undefined, name: null }, { kind: "one" }, "needs one")
        ).toThrow(AniLinkValidationError);
    });

    test("kind one throws for an empty variables object", () => {
        expect(() => requireVariables({}, { kind: "one" }, "needs one")).toThrow("needs one");
    });

    test("kind all passes only when every listed variable is set", () => {
        expect(() =>
            requireVariables(
                { likeableId: 1, type: "ACTIVITY" },
                { kind: "all", names: ["likeableId", "type"] },
                "needs both"
            )
        ).not.toThrow();
        expect(() =>
            requireVariables(
                { likeableId: 1 },
                { kind: "all", names: ["likeableId", "type"] },
                "needs both"
            )
        ).toThrow(AniLinkValidationError);
    });

    test("kind any passes when one of the listed variables is set", () => {
        expect(() =>
            requireVariables(
                { activityId: 5 },
                { kind: "any", names: ["id", "activityId"] },
                "needs either"
            )
        ).not.toThrow();
        expect(() =>
            requireVariables(
                { asHtml: true },
                { kind: "any", names: ["id", "activityId"] },
                "needs either"
            )
        ).toThrow(AniLinkValidationError);
    });

    test("kind notOnly passes when a non-excluded variable is set", () => {
        expect(() =>
            requireVariables(
                { id: 1, asHtml: true },
                { kind: "notOnly", names: ["asHtml"] },
                "needs a filter"
            )
        ).not.toThrow();
        expect(() =>
            requireVariables({ id: 1 }, { kind: "notOnly", names: ["asHtml"] }, "needs a filter")
        ).not.toThrow();
    });
});
