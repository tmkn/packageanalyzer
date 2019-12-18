import * as path from "path";

import { Extractor } from "../src/extractor";

//todo better coverage
describe(`Extractor Tests`, () => {
    const destination = path.join("tests", "data", "extractor");
    const file = path.join(destination, `data.json`);
    const inputFile = path.join(destination, `input.json`);

    test(`Extracting Packages`, async () => {
        expect.assertions(4);

        try {
            const extractor = new Extractor(inputFile, file);
            const [metarpheus, metaroute] = await extractor.extract();

            expect(metarpheus.name).toEqual("metarpheus");
            expect(metarpheus.directDependencyCount).toEqual(0);

            expect(metaroute.name).toEqual("metaroute");
            expect(metaroute.directDependencyCount).toEqual(0);
        } catch (e) {
            console.log(e);
        }
    });
});
