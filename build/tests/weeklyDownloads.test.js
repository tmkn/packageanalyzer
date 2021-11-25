"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const DownloadCountReport_1 = require("../src/reports/DownloadCountReport");
const server_1 = require("./server");
describe(`Download Tests`, () => {
    let server;
    beforeAll(async () => {
        server = await (0, server_1.createMockDownloadServer)();
    });
    afterAll(() => server.close());
    test(`Clean semantic version strings`, async () => {
        const stats = await (0, DownloadCountReport_1.getDownloadsLastWeek)(`_downloads`, `http://localhost:${server.port}/`);
        expect(stats.downloads).toEqual(8609192);
    });
});
//# sourceMappingURL=weeklyDownloads.test.js.map