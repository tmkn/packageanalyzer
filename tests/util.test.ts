import { urlType } from "../src/reports/Validation.js";
import { numPadding } from "../src/visitors/visitor.js";

describe(`Num Padding Tests`, () => {
    test(`Correctly prefixes 1/1`, () => {
        const msg = numPadding(0, 1);

        expect(msg).toMatch(`1/1`);
    });

    test(`Correctly prefixes 34/1457`, () => {
        const msg = numPadding(33, 1457);

        expect(msg).toMatch(`  34/1457`);
    });
});

describe(`urlType Tests`, () => {
    test(`Correctly parses http url`, () => {
        const { success } = urlType.safeParse(`http://foo.com`);

        expect(success).toBeTruthy();
    });

    test(`Correctly parses https url`, () => {
        const { success } = urlType.safeParse(`https://foo.com`);

        expect(success).toBeTruthy();
    });

    test(`Fails to parse`, () => {
        const { success } = urlType.safeParse({});

        expect(success).toBeFalsy();
    });
});
