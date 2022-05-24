import * as path from "path";

import { PackageVersion } from "../../src";
import { FileSystemPackageProvider } from "../../src/providers/folder";
import { ReportService } from "../../src/reports/ReportService";
import { MultiReport } from "../../src/reports/MultiReport";
import { createMockContext } from "../common";

describe(`MultiReport Tests`, () => {
    const rootPath = path.join("tests", "data", "testproject1");
    const provider = new FileSystemPackageProvider(rootPath);

    test(`Correctly reports on 2 packages`, async () => {
        const { stdout, stderr } = createMockContext();

        const multiReport = new MultiReport<[PackageVersion, PackageVersion]>({
            entries: [[`react`], [`object-assign`]],
            callback: async (_ctx, pkg1, pkg2, pkg3) => {
                expect(pkg1.fullName).toEqual(`react@16.8.6`);
                expect(pkg2.fullName).toEqual(`object-assign@4.1.1`);
                expect(pkg3).toBeUndefined();
            }
        });
        multiReport.provider = provider;

        const reportService = new ReportService(
            {
                reports: [multiReport]
            },
            stdout,
            stderr
        );

        await reportService.process();
        expect.assertions(3);
    });
});
