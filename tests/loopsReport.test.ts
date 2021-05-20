import * as path from "path";

import { LoopsReport } from "../src/reports/LoopsReport";
import { ReportService } from "../src/reports/ReportService";
import { DependencyDumperProvider } from "../src/utils/dumper";
import { TestWritable } from "./common";

describe(`LoopsReport Test`, () => {
    const rootPath = path.join("tests", "data", "loopsdata");
    let provider: DependencyDumperProvider;

    beforeAll(() => {
        provider = new DependencyDumperProvider(rootPath);
    });

    test(`works`, async () => {
        const report = new LoopsReport({
            package: `@webassemblyjs/ast@1.9.0`,
            type: `dependencies`
        });

        //@ts-expect-error
        report.provider = provider;

        const writer = new TestWritable();
        const reportService = new ReportService(
            {
                reports: [report]
            },
            writer
        );

        await reportService.process();

        expect(writer.lines.length).toBeGreaterThan(0);
    });

    test(`Throws on illegal dependency type`, async () => {
        expect.assertions(1);

        try {
            const report = new LoopsReport({
                package: `foo`,
                //@ts-expect-error
                type: `xxx`
            });

            //@ts-expect-error
            await report.report();
        } catch (e) {
            expect(e).toBeInstanceOf(Error);
        }
    });
});
