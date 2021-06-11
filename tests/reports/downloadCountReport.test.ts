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
            pkg: `_downloads`,
            url: `http://localhost:${server.port}/`
        });
        const fakePgk = {
            name: `_downloads`
        };
        const writer = new TestWritable();
        const formatter = new Formatter(writer);

        //@ts-expect-error
        await downloadReport.report(fakePgk, formatter);

        const match = writer.lines.find(line => line.includes(`8609192`));

        expect(match).not.toBeUndefined();
    });
});
