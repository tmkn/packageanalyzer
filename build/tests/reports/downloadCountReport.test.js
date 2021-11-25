"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const DownloadCountReport_1 = require("../../src/reports/DownloadCountReport");
const formatter_1 = require("../../src/utils/formatter");
const common_1 = require("./../common");
const server_1 = require("./../server");
describe(`DownloadCountReport Tests`, () => {
    let server;
    beforeAll(async () => {
        server = await (0, server_1.createMockDownloadServer)();
    });
    afterAll(() => server.close());
    test(`works`, async () => {
        const downloadReport = new DownloadCountReport_1.DownloadReport({
            pkg: `_downloads`,
            url: `http://localhost:${server.port}/`
        });
        //@ts-expect-error
        const fakePgk = {
            name: `_downloads`
        };
        const stdout = new common_1.TestWritable();
        const stdoutFormatter = new formatter_1.Formatter(stdout);
        const stderr = new common_1.TestWritable();
        const stderrFormatter = new formatter_1.Formatter(stderr);
        await downloadReport.report(fakePgk, { stdoutFormatter, stderrFormatter });
        expect(stdout.lines).toMatchSnapshot();
    });
});
//# sourceMappingURL=downloadCountReport.test.js.map