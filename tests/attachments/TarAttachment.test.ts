import { describe, test, expect, beforeAll, vi, afterAll } from "vitest";
import * as fs from "fs";
import * as path from "path";

import nock from "nock";

import { type IPackage } from "../../src/package/package.js";
import { createTarAttachment, type ITarData } from "../../src/attachments/TarAttachment.js";
import { createMockPackage, type IMockPackageJson } from "../mocks.js";

describe(`TarAttachment Tests`, () => {
    const logStub = {
        logger: function () {}
    };

    beforeAll(() => {
        vi.useFakeTimers();
        nock.disableNetConnect();
    });

    test(`downloads tarball and extracts content`, async () => {
        const tgzPath = path.join("tests", "data", "js-tokens-4.0.0.tgz");
        const scope = nock("https://example.com")
            .get("/")
            .reply(200, (uri, requestBody) => {
                return fs.createReadStream(tgzPath);
            });

        const tarAttachment = createTarAttachment();
        const pkgJson: IMockPackageJson = {
            dist: {
                tarball: `https://example.com`,
                shasum: `1234`
            }
        };
        const p: IPackage = createMockPackage(pkgJson);

        const data = await tarAttachment({ p, ...logStub });

        expect.assertions(1);
        expect(data.files.size).toBe(5);
    });

    test(`uses cache`, async () => {
        const cache: Map<string, ITarData> = new Map();
        const tarAttachment = createTarAttachment(cache);
        const p: IPackage = createMockPackage({});

        //init cache
        cache.set(p.fullName, {
            files: new Map([
                [`file1`, `content1`],
                [`file2`, `content2`]
            ])
        });

        const data = await tarAttachment({ p, ...logStub });

        expect.assertions(1);
        expect(data.files.size).toBe(2);
    });

    test(`throws on missing tarball url`, async () => {
        const tarAttachment = createTarAttachment();
        const p: IPackage = createMockPackage({});

        await expect(tarAttachment({ p, ...logStub })).rejects.toThrow();
    });

    afterAll(() => {
        nock.cleanAll();
        nock.enableNetConnect();
        vi.useFakeTimers();
    });
});
