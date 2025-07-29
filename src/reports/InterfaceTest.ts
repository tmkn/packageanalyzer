import { z } from "zod";
import { type IReport, type IReportConfig, type PackagesFromConfigs, type IReportContext } from "./Report.js";
import { type PackageVersion } from "../visitors/visitor.js";

// Test that single config works
const singleConfig: IReportConfig<{}> = {
    pkg: ["test", "1.0.0"] as PackageVersion,
    type: "dependencies",
    depth: 0,
    attachments: {}
};

// This should be allowed - single config passed to IReport
type SingleReport = IReport<typeof singleConfig, z.ZodTypeAny>;

// Test that array config works  
const arrayConfig: IReportConfig<{}>[] = [singleConfig, singleConfig];

// This should be allowed - array config passed to IReport
type ArrayReport = IReport<typeof arrayConfig, z.ZodTypeAny>;

// Test PackagesFromConfigs type
type SinglePackages = PackagesFromConfigs<typeof singleConfig>; // Should be [IPackage<...>]
type ArrayPackages = PackagesFromConfigs<typeof arrayConfig>; // Should be [IPackage<...>, IPackage<...>]

// Type tests passed - this file compiles successfully