import { Package } from "../../src/package/package";
import { DownloadReport } from "../../src/reports/DownloadCountReport";
import { Formatter } from "../../src/utils/formatter";
import { TestWritable } from "./../common";
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

        //@ts-expect-error
        const fakePgk: Package = {
            name: `_downloads`
        };
        const stdout = new TestWritable();
        const stdoutFormatter = new Formatter(stdout);
        const stderr = new TestWritable();
        const stderrFormatter = new Formatter(stderr);

        await downloadReport.report(fakePgk, { stdoutFormatter, stderrFormatter });

        expect(stdout.lines).toMatchSnapshot(`stdout`);
        expect(stderr.lines).toMatchSnapshot(`stderr`);
    });
});
