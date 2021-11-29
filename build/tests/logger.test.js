"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Ilogger_1 = require("../src/utils/Ilogger");
describe(`Logger Tests`, () => {
    test(`Correctly prefixes 1/1`, () => {
        const msg = (0, Ilogger_1.numPadding)(0, 1);
        expect(msg).toMatch(`1/1`);
    });
    test(`Correctly prefixes 34/1457`, () => {
        const msg = (0, Ilogger_1.numPadding)(33, 1457);
        expect(msg).toMatch(`  34/1457`);
    });
});
//# sourceMappingURL=logger.test.js.map