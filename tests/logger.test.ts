import { numPadding } from "../src/utils/logger";

describe(`Logger Tests`, () => {
    test(`Correctly prefixes 1/1`, () => {
        const msg = numPadding(0, 1);

        expect(msg).toMatch(`1/1`);
    });

    test(`Correctly prefixes 34/1457`, () => {
        const msg = numPadding(33, 1457);

        expect(msg).toMatch(`  34/1457`);
    });
});
