/* istanbul ignore file */
// Used to quickly try out wip things in the context of the CLI

import * as path from "path";

import { Option } from "clipanion";

import { CliCommand, defaultDependencyType } from "./common.js";
import {
    type DependencyTypes,
    BasePackageParameter,
    TypeParameter
} from "../reports/Validation.js";
import { AbstractReport, type IReportConfig, type IReportContext } from "../reports/Report.js";
import { getPackageVersionfromString } from "../visitors/visitor.js";
import { createTarAttachment } from "../attachments/TarAttachment.js";
import { DumpPackageProvider } from "../providers/folder.js";
import { type IPackage } from "../package/package.js";
import { z, type ZodTypeAny } from "zod";

export class TestCommand extends CliCommand<TestReport> {
    public package = Option.String(`--package`, `typescript`);

    public type: DependencyTypes = Option.String(`--type`, defaultDependencyType, {
        description: `the type of dependencies you want to analzye, "dependencies" or "devDependencies"`
    });

    static override paths = [[`test`]];

    getReports(): TestReport {
        return new TestReport({
            package: this.package,
            type: this.type
        });
    }
}

const PackageParams = BasePackageParameter.merge(TypeParameter);

export type ITestReportParams = z.infer<typeof PackageParams>;

export class TestReport extends AbstractReport<ITestReportParams> {
    name = `Test Report`;
    configs: IReportConfig;

    constructor(params: ITestReportParams) {
        super(params);

        if (this._isPackageParams(params)) {
            this.configs = {
                pkg: getPackageVersionfromString(params.package),
                attachments: { tar: createTarAttachment() }
            };
        } else {
            throw new Error(`Error`);
        }
    }

    async report([pkg]: [IPackage], { stdoutFormatter }: IReportContext): Promise<void> {
        const destination = path.join("tests", "data", "dump");
        const provider = new DumpPackageProvider(destination);

        const pkg2 = provider.getPackageJson(`react`, `17.0.2`);
        const pkg3 = provider.getPackageJson(`react`);

        const [data2, data3] = await Promise.all([pkg2, pkg3]);

        console.log(data2.name, data2.version);
        console.log(data3.name, data3.version);
        // pkg.visit(pkg => {
        //     const { files } = pkg.getAttachmentData<TarAttachment>(`tar`);

        //     stdoutFormatter.writeLine(`Package: "${pkg.fullName}" | Files: ${files.size}`);
        //     stdoutFormatter.writeLine(JSON.stringify([...files.keys()], null, 4));
        // }, true);
    }

    private _isPackageParams(data: unknown): data is z.infer<typeof PackageParams> {
        return PackageParams.safeParse(data).success;
    }

    override validate(): ZodTypeAny {
        return PackageParams;
    }
}
