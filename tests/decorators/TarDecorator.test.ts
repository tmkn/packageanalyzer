import * as fs from "fs";
import * as path from "path";

import * as nock from "nock";

import { IPackage } from "../../src/package/package";
import { ITarData, TarDecorator } from "../../src/extensions/decorators/TarDecorator";
import { createMockPackage, IMockPackageJson } from "../mocks";

describe(`TarDecorator Tests`, () => {
    const logStub = {
        logger: function () {}
    };

    beforeAll(() => {
        jest.useFakeTimers({
            legacyFakeTimers: true
        });
        nock.disableNetConnect();
    });

    it(`downloads tarball and extracts content`, async () => {
        const tgzPath = path.join("tests", "data", "js-tokens-4.0.0.tgz");
        const scope = nock("https://example.com")
            .get("/")
            .reply(200, (uri, requestBody) => {
                return fs.createReadStream(tgzPath);
            });

        const tarDecorator = new TarDecorator();
        const pkgJson: IMockPackageJson = {
            dist: {
                tarball: `https://example.com`,
                shasum: `1234`
            }
        };
        const p: IPackage = createMockPackage(pkgJson);

        const data = await tarDecorator.apply({ p, ...logStub });

        expect.assertions(1);
        expect(data.files.size).toBe(5);
    });

    it(`uses cache`, async () => {
        const cache: Map<string, ITarData> = new Map();
        const tarDecorator = new TarDecorator(cache);
        const p: IPackage = createMockPackage({});

        //init cache
        cache.set(p.fullName, {
            files: new Map([
                [`file1`, `content1`],
                [`file2`, `content2`]
            ])
        });

        const data = await tarDecorator.apply({ p, ...logStub });

        expect.assertions(1);
        expect(data.files.size).toBe(2);
    });

    it(`throws on missing tarball url`, async () => {
        const tarDecorator = new TarDecorator();
        const p: IPackage = createMockPackage({});

        await expect(tarDecorator.apply({ p, ...logStub })).rejects.toThrow();
    });

    afterAll(() => {
        nock.cleanAll();
        nock.enableNetConnect();
        jest.useFakeTimers({
            legacyFakeTimers: false
        });
    });
});
