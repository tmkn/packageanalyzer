import { IPackage } from "../../src/package/package";
import { DownloadReport } from "../../src/reports/DownloadCountReport";
import { Formatter } from "../../src/utils/formatter";
import { createMockPackage } from "../mocks";
import { createMockContext } from "./../common";
import { createMockDownloadServer, IMockServer } from "./../server";

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
