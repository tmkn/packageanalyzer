"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const LoopsReport_1 = require("../../src/reports/LoopsReport");
const ReportService_1 = require("../../src/reports/ReportService");
const dumper_1 = require("../../src/utils/dumper");
const common_1 = require("../common");
describe(`LoopsReport Test`, () => {
    const rootPath = path.join("tests", "data", "loopsdata");
    let provider;
    beforeAll(() => {
        provider = new dumper_1.DependencyDumperProvider(rootPath);
    });
    test(`works`, async () => {
        const report = new LoopsReport_1.LoopsReport({
            package: `@webassemblyjs/ast@1.9.0`,
            type: `dependencies`
        });
        report.provider = provider;
        const stdout = new common_1.TestWritable();
        const stderr = new common_1.TestWritable();
        const reportService = new ReportService_1.ReportService({
            reports: [report]
        }, stdout, stderr);
        await reportService.process();
        expect(stdout.lines).toMatchSnapshot();
    });
    test(`Throws on illegal dependency type`, async () => {
        expect.assertions(1);
        try {
            const report = new LoopsReport_1.LoopsReport({
                package: `foo`,
                //@ts-expect-error
                type: `xxx`
            });
            //@ts-expect-error
            await report.report(null, {});
        }
        catch (e) {
            expect(e).toBeInstanceOf(Error);
        }
    });
});
//# sourceMappingURL=loopsReport.test.js.map