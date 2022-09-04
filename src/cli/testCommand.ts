/* istanbul ignore file */
// Used to quickly try out wip things in the context of the CLI

import { Option } from "clipanion";
import * as t from "io-ts";

import { CliCommand, defaultDependencyType } from "./common";
import { BasePackageParameter, DependencyTypes, TypeParameter } from "../reports/Validation";
import { AbstractReport, IReportContext } from "../reports/Report";
import { getPackageVersionfromString, Package, PackageVersion } from "../index.web";
import { TarDecorator } from "../extensions/decorators/TarDecorator";

export class TestCommand extends CliCommand<TestReport> {
    public package = Option.String(`--package`, `typescript`);

    public type: DependencyTypes = Option.String(`--type`, defaultDependencyType, {
        description: `the type of dependencies you want to analzye, "dependencies" or "devDependencies"`
    });

    static override paths = [[`test`]];

    getReport(): TestReport {
        return new TestReport({
            package: this.package,
            type: this.type
        });
    }
}

const PackageParams = t.intersection([BasePackageParameter, TypeParameter]);

export type ITestReportParams = t.TypeOf<typeof PackageParams>;

export class TestReport extends AbstractReport<ITestReportParams> {
    name = `Test Report`;
    pkg: PackageVersion;

    override decorators = [new TarDecorator()];

    constructor(params: ITestReportParams) {
        super(params);

        if (PackageParams.is(params)) {
            this.pkg = getPackageVersionfromString(params.package);
        } else {
            throw new Error(`Error`);
        }
    }

    async report({ stdoutFormatter }: IReportContext, pkg: Package): Promise<void> {
        pkg.visit(pkg => {
            // const { files } = pkg.getDecoratorData<TarDecorator>(`tar`);

            // stdoutFormatter.writeLine(`Package: "${pkg.fullName}" | Files: ${files.size}`);
            // stdoutFormatter.writeLine(JSON.stringify([...files.keys()], null, 4));
            stdoutFormatter.writeIdentation(
                [
                    `Package: "${pkg.fullName}"`,
                    pkg.getData(`dist.tarball`) + `` ?? `tarball not found!`
                ],
                4
            );
        }, true);
    }

    override validate(): t.Type<ITestReportParams> {
        return PackageParams;
    }
}
