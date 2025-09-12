import { describe, test, expect, beforeAll } from "vitest";
import * as path from "path";

import { DumpPackageProvider } from "../../src/providers/folder.js";
import { LoopsReport } from "../../src/reports/LoopsReport.js";
import { createReportServiceFactory } from "../common.js";

describe(`LoopsReport Test`, () => {
    const rootPath = path.join("tests", "data", "loops_data");
    let provider: DumpPackageProvider;

    beforeAll(() => {
        provider = new DumpPackageProvider(rootPath);
    });

    test(`works`, async () => {
        const buildLoopsReport = createReportServiceFactory(LoopsReport, provider);
        const { reportService, stdout, stderr } = buildLoopsReport({
            package: `@webassemblyjs/ast@1.9.0`,
            type: `dependencies`
        });

        await reportService.process();

        expect(stdout.lines).toMatchSnapshot(`stdout`);
        expect(stderr.lines).toMatchSnapshot(`stderr`);
    });

    test(`Throws on illegal dependency type`, async () => {
        expect.assertions(1);

        try {
            const report = new LoopsReport({
                package: `foo`,
                //@ts-expect-error type needs to be a valid dependency type
                type: `xxx`
            });
        } catch (e) {
            expect(e).toBeInstanceOf(Error);
        }
    });
});
