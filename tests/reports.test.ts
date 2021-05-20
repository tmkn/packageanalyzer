import * as path from "path";

import { FileSystemPackageProvider } from "../src/providers/folder";
import { ReportService } from "../src/reports/ReportService";
import { TestReport, TestWritable } from "./common";

describe(`ReportService Tests`, () => {
    const rootPath = path.join("tests", "data", "testproject1");
    const provider = new FileSystemPackageProvider(rootPath);

    test(`Executes report method`, async () => {
        const writer = new TestWritable();
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
            writer
        );

        await reportService.process();
        expect(cb).toHaveBeenCalledTimes(1);
    });

    test(`Executes multiple reports`, async () => {
        const writer = new TestWritable();
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
            writer
        );

        await reportService.process();
        expect(cb).toHaveBeenCalledTimes(3);
    });

    test(`Provides pkg argument`, async () => {
        const writer = new TestWritable();
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
            writer
        );

        await reportService.process();

        expect(fullName).toEqual(`react@16.8.6`);
    });

    test(`Provides formatter argument`, async () => {
        const writer = new TestWritable();
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
            writer
        );

        await reportService.process();

        expect(writer.lines.find(line => line === token)).toBeDefined();
    });

    test(`Acknowledges depth setting`, async () => {
        const writer = new TestWritable();
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
            writer
        );

        await reportService.process();

        expect(directDependenciesCount1).toEqual(0);
        expect(directDependenciesCount2).toEqual(4);
    });
});
