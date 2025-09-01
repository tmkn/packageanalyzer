import * as path from "path";

import { FileSystemPackageProvider } from "../../src/providers/folder.js";
import {
    createReportServiceFactory,
    type ITestReportNoValidationParams,
    TestReport,
    TestReportNoValidation
} from "../common.js";

describe(`ReportService Tests`, () => {
    const rootPath = path.join("tests", "data", "testproject1");
    const provider = new FileSystemPackageProvider(rootPath);

    const buildTestReport = createReportServiceFactory(TestReport, provider);

    test(`Executes report method`, async () => {
        const cb = vi.fn();
        const { reportService } = buildTestReport({
            pkg: [`react`],
            report: async () => {
                cb();
            }
        });

        await reportService.process();
        expect(cb).toHaveBeenCalledTimes(1);
    });

    test(`Executes multiple reports`, async () => {
        const cb = vi.fn();
        const params: ConstructorParameters<typeof TestReport> = [
            {
                pkg: [`react`],
                report: async () => {
                    cb();
                }
            }
        ];
        const { reportService } = buildTestReport(params, params, params);

        await reportService.process();
        expect(cb).toHaveBeenCalledTimes(3);
    });

    test(`Provides pkg argument`, async () => {
        let fullName: string = `Unknown`;
        const { reportService } = buildTestReport({
            pkg: [`react`],
            report: async ([pkg], _context) => {
                fullName = pkg.fullName;
            }
        });

        await reportService.process();

        expect(fullName).toEqual(`react@16.8.6`);
    });

    test(`Provides formatter argument`, async () => {
        const token = `Hello World`;
        const { reportService, stdout } = buildTestReport({
            pkg: [`react`],
            report: async (_, context) => {
                context.stdoutFormatter.writeLine(token);
            }
        });

        await reportService.process();

        expect(stdout.lines.find(line => line === token)).toBeDefined();
    });

    test(`Acknowledges depth setting`, async () => {
        let directDependenciesCount1: number = -1;
        let directDependenciesCount2: number = -1;

        const {
            reportService,
            reports: [report1, report2]
        } = buildTestReport(
            [
                {
                    pkg: [`react`],
                    report: async ([pkg], _context) => {
                        directDependenciesCount1 = pkg.directDependencies.length;
                    }
                }
            ],
            [
                {
                    pkg: [`react`],
                    report: async ([pkg], _context) => {
                        directDependenciesCount2 = pkg.directDependencies.length;
                    }
                }
            ]
        );

        report1.configs.depth = 0;
        report2.configs.depth = Infinity;

        await reportService.process();

        expect(directDependenciesCount1).toEqual(0);
        expect(directDependenciesCount2).toEqual(4);
    });

    test(`Writes to stderr on throw`, async () => {
        const { reportService, stdout, stderr } = buildTestReport({
            pkg: [`react`],
            report: async () => {
                throw new Error(`Whoopsie`);
            }
        });

        await reportService.process();

        expect(stdout.lines).toMatchSnapshot(`stdout`);
        expect(stderr.lines).toMatchSnapshot(`stderr`);
    });

    test(`Assigns data on missing validate method`, async () => {
        const params: ITestReportNoValidationParams = {
            foo: `blabla`
        };
        const report = new TestReportNoValidation(params);

        expect(JSON.stringify(params, null, 4)).toMatch(JSON.stringify(report.params, null, 4));
    });
});
