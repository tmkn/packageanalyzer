import * as path from "path";

import { Extractor } from "../src/extractor";

describe(`Extractor Tests`, () => {
    const destination = path.join("tests", "data", "extractor");
    const file = path.join(destination, `data.json`);

    test(`Extracting Packages`, async () => {
        const inputFile = path.join(destination, `input.json`);
        expect.assertions(7);

        try {
            const extractor = new Extractor(inputFile, file);
            const [metarpheus, metaroute, metarhia] = await extractor.extract();

            expect(metarpheus.name).toEqual("metarpheus");
            expect(metarpheus.directDependencyCount).toEqual(0);

            expect(metaroute.name).toEqual("metaroute");
            expect(metaroute.directDependencyCount).toEqual(0);

            expect(metarhia.name).toEqual("metarhia-jstp");
            expect(metarhia.directDependencyCount).toEqual(0);
            expect(metarhia.version).toBe("0.1.4");
        } catch (e) {
            console.log(e);
        }
    });

    test(`Wrong Input File`, async () => {
        const wrongInputFile = path.join(destination, `wrong_input.json`);
        expect.assertions(1);

        try {
            const extractor = new Extractor(wrongInputFile, file);
        } catch (e) {
            expect(e).toBeInstanceOf(Error);
            console.log(e);
        }
    });
});
