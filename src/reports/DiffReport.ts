import * as t from "io-ts";
import * as chalk from "chalk";

import { defaultDependencyType } from "../cli/common";
import { DependencyUtilities } from "../extensions/utilities/DependencyUtilities";
import { Package } from "../package/package";
import { getPackageVersionfromString, PackageVersion } from "../visitors/visitor";
import { AbstractReport, IReportContext } from "./Report";
import { TypeParameter } from "./Validation";
import { DiffUtilities } from "../extensions/utilities/DiffUtilities";
import { IFormatter } from "../utils/formatter";

const FromParamenter = t.type({
    from: t.string
});

const ToParamenter = t.type({
    to: t.string
});

const DiffParams = t.intersection([FromParamenter, ToParamenter, TypeParameter]);

export type IDiffReportParams = t.TypeOf<typeof DiffParams>;

type Status = "unchanged" | "added" | "removed";

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
        } else throw new Error(`Malformed params`);
    }

    async report(
        { stdoutFormatter }: IReportContext,
        fromPkg: Package,
        toPkg: Package
    ): Promise<void> {
        stdoutFormatter.writeLine(
            `Dependency Diff: ${chalk.bold.underline(fromPkg.fullName)} (${this._printCount(
                fromPkg
            )}) -> ${chalk.bold.underline(toPkg.fullName)} (${this._printCount(toPkg)})`
        );

        this._printStats(fromPkg, toPkg, stdoutFormatter);

        this._printDependencyChanges(fromPkg, toPkg, stdoutFormatter);
    }

    private _printStats(fromPkg: Package, toPkg: Package, stdoutFormatter: IFormatter): void {
        const { transitiveCount: fromTransitiveCount } = new DependencyUtilities(fromPkg);
        const { transitiveCount: toTransitiveCount } = new DependencyUtilities(toPkg);

        stdoutFormatter.writeGroup([
            [
                `Direct Dependencies Δ`,
                this._formatDiff(fromPkg.directDependencies.length, toPkg.directDependencies.length)
            ],
            [`All Dependencies Δ`, this._formatDiff(fromTransitiveCount, toTransitiveCount)]
        ]);
    }

    private _formatDiff(from: number, to: number): string {
        const difference = Math.abs(from - to);
        let msg: string = `${difference}`;

        if (from > to) msg = `-${difference}`;
        else if (from < to) msg = `+${difference}`;

        return chalk.bold(msg);
    }

    private _printCount(pkg: Package): string {
        return `${pkg.directDependencies.length}/${new DependencyUtilities(pkg).transitiveCount}`;
    }

    private _printDependencyChanges(
        fromPkg: Package,
        toPkg: Package,
        stdoutFormatter: IFormatter
    ): void {
        const { newMaintainers, newPackages, updatedPackages, removedPackages } = new DiffUtilities(
            fromPkg,
            toPkg
        );

        const lines: string[] = [];
        const allDirectDep: string[] = [
            ...new Set([
                ...fromPkg.directDependencies.map(dep => dep.name),
                ...toPkg.directDependencies.map(dep => dep.name)
            ])
        ].sort();

        for (const name of allDirectDep) {
            let pkg = fromPkg.directDependencies.find(pkg => pkg.name === name);

            if (pkg) {
                if (newPackages.find(pkg => pkg.name === name)) {
                    lines.push(this._printStatus(pkg, `added`));
                } else if (updatedPackages.find(([from]) => from.name === name)) {
                    const updatedPackage = updatedPackages.find(([from]) => from.name === name);

                    if (updatedPackage) {
                        lines.push(this._printStatus(updatedPackage[0], updatedPackage[1]));
                    }
                } else if (removedPackages.find(pkg => pkg.name === name)) {
                    lines.push(this._printStatus(pkg, "removed"));
                } else {
                    lines.push(this._printStatus(pkg, `unchanged`));
                }
            } else {
                pkg = toPkg.directDependencies.find(pkg => pkg.name === name);

                if (pkg) {
                    lines.push(this._printStatus(pkg, `added`));
                } else lines.push(`ERROR`);
            }
        }

        lines.push(
            `\n${chalk.green(`ADDED`)} ${chalk.yellow(`UPDATED`)} ${chalk.redBright(
                `REMOVED`
            )} UNCHANGED`
        );

        stdoutFormatter.writeIdentation([``, ...lines], 4);
    }

    private _printStatus(from: Package, status: Status): string;
    private _printStatus(from: Package, to: Package): string;
    private _printStatus(from: Package, toOrStatus: Package | Status): string {
        let line: string = ``;

        if (typeof toOrStatus === "string") {
            line = `${from.fullName} (${new DependencyUtilities(from).transitiveCount})`;
        } else {
            line = `${from.fullName} (${new DependencyUtilities(from).transitiveCount}) -> ${
                toOrStatus.fullName
            } (${new DependencyUtilities(toOrStatus).transitiveCount})`;
        }

        if (toOrStatus === "added") {
            line = chalk.green(line);
        } else if (toOrStatus === "removed") {
            line = chalk.redBright(line);
        } else if (toOrStatus === "unchanged") {
            //noop
        } else {
            line = chalk.yellow(line);
        }

        return line;
    }

    override validate(): t.Type<IDiffReportParams> {
        return DiffParams;
    }
}
