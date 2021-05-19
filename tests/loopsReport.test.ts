import * as path from "path";
import { FileSystemPackageProvider } from "../src/providers/folder";
import { LoopsReport } from "../src/reports/LoopsReport";
import { ReportService } from "../src/reports/ReportService";
import { TestWritable } from "./common";

describe(`LoopsReport Test`, () => {
    const rootPath = path.join("tests", "data", "loopsdata");
    let provider: FileSystemPackageProvider;

    beforeAll(() => {
        provider = new FileSystemPackageProvider(rootPath);
    });

    test(`blabla`, async () => {
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

        console.dir(provider.size, writer.lines);
        //expect(writer.lines.length).toBeGreaterThan(0);
    });
});
