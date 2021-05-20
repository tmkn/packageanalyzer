import { getDownloadsLastWeek } from "../src/npm";
import { DownloadReport } from "../src/reports/DownloadCountReport";
import { Formatter } from "../src/utils/formatter";
import { TestWritable } from "./common";
import { createServer, MockNpmServer } from "./server";

describe(`Download Tests`, () => {
    let server: MockNpmServer;

    beforeAll(async () => {
        server = await createServer();
    });

    afterAll(() => server.close());

    test(`Clean semantic version strings`, async () => {
        const stats = await getDownloadsLastWeek(`_downloads`, `http://localhost:${server.port}/`);

        expect(stats.downloads).toEqual(8609192);
    });
});

describe(`DownloadCountReport Tests`, () => {
    let server: MockNpmServer;

    beforeAll(async () => {
        server = await createServer();
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
