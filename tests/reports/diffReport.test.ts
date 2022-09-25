import * as path from "path";

import { DumpPackageProvider } from "../../src/providers/folder";
import { DiffReport } from "../../src/reports/DiffReport";
import { ReportService } from "../../src/reports/ReportService";
import { createMockContext } from "../common";

describe(`DiffReport Tests`, () => {
    const folder = path.join("tests", "data", "dump");

    let provider: DumpPackageProvider;

    beforeAll(() => {
        provider = new DumpPackageProvider(folder);
    });
    test(`works`, async () => {
        const report = new DiffReport({
            from: `react`,
            to: `react`,
            type: `dependencies`
        });

        report.provider = provider;

        const { stdout, stderr } = createMockContext();
        const reportService = new ReportService(
            {
                reports: [report]
            },
            stdout,
            stderr
        );

        await reportService.process();

        expect(stdout.lines).toMatchSnapshot(`stdout`);
        expect(stderr.lines).toMatchSnapshot(`stderr`);
    });
});
