import * as path from "path";

import { PackageVersion } from "../src";
import { Package } from "../src/package/package";
import { FileSystemPackageProvider } from "../src/providers/folder";
import { IReport } from "../src/reports/Report";
import { ReportService } from "../src/reports/ReportService";
import { IFormatter } from "../src/utils/formatter";
import { TestWritable } from "./common";

describe(`Report Tests`, () => {
    test.todo(`Test Report`);
});

describe(`ReportService Tests`, () => {
    const rootPath = path.join("tests", "data", "testproject1");
    const provider = new FileSystemPackageProvider(rootPath);

    test(`Formatter works`, async () => {
        const writer = new TestWritable();
        const testReport: IReport<{}> = new (class {
            name = `Test Report`;
            pkg: PackageVersion = [`react`];
            params = {};
            provider = provider;

            async report(pkg: Package, formatter: IFormatter): Promise<void> {
                formatter.writeLine(`Hello`);
                formatter.writeLine(`World`);
            }
        })();
        const reportService = new ReportService(
            {
                reports: [testReport]
            },
            writer
        );

        await reportService.process();
        console.dir(writer.lines);
        expect(writer.lines.length).toEqual(3);
    });
});
