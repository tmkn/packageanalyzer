import { describe, test, expect, beforeAll, afterAll } from "vitest";

import { NodeWriter } from "../../src/host/NodeHost.js";
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
        const stdoutFormatter = new Formatter(new NodeWriter(stdout));
        const stderrFormatter = new Formatter(new NodeWriter(stderr));

        await downloadReport.report([fakePgk], { stdoutFormatter, stderrFormatter });

        expect(stdout.lines).toMatchSnapshot(`stdout`);
        expect(stderr.lines).toMatchSnapshot(`stderr`);
    });
});
