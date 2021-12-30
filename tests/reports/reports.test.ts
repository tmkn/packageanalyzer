import * as path from "path";

import { FileSystemPackageProvider } from "../../src/providers/folder";
import { ReportService } from "../../src/reports/ReportService";
import { TestReport, TestWritable } from "../common";

describe(`ReportService Tests`, () => {
    const rootPath = path.join("tests", "data", "testproject1");
    const provider = new FileSystemPackageProvider(rootPath);

    test(`Executes report method`, async () => {
        const stdout = new TestWritable();
        const stderr = new TestWritable();
        const cb = jest.fn();
        const testReport = new TestReport({
            pkg: [`react`],
            report: async () => {
                cb();
            },
            provider: provider
        });
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
        const stdout = new TestWritable();
        const stderr = new TestWritable();
        const cb = jest.fn();
        const testReport = new TestReport({
            pkg: [`react`],
            report: async () => {
                cb();
            },
            provider: provider
        });
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
        const stdout = new TestWritable();
        const stderr = new TestWritable();
        let fullName: string = `Unknown`;
        const testReport = new TestReport({
            pkg: [`react`],
            report: async pkg => {
                fullName = pkg.fullName;
            },
            provider: provider
        });
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
        const stdout = new TestWritable();
        const stderr = new TestWritable();
        const token = `Hello World`;
        const testReport = new TestReport({
            pkg: [`react`],
            report: async (pkg, formatter) => {
                formatter.writeLine(token);
            },
            provider: provider
        });
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
        const stdout = new TestWritable();
        const stderr = new TestWritable();
        let directDependenciesCount1: number = -1;
        let directDependenciesCount2: number = -1;
        const testReport1 = new TestReport({
            pkg: [`react`],
            report: async pkg => {
                directDependenciesCount1 = pkg.directDependencies.length;
            },
            provider: provider,
            depth: 0
        });
        const testReport2 = new TestReport({
            pkg: [`react`],
            report: async pkg => {
                directDependenciesCount2 = pkg.directDependencies.length;
            },
            provider: provider,
            depth: Infinity
        });
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
        const stdout = new TestWritable();
        const stderr = new TestWritable();
        const willThrow = new TestReport({
            pkg: [`react`],
            report: async () => {
                throw new Error(`Whoopsie`);
            },
            provider: provider
        });

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
});
