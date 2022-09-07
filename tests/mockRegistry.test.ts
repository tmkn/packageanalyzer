import * as path from "path";

import * as nock from "nock";

import { npmOnline } from "../src";
import { setupRegistryMocks } from "./common";

describe(`Mock Registry Tests`, () => {
    beforeAll(() => {
        jest.useFakeTimers("legacy");
        nock.disableNetConnect();

        const destination = path.join("tests", "data", "dump");
        setupRegistryMocks(destination);
    });

    it(`correctly resolves to latest version`, async () => {
        const data = await npmOnline.getPackageJson(`react`);

        expect(data.version).toBe(`18.2.0`);
    });

    it(`correctly resolves to specific version`, async () => {
        const data = await npmOnline.getPackageJson(`react`, `17.0.2`);

        expect(data.version).toBe(`17.0.2`);
    });

    it(`correctly returns metadata`, async () => {
        const data = await npmOnline.getPackageMetadata(`react`);

        expect(data?.time).toBeDefined();
    });

    afterAll(() => {
        nock.enableNetConnect();
        jest.useFakeTimers("modern");
    });
});
