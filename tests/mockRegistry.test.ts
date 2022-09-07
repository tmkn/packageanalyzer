import * as path from "path";

import * as nock from "nock";

import { npmOnline } from "../src";
import { setupRegistryMocks } from "./common";

describe(`Mock Registry Tests`, () => {
    beforeAll(() => {
        jest.useFakeTimers("legacy");
        nock.disableNetConnect();

        const destination = path.join("tests", "data", "multiple");
        setupRegistryMocks(destination);
    });

    it(`correctly resolves to latest version`, async () => {
        const data = await npmOnline.getPackageJson(`typescript`);

        expect(data.version).toBe(`4.8.2`);
    });

    it(`correctly resolves to specific version`, async () => {
        const data = await npmOnline.getPackageJson(`typescript`, `3.5.2`);

        expect(data.version).toBe(`3.5.2`);
    });

    it(`correctly returns metadata`, async () => {
        const data = await npmOnline.getPackageMetadata(`typescript`);

        expect(data?.time).toBeDefined();
    });

    afterAll(() => {
        nock.enableNetConnect();
        jest.useFakeTimers("modern");
    });
});
