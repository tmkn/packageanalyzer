import { createMockPackage } from "../mocks";
import { MaintainerCheck } from "../../src/reports/lint/checks/MaintainerCheck";

describe(`maintainerCheck`, () => {
    test(`correctly reports maintainers`, () => {
        const pkg = createMockPackage({
            maintainers: [
                {
                    name: `authorname`
                }
            ]
        });
        const rule = new MaintainerCheck();
        const [result, ...rest] = rule.check(pkg, {
            authors: [`authorname`]
        });

        expect(result).toMatch(`found authorname in "maintainers"`);
        expect(rest).toHaveLength(0);
    });

    test(`correctly reports author from user field`, () => {
        const pkg = createMockPackage({
            author: {
                name: `authorname`
            }
        });
        const rule = new MaintainerCheck();
        const [result, ...rest] = rule.check(pkg, {
            authors: [`authorname`]
        });

        expect(result).toMatch(`found authorname in "author"`);
        expect(rest).toHaveLength(0);
    });

    test(`correctly reports author from contributors field`, () => {
        const pkg = createMockPackage({
            contributors: [`authorname`]
        });
        const rule = new MaintainerCheck();
        const [result, ...rest] = rule.check(pkg, {
            authors: [`authorname`]
        });

        expect(result).toMatch(`found authorname in "contributors"`);
        expect(rest).toHaveLength(0);
    });

    test(`has custom validation`, () => {
        const rule = new MaintainerCheck();
        const schema = rule.checkParams();
        const valid = schema.safeParse({
            authors: [`authorname`]
        });

        expect(valid.success).toBe(true);
    });
});
