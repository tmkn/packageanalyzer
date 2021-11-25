"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const extractor_1 = require("../src/utils/extractor");
describe(`Extractor Tests`, () => {
    const destination = path.join("tests", "data", "extractor");
    const file = path.join(destination, `data.json`);
    test(`Extracting Packages`, async () => {
        const inputFile = path.join(destination, `input.json`);
        expect.assertions(7);
        try {
            const extractor = new extractor_1.Extractor(inputFile, file);
            const [metarpheus, metaroute, metarhia] = (await extractor.extract()).values();
            expect(metarpheus.name).toEqual("metarpheus");
            expect(metarpheus.directDependencies.length).toEqual(0);
            expect(metaroute.name).toEqual("metaroute");
            expect(metaroute.directDependencies.length).toEqual(0);
            expect(metarhia.name).toEqual("metarhia-jstp");
            expect(metarhia.directDependencies.length).toEqual(0);
            expect(metarhia.version).toBe("0.1.4");
        }
        catch (e) {
            console.log(e);
        }
    });
    test(`Wrong Input File`, async () => {
        const wrongInputFile = path.join(destination, `wrong_input.json`);
        expect.assertions(1);
        try {
            new extractor_1.Extractor(wrongInputFile, file);
        }
        catch (e) {
            expect(e).toBeInstanceOf(Error);
        }
    });
    test(`Get dir from package`, () => {
        const input = `typescript`;
        const inputResult = "";
        const result = extractor_1.Extractor.PackageNameToDir(input);
        expect(result).toEqual(inputResult);
    });
    test(`Get dir from package with version`, () => {
        const input = `typescript@1.2.3`;
        const inputResult = "";
        const result = extractor_1.Extractor.PackageNameToDir(input);
        expect(result).toEqual(inputResult);
    });
    test(`Get dir from local package`, () => {
        const input = `@tmkn/packageanalyzer`;
        const inputResult = "@tmkn";
        const result = extractor_1.Extractor.PackageNameToDir(input);
        expect(result).toEqual(inputResult);
    });
    test(`Get dir from local package with version`, () => {
        const input = `@tmkn/packageanalyzer@1.2.3`;
        const inputResult = "@tmkn";
        const result = extractor_1.Extractor.PackageNameToDir(input);
        expect(result).toEqual(inputResult);
    });
});
//# sourceMappingURL=extractor.test.js.map