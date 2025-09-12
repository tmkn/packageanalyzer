import { describe, test, expect } from "vitest";

import { createMockPackage } from "../mocks.js";
import { ValidateKey } from "../../src/reports/lint/checks/ValidateKey.js";

describe("validateKeys", () => {
    describe(`string parameter`, () => {
        test(`correctly reports missing description key`, async () => {
            const pkg = createMockPackage({});
            const rule = new ValidateKey();
            const result = rule.check(pkg, "description");

            expect(result).toMatch(`missing key: "description" in package.json`);
        });

        test(`correctly dimisses existing description key`, async () => {
            const pkg = createMockPackage({
                description: `test`
            });
            const rule = new ValidateKey();
            const result = rule.check(pkg, "description");

            expect(result).toBe(undefined);
        });
    });

    describe(`custom validator parameter`, () => {
        test(`correctly returns undefined when custom validator passes`, async () => {
            const pkg = createMockPackage({
                description: `hello world`
            });
            const rule = new ValidateKey();
            const result = rule.check(pkg, {
                key: "description",
                validator: data => data === `hello world`
            });

            expect(result).toBe(undefined);
        });

        test(`correctly returns error message when custom validator fails`, async () => {
            const pkg = createMockPackage({
                description: `hello world`
            });
            const rule = new ValidateKey();
            const result = rule.check(pkg, {
                key: "description",
                validator: _ => false
            });

            expect(result).toBe(`invalid value for key: "description"`);
        });

        test(`correctly uses custom error message when custom validator fails`, async () => {
            const pkg = createMockPackage({
                description: `hello world`
            });
            const rule = new ValidateKey();
            const result = rule.check(pkg, {
                key: "description",
                validator: _ => false,
                message: `custom error message`
            });

            expect(result).toMatch("custom error message");
        });
    });

    test(`correctly throws on invalid params`, async () => {
        const pkg = createMockPackage({});
        const rule = new ValidateKey();

        // @ts-expect-error invalid params
        expect(() => void rule.check(pkg, 123)).toThrow();
    });

    test(`has custom validation`, () => {
        const rule = new ValidateKey();
        const schema = rule.checkParams();
        const valid = schema.safeParse({
            key: "description",
            validator: () => true
        });

        expect(valid.success).toBe(true);
    });
});
