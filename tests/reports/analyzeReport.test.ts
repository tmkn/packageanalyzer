import { AnalyzeReport } from "../../src/reports/AnalyzeReport";
import { ReportService } from "../../src/reports/ReportService";
import { createMockContext } from "../common";
import { IMockPackageJson, MockProvider } from "../mocks";

describe(`Analyze Report`, () => {
    //todo create ReleaseDecoratorMock

    //todo finalize mock dependency tree
    const fromBaseData: IMockPackageJson = {
        name: `medallo`,
        version: `1.0.0`
    };

    test.todo(`Analyzes a package`, async () => {
        const fromPkg: IMockPackageJson = {
            ...fromBaseData,
            ...{
                dependencies: [
                    { name: `unchanged1`, version: `1.0.0` },
                    { name: `unchanged2`, version: `1.0.0` }
                ]
            }
        };

        const provider = new MockProvider([fromPkg]);
        const report = new AnalyzeReport({
            package: "medallo@1.0.0",
            type: `dependencies`,
            full: false
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
    test.todo(`Analyzes a package with the --full flag`);
});
