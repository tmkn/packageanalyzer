"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const folder_1 = require("../../src/providers/folder");
const ReportService_1 = require("../../src/reports/ReportService");
const common_1 = require("../common");
describe(`ReportService Tests`, () => {
    const rootPath = path.join("tests", "data", "testproject1");
    const provider = new folder_1.FileSystemPackageProvider(rootPath);
    test(`Executes report method`, async () => {
        const stdout = new common_1.TestWritable();
        const stderr = new common_1.TestWritable();
        const cb = jest.fn();
        const testReport = new common_1.TestReport({
            pkg: [`react`],
            report: async () => {
                cb();
            },
            provider: provider
        });
        const reportService = new ReportService_1.ReportService({
            reports: [testReport]
        }, stdout, stderr);
        await reportService.process();
        expect(cb).toHaveBeenCalledTimes(1);
    });
    test(`Executes multiple reports`, async () => {
        const stdout = new common_1.TestWritable();
        const stderr = new common_1.TestWritable();
        const cb = jest.fn();
        const testReport = new common_1.TestReport({
            pkg: [`react`],
            report: async () => {
                cb();
            },
            provider: provider
        });
        const reportService = new ReportService_1.ReportService({
            reports: [testReport, testReport, testReport]
        }, stdout, stderr);
        await reportService.process();
        expect(cb).toHaveBeenCalledTimes(3);
    });
    test(`Provides pkg argument`, async () => {
        const stdout = new common_1.TestWritable();
        const stderr = new common_1.TestWritable();
        let fullName = `Unknown`;
        const testReport = new common_1.TestReport({
            pkg: [`react`],
            report: async (pkg) => {
                fullName = pkg.fullName;
            },
            provider: provider
        });
        const reportService = new ReportService_1.ReportService({
            reports: [testReport]
        }, stdout, stderr);
        await reportService.process();
        expect(fullName).toEqual(`react@16.8.6`);
    });
    test(`Provides formatter argument`, async () => {
        const stdout = new common_1.TestWritable();
        const stderr = new common_1.TestWritable();
        const token = `Hello World`;
        const testReport = new common_1.TestReport({
            pkg: [`react`],
            report: async (pkg, formatter) => {
                formatter.writeLine(token);
            },
            provider: provider
        });
        const reportService = new ReportService_1.ReportService({
            reports: [testReport]
        }, stdout, stderr);
        await reportService.process();
        expect(stdout.lines.find(line => line === token)).toBeDefined();
    });
    test(`Acknowledges depth setting`, async () => {
        const stdout = new common_1.TestWritable();
        const stderr = new common_1.TestWritable();
        let directDependenciesCount1 = -1;
        let directDependenciesCount2 = -1;
        const testReport1 = new common_1.TestReport({
            pkg: [`react`],
            report: async (pkg) => {
                directDependenciesCount1 = pkg.directDependencies.length;
            },
            provider: provider,
            depth: 0
        });
        const testReport2 = new common_1.TestReport({
            pkg: [`react`],
            report: async (pkg) => {
                directDependenciesCount2 = pkg.directDependencies.length;
            },
            provider: provider,
            depth: Infinity
        });
        const reportService = new ReportService_1.ReportService({
            reports: [testReport1, testReport2]
        }, stdout, stderr);
        await reportService.process();
        expect(directDependenciesCount1).toEqual(0);
        expect(directDependenciesCount2).toEqual(4);
    });
    test(`Writes to stderr on throw`, async () => {
        const stdout = new common_1.TestWritable();
        const stderr = new common_1.TestWritable();
        const willThrow = new common_1.TestReport({
            pkg: [`react`],
            report: async () => {
                throw new Error(`Whoopsie`);
            }
        });
        const reportService = new ReportService_1.ReportService({
            reports: [willThrow]
        }, stdout, stderr);
        await reportService.process();
        expect(stderr.lines).toMatchSnapshot();
    });
});
//# sourceMappingURL=reports.test.js.map