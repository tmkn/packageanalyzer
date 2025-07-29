import { describe, it, expect } from "vitest";
import { z } from "zod";
import { type IReport, type IReportConfig, type PackagesFromConfigs, type IReportContext } from "../../src/reports/Report.js";
import { type PackageVersion } from "../../src/visitors/visitor.js";

describe("New IReport Interface Tests", () => {
    it("should support single IReportConfig", () => {
        const singleConfig: IReportConfig<{}> = {
            pkg: ["test", "1.0.0"] as PackageVersion,
            type: "dependencies",
            depth: 0,
            attachments: {}
        };

        class SingleConfigReport implements IReport<typeof singleConfig, z.ZodTypeAny> {
            readonly name = "single-config-test";
            readonly configs = singleConfig;
            exitCode = 0;

            async report(packages: PackagesFromConfigs<typeof singleConfig>, _context: IReportContext): Promise<void> {
                // packages should be a single-item tuple: [IPackage<...>]
                expect(packages).toBeInstanceOf(Array);
                expect(packages).toHaveLength(1);
            }
        }

        const report = new SingleConfigReport();
        expect(report.name).toBe("single-config-test");
        expect(report.configs).toBe(singleConfig);
    });

    it("should support array of IReportConfig", () => {
        const config1: IReportConfig<{}> = {
            pkg: ["test1", "1.0.0"] as PackageVersion,
            type: "dependencies",
            depth: 0,
            attachments: {}
        };

        const config2: IReportConfig<{}> = {
            pkg: ["test2", "2.0.0"] as PackageVersion,
            type: "devDependencies",
            depth: 1,
            attachments: {}
        };

        const multiConfigs: IReportConfig<{}>[] = [config1, config2];

        class MultiConfigReport implements IReport<typeof multiConfigs, z.ZodTypeAny> {
            readonly name = "multi-config-test";
            readonly configs = multiConfigs;
            exitCode = 0;

            async report(packages: PackagesFromConfigs<typeof multiConfigs>, _context: IReportContext): Promise<void> {
                // packages should be a tuple matching the configs: [IPackage<...>, IPackage<...>]
                expect(packages).toBeInstanceOf(Array);
                expect(packages).toHaveLength(2);
            }
        }

        const report = new MultiConfigReport();
        expect(report.name).toBe("multi-config-test");
        expect(report.configs).toEqual(multiConfigs);
        expect(report.configs).toHaveLength(2);
    });
});