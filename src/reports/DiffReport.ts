import * as t from "io-ts";
import * as chalk from "chalk";

import { defaultDependencyType } from "../cli/common";
import { DependencyUtilities } from "../extensions/utilities/DependencyUtilities";
import { Package } from "../package/package";
import { getPackageVersionfromString, PackageVersion } from "../visitors/visitor";
import { AbstractReport, IReportContext } from "./Report";
import { TypeParameter } from "./Validation";
import { DiffUtilities, UpdateTuple } from "../extensions/utilities/DiffUtilities";
import { INpmUser } from "../npm";
import { IFormatter } from "../utils/formatter";

const FromParamenter = t.type({
    from: t.string
});

const ToParamenter = t.type({
    to: t.string
});

const DiffParams = t.intersection([FromParamenter, ToParamenter, TypeParameter]);

export type IDiffReportParams = t.TypeOf<typeof DiffParams>;

export class DiffReport extends AbstractReport<
    IDiffReportParams,
    [PackageVersion, PackageVersion]
> {
    name = `Diff Report`;
    pkg: [PackageVersion, PackageVersion];

    constructor(params: IDiffReportParams) {
        super(params);

        this.type = params.type ?? defaultDependencyType;

        if (DiffParams.is(params)) {
            this.pkg = [
                getPackageVersionfromString(params.from),
                getPackageVersionfromString(params.to)
            ];
        } else throw new Error();
    }

    async report(
        { stdoutFormatter }: IReportContext,
        fromPkg: Package,
        toPkg: Package
    ): Promise<void> {
        const { newMaintainers, newPackages, updatedPackages, removedPackages } = new DiffUtilities(
            fromPkg,
            toPkg
        );
        const { transitiveCount: fromTransitiveCount } = new DependencyUtilities(fromPkg);
        const { transitiveCount: toTransitiveCount } = new DependencyUtilities(toPkg);
        const difference = fromTransitiveCount - toTransitiveCount;
        const info: string = `${fromTransitiveCount} (${fromPkg.fullName}) -> ${toTransitiveCount} (${toPkg.fullName})`;
        let msg: string = ``;

        if (difference === 0) msg = `Dependency count stayed the same: ${info}`;
        else if (difference > 0) msg = `Dependency count ${chalk.green(`decreased`)}: ${info}`;
        else msg = `Dependency count ${chalk.redBright(`increased`)}: ${info}`;

        stdoutFormatter.writeIdentation([`Dependency Diff`, msg], 4);

        this._printNewMaintainers(newMaintainers, stdoutFormatter);
        this._printNewPackages(newPackages, stdoutFormatter);
        this._printUpdatedPackages(fromPkg, toPkg, updatedPackages, stdoutFormatter);
        this._printRemovedPackages(removedPackages, stdoutFormatter);
    }

    private _printNewMaintainers(
        newMaintainers: INpmUser[] | undefined,
        stdoutFormatter: IFormatter
    ): void {
        stdoutFormatter.writeIdentation(
            [
                `New Maintainer(s):`,
                ...(newMaintainers?.map(maintainer => `${maintainer.name} (${maintainer.email})`) ??
                    [].map(() => `No new maintainers`))
            ],
            4
        );
    }

    private _printNewPackages(newPackages: Package[], stdoutFormatter: IFormatter): void {
        let lines: string[] = [`No new packages`];

        if (newPackages.length > 0) {
            lines = newPackages.map(pkg => `${pkg.fullName} (${pkg.version})`);
        }

        stdoutFormatter.writeIdentation([`New Package(s):`, ...lines], 4);
    }

    private _printUpdatedPackages(
        fromPkg: Package,
        toPkg: Package,
        updatedPackages: UpdateTuple[],
        stdoutFormatter: IFormatter
    ): void {
        let lines: string[] = [`No updated packages`];

        if (updatedPackages.length > 0) {
            lines = updatedPackages.map(([from, to]) => `${from.fullName} -> ${to.fullName}`);
        }

        stdoutFormatter.writeIdentation(
            [`Updated Packages (${fromPkg.fullName} -> ${toPkg.fullName}):`, ...lines],
            4
        );
    }

    private _printRemovedPackages(removedPackages: Package[], stdoutFormatter: IFormatter): void {
        let lines: string[] = [`No removed packages`];

        if (removedPackages.length > 0) {
            lines = removedPackages.map(pkg => `${pkg.fullName}`);
        }

        stdoutFormatter.writeIdentation([`Removed Packages:`, ...lines], 4);
    }

    override validate(): t.Type<IDiffReportParams> {
        return DiffParams;
    }
}
