import * as path from "path";

import { FileSystemPackageProvider } from "../../src/providers/folder.js";
import { ReportService } from "../../src/reports/ReportService.js";
import {
    createMockContext,
    type ITestReportNoValidationParams,
    TestReport,
    TestReportNoValidation
} from "../common.js";

describe(`ReportService Tests`, () => {
    const rootPath = path.join("tests", "data", "testproject1");
    const provider = new FileSystemPackageProvider(rootPath);

    test(`Executes report method`, async () => {
        const { stdout, stderr } = createMockContext();
        const cb = vi.fn();
        const testReport = new TestReport({
            pkg: [`react`],
            report: async () => {
                cb();
            }
        });
        testReport.provider = provider;
        const reportService = new ReportService(
            {
                reports: [testReport]
            },
            stdout,
            stderr
        );

        await reportService.process();
        expect(cb).toHaveBeenCalledTimes(1);
    });

    test(`Executes multiple reports`, async () => {
        const { stdout, stderr } = createMockContext();
        const cb = vi.fn();
        const testReport = new TestReport({
            pkg: [`react`],
            report: async () => {
                cb();
            }
        });
        testReport.provider = provider;
        const reportService = new ReportService(
            {
                reports: [testReport, testReport, testReport]
            },
            stdout,
            stderr
        );

        await reportService.process();
        expect(cb).toHaveBeenCalledTimes(3);
    });

    test(`Provides pkg argument`, async () => {
        const { stdout, stderr } = createMockContext();
        let fullName: string = `Unknown`;
        const testReport = new TestReport({
            pkg: [`react`],
            report: async ([pkg], _context) => {
                fullName = pkg.fullName;
            }
        });
        testReport.provider = provider;
        const reportService = new ReportService(
            {
                reports: [testReport]
            },
            stdout,
            stderr
        );

        await reportService.process();

        expect(fullName).toEqual(`react@16.8.6`);
    });

    test(`Provides formatter argument`, async () => {
        const { stdout, stderr } = createMockContext();
        const token = `Hello World`;
        const testReport = new TestReport({
            pkg: [`react`],
            report: async (_, context) => {
                context.stdoutFormatter.writeLine(token);
            }
        });
        testReport.provider = provider;
        const reportService = new ReportService(
            {
                reports: [testReport]
            },
            stdout,
            stderr
        );

        await reportService.process();

        expect(stdout.lines.find(line => line === token)).toBeDefined();
    });

    test(`Acknowledges depth setting`, async () => {
        const { stdout, stderr } = createMockContext();
        let directDependenciesCount1: number = -1;
        let directDependenciesCount2: number = -1;
        const testReport1 = new TestReport({
            pkg: [`react`],
            report: async ([pkg], _context) => {
                directDependenciesCount1 = pkg.directDependencies.length;
            }
        });
        testReport1.provider = provider;
        testReport1.configs.depth = 0;
        const testReport2 = new TestReport({
            pkg: [`react`],
            report: async ([pkg], _context) => {
                directDependenciesCount2 = pkg.directDependencies.length;
            }
        });
        testReport2.provider = provider;
        testReport2.configs.depth = Infinity;
        const reportService = new ReportService(
            {
                reports: [testReport1, testReport2]
            },
            stdout,
            stderr
        );

        await reportService.process();

        expect(directDependenciesCount1).toEqual(0);
        expect(directDependenciesCount2).toEqual(4);
    });

    test(`Writes to stderr on throw`, async () => {
        const { stdout, stderr } = createMockContext();
        const willThrow = new TestReport({
            pkg: [`react`],
            report: async () => {
                throw new Error(`Whoopsie`);
            }
        });
        willThrow.provider = provider;

        const reportService = new ReportService(
            {
                reports: [willThrow]
            },
            stdout,
            stderr
        );

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
