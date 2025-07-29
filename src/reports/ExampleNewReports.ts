// Example usage of the new IReport interface that supports both single config and array of configs

import { z } from "zod";
import { type IReport, type IReportConfig, type PackagesFromConfigs, type IReportContext } from "./Report.js";
import { type PackageVersion } from "../visitors/visitor.js";

// Example 1: Single config report
const singleConfig: IReportConfig<{}> = {
    pkg: ["my-package", "1.0.0"] as PackageVersion,
    type: "dependencies",
    depth: 0,
    attachments: {}
};

class SinglePackageReport implements IReport<typeof singleConfig, z.ZodTypeAny> {
    readonly name = "single-package-report";
    readonly configs = singleConfig;
    exitCode = 0;

    async report(packages: PackagesFromConfigs<typeof singleConfig>, context: IReportContext): Promise<void> {
        // packages is guaranteed to be [IPackage<...>] - a single-element tuple
        const [pkg] = packages;
        context.stdoutFormatter.writeLine(`Processing single package: ${pkg.name}@${pkg.version}`);
    }
}

// Example 2: Multi config report
const config1: IReportConfig<{}> = {
    pkg: ["package-a", "1.0.0"] as PackageVersion,
    type: "dependencies",
    depth: 0,
    attachments: {}
};

const config2: IReportConfig<{}> = {
    pkg: ["package-b", "2.0.0"] as PackageVersion,
    type: "devDependencies",
    depth: 1,
    attachments: {}
};

const multiConfigs: IReportConfig<{}>[] = [config1, config2];

class MultiPackageReport implements IReport<typeof multiConfigs, z.ZodTypeAny> {
    readonly name = "multi-package-report";
    readonly configs = multiConfigs;
    exitCode = 0;

    async report(packages: PackagesFromConfigs<typeof multiConfigs>, context: IReportContext): Promise<void> {
        // packages is guaranteed to be [IPackage<...>, IPackage<...>] - matching config array length
        if (packages.length >= 2) {
            context.stdoutFormatter.writeLine(`Processing packages: ${packages[0]!.name}@${packages[0]!.version} and ${packages[1]!.name}@${packages[1]!.version}`);
        }
    }
}

export { SinglePackageReport, MultiPackageReport };