import * as path from "path";
import { DumpPackageProvider } from "../../src/providers/folder";

import { LoopsReport } from "../../src/reports/LoopsReport";
import { ReportService } from "../../src/reports/ReportService";
import { createMockContext } from "../common";

describe(`LoopsReport Test`, () => {
    const rootPath = path.join("tests", "data", "loops_data");
    let provider: DumpPackageProvider;

    beforeAll(() => {
        provider = new DumpPackageProvider(rootPath);
    });

    test(`works`, async () => {
        const report = new LoopsReport({
            package: `@webassemblyjs/ast@1.9.0`,
            type: `dependencies`
        });

        report.provider = provider;

        const { stdout, stderr } = createMockContext();
        const reportService = new ReportService(
            {
                mode: "distinct",
                reports: [report]
            },
            stdout,
            stderr
        );

        await reportService.process();

        expect(stdout.lines).toMatchSnapshot(`stdout`);
        expect(stderr.lines).toMatchSnapshot(`stderr`);
    });

    test(`Throws on illegal dependency type`, async () => {
        expect.assertions(1);

        try {
            const report = new LoopsReport({
                package: `foo`,
                //@ts-expect-error type needs to be a valid dependency type
                type: `xxx`
            });
        } catch (e) {
            expect(e).toBeInstanceOf(Error);
        }
    });
});
