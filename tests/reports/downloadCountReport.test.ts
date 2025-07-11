import { type IPackage } from "../../src/package/package.js";
import { DownloadReport } from "../../src/reports/DownloadCountReport.js";
import { Formatter } from "../../src/utils/formatter.js";
import { createMockPackage } from "../mocks.js";
import { createMockContext } from "./../common.js";
import { createMockDownloadServer, type IMockServer } from "./../server.js";

describe(`DownloadCountReport Tests`, () => {
    let server: IMockServer;

    beforeAll(async () => {
        server = await createMockDownloadServer();
    });

    afterAll(() => server.close());

    test(`works`, async () => {
        const downloadReport = new DownloadReport({
            package: `_downloads`,
            url: `http://localhost:${server.port}/`
        });

        const fakePgk = createMockPackage({
            name: `_downloads`
        });
        const { stdout, stderr } = createMockContext();
        const stdoutFormatter = new Formatter(stdout);
        const stderrFormatter = new Formatter(stderr);

        await downloadReport.report({ stdoutFormatter, stderrFormatter }, fakePgk);

        expect(stdout.lines).toMatchSnapshot(`stdout`);
        expect(stderr.lines).toMatchSnapshot(`stderr`);
    });
});
