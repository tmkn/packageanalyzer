import { describe, test, expect, beforeAll, afterAll } from "vitest";

import { getDownloadsLastWeek } from "../src/reports/DownloadCountReport.js";
import { createMockDownloadServer, type IMockServer } from "./server.js";

describe(`Download Tests`, () => {
    let server: IMockServer;

    beforeAll(async () => {
        server = await createMockDownloadServer();
    });

    afterAll(() => server.close());

    test(`Clean semantic version strings`, async () => {
        const stats = await getDownloadsLastWeek(`_downloads`, `http://localhost:${server.port}/`);

        expect(stats.downloads).toEqual(8609192);
    });
});
