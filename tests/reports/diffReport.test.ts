import { DiffReport } from "../../src/reports/DiffReport";
import { ReportService } from "../../src/reports/ReportService";
import { createMockContext } from "../common";
import { IMockPackageJson, MockProvider } from "../mocks";

describe(`DiffReport Tests`, () => {
    const fromBaseData: IMockPackageJson = {
        name: `medallo`,
        version: `1.0.0`
    };

    const toBaseData: IMockPackageJson = {
        name: `medallo`,
        version: `2.0.0`
    };

    test(`Correctly displays unchanged dependencies`, async () => {
        const fromPkg: IMockPackageJson = {
            ...fromBaseData,
            ...{
                dependencies: [
                    { name: `unchanged1`, version: `1.0.0` },
                    { name: `unchanged2`, version: `1.0.0` }
                ]
            }
        };

        const toPkg: IMockPackageJson = {
            ...toBaseData,
            ...{
                dependencies: [
                    { name: `unchanged1`, version: `1.0.0` },
                    { name: `unchanged2`, version: `1.0.0` }
                ]
            }
        };

        const provider = new MockProvider([fromPkg, toPkg]);
        const report = new DiffReport({
            from: `medallo@1.0.0`,
            to: `medallo@2.0.0`,
            type: `dependencies`
        });

        report.provider = provider;

        const { stdout, stderr } = createMockContext();
        const reportService = new ReportService(
            {
                reports: [report]
            },
            stdout,
            stderr
        );

        await reportService.process();

        expect(stdout.lines).toMatchSnapshot(`stdout`);
        expect(stderr.lines).toMatchSnapshot(`stderr`);
    });

    test(`Correctly displays upgraded dependencies`, async () => {
        const fromPkg: IMockPackageJson = {
            ...fromBaseData,
            ...{
                dependencies: [
                    { name: `dep1`, version: `1.2.3` },
                    { name: `dep2`, version: `1.2.3` }
                ]
            }
        };

        const toPkg: IMockPackageJson = {
            ...toBaseData,
            ...{
                dependencies: [
                    { name: `dep1`, version: `4.5.6` },
                    { name: `dep2`, version: `4.5.6` }
                ]
            }
        };

        const provider = new MockProvider([fromPkg, toPkg]);
        const report = new DiffReport({
            from: `medallo@1.0.0`,
            to: `medallo@2.0.0`,
            type: `dependencies`
        });

        report.provider = provider;

        const { stdout, stderr } = createMockContext();
        const reportService = new ReportService(
            {
                reports: [report]
            },
            stdout,
            stderr
        );

        await reportService.process();

        expect(stdout.lines).toMatchSnapshot(`stdout`);
        expect(stderr.lines).toMatchSnapshot(`stderr`);
    });

    test(`Correctly displays removed dependencies`, async () => {
        const fromPkg: IMockPackageJson = {
            ...fromBaseData,
            ...{
                dependencies: [
                    { name: `removed1`, version: `1.2.3` },
                    { name: `removed2`, version: `1.2.3` }
                ]
            }
        };

        const toPkg: IMockPackageJson = {
            ...toBaseData,
            ...{
                dependencies: []
            }
        };

        const provider = new MockProvider([fromPkg, toPkg]);
        const report = new DiffReport({
            from: `medallo@1.0.0`,
            to: `medallo@2.0.0`,
            type: `dependencies`
        });

        report.provider = provider;

        const { stdout, stderr } = createMockContext();
        const reportService = new ReportService(
            {
                reports: [report]
            },
            stdout,
            stderr
        );

        await reportService.process();

        expect(stdout.lines).toMatchSnapshot(`stdout`);
        expect(stderr.lines).toMatchSnapshot(`stderr`);
    });

    test(`Correctly displays added dependencies`, async () => {
        const fromPkg: IMockPackageJson = {
            ...fromBaseData,
            ...{
                dependencies: []
            }
        };

        const toPkg: IMockPackageJson = {
            ...toBaseData,
            ...{
                dependencies: [
                    { name: `added1`, version: `1.2.3` },
                    { name: `added2`, version: `1.2.3` }
                ]
            }
        };

        const provider = new MockProvider([fromPkg, toPkg]);
        const report = new DiffReport({
            from: `medallo@1.0.0`,
            to: `medallo@2.0.0`,
            type: `dependencies`
        });

        report.provider = provider;

        const { stdout, stderr } = createMockContext();
        const reportService = new ReportService(
            {
                reports: [report]
            },
            stdout,
            stderr
        );

        await reportService.process();

        expect(stdout.lines).toMatchSnapshot(`stdout`);
        expect(stderr.lines).toMatchSnapshot(`stderr`);
    });

    test(`Correctly throws on malformed params`, () => {
        //@ts-expect-error params are intentionally wrong
        expect(() => new DiffReport({})).toThrow();
    });
});
