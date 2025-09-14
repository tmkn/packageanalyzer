import { describe, test, expect, beforeAll, vi, afterAll } from "vitest";
import * as path from "path";

import nock from "nock";

import { npmOnline } from "../src/index.js";
import { setupRegistryMocks } from "../../test-utils/src/common.js";

describe(`Mock Registry Tests`, () => {
    beforeAll(() => {
        vi.useFakeTimers();
        nock.disableNetConnect();

        const destination = path.join("packages", "node", "tests", "data", "dump");
        setupRegistryMocks(destination);
    });

    test(`correctly resolves to latest version`, async () => {
        const data = await npmOnline.getPackageJson(`react`);

        expect(data.version).toBe(`18.2.0`);
    });

    test(`correctly resolves to specific version`, async () => {
        const data = await npmOnline.getPackageJson(`react`, `17.0.2`);

        expect(data.version).toBe(`17.0.2`);
    });

    test(`correctly returns metadata`, async () => {
        const data = await npmOnline.getPackageMetadata(`react`);

        expect(data?.time).toBeDefined();
    });

    afterAll(() => {
        nock.enableNetConnect();
        vi.useFakeTimers();
    });
});
