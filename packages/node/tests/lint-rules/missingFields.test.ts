import { describe, test, expect } from "vitest";

import { MissingFields } from "../../src/reports/lint/checks/MissingFields.js";
import { createMockPackage } from "../../../test-utils/src/mocks.js";

describe("missingFields", () => {
    test("has custom validation", () => {
        const rule = new MissingFields();
        const schema = rule.checkParams();
        const valid = schema.safeParse({
            fields: ["foo"]
        });

        expect(valid.success).toBe(true);
    });

    describe("string fields", () => {
        test("ignores missing string field foo when it exists", () => {
            const pkg = createMockPackage({
                foo: "bar"
            });

            const rule = new MissingFields();

            const result = rule.check(pkg, {
                fields: ["foo"]
            });

            expect(result).toHaveLength(0);
        });

        test("reports missing string field foo", () => {
            const pkg = createMockPackage({});

            const rule = new MissingFields();

            const [result, ...rest] = rule.check(pkg, {
                fields: ["foo"]
            });

            expect(result).toMatch(`missing field: foo`);
            expect(rest).toHaveLength(0);
        });
    });

    describe("custom validation", () => {
        test("reports invalid field foo", () => {
            const pkg = createMockPackage({
                foo: "bar"
            });

            const rule = new MissingFields();

            const [result, ...rest] = rule.check(pkg, {
                fields: [
                    {
                        path: "foo",
                        validator: (value: unknown) => typeof value === "number"
                    }
                ]
            });

            expect(result).toMatch(`invalid field: foo`);
            expect(rest).toHaveLength(0);
        });

        test("ignores valid field foo", () => {
            const pkg = createMockPackage({
                foo: 42
            });

            const rule = new MissingFields();

            const result = rule.check(pkg, {
                fields: [
                    {
                        path: "foo",
                        validator: (value: unknown) => typeof value === "number"
                    }
                ]
            });

            expect(result).toHaveLength(0);
        });
    });
});
