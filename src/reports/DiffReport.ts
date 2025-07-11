import { z } from "zod";
import chalk from "chalk";

import { defaultDependencyType } from "../cli/common.js";
import { DependencyUtilities } from "../extensions/utilities/DependencyUtilities.js";
import { type IPackage } from "../package/package.js";
import { getPackageVersionfromString, type PackageVersion } from "../visitors/visitor.js";
import { AbstractReport, type IReportContext } from "./Report.js";
import { TypeParameter } from "./Validation.js";
import { DiffUtilities } from "../extensions/utilities/DiffUtilities.js";
import { type IFormatter } from "../utils/formatter.js";

const FromParameter = z.object({
    from: z.string()
});

const ToParameter = z.object({
    to: z.string()
});

const DiffParams = FromParameter.merge(ToParameter).merge(TypeParameter);

export type IDiffReportParams = z.infer<typeof DiffParams>;

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

        this.pkg = [
            getPackageVersionfromString(params.from),
            getPackageVersionfromString(params.to)
        ];
    }

    async report(ctx: IReportContext, fromPkg: IPackage, toPkg: IPackage): Promise<void> {
        const { stdoutFormatter } = ctx;
        stdoutFormatter.writeLine(
            `Dependency Diff: ${chalk.bold.underline(fromPkg.fullName)} (${this._printCount(
                fromPkg
            )}) -> ${chalk.bold.underline(toPkg.fullName)} (${this._printCount(toPkg)})`
        );

        this._printStats(fromPkg, toPkg, stdoutFormatter);
        this._printDependencyChanges(fromPkg, toPkg, ctx);
        this._printLegend(stdoutFormatter);
    }

    private _printLegend(stdoutFormatter: IFormatter): void {
        const legend: string = [
            chalk.green(`(a)dded`),
            chalk.yellow(`(c)hanged`),
            chalk.redBright(`(r)emoved`),
            `(u)nchanged`
        ].join(` `);

        stdoutFormatter.writeLine(`\n${legend}`);
    }

    private _printStats(fromPkg: IPackage, toPkg: IPackage, stdoutFormatter: IFormatter): void {
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

    private _printCount(pkg: IPackage): string {
        return `${pkg.directDependencies.length}/${new DependencyUtilities(pkg).transitiveCount}`;
    }

    private _printDependencyChanges(
        fromPkg: IPackage,
        toPkg: IPackage,
        { stdoutFormatter, stderrFormatter }: IReportContext
    ): void {
        const distinctDirectDependencies: string[] = [
            ...new Set([
                ...fromPkg.directDependencies.map(dep => dep.name),
                ...toPkg.directDependencies.map(dep => dep.name)
            ])
        ].sort((a, b) => a.localeCompare(b));
        const lines: string[] = [];

        for (const dependency of distinctDirectDependencies) {
            try {
                const pkg =
                    fromPkg.directDependencies.find(({ name }) => name === dependency) ??
                    toPkg.directDependencies.find(({ name }) => name === dependency);

                if (typeof pkg === "undefined") throw new Error();

                if (this._dependencyAdded(dependency, fromPkg, toPkg)) {
                    lines.push(this._printStatus(pkg, `added`));
                } else if (this._dependencyRemoved(dependency, fromPkg, toPkg)) {
                    lines.push(this._printStatus(pkg, `removed`));
                } else if (this._dependencyUpated(dependency, fromPkg, toPkg)) {
                    const { updatedPackages } = new DiffUtilities(fromPkg, toPkg);
                    const updatedPackage = updatedPackages.find(
                        ([from]) => from.name === dependency
                    );

                    if (typeof updatedPackage === "undefined") throw new Error();

                    lines.push(this._printStatus(updatedPackage[0], updatedPackage[1]));
                } else {
                    lines.push(this._printStatus(pkg, `unchanged`));
                }
            } catch {
                stderrFormatter.writeLine(`Something went wrong while processing "${dependency}"`);
            }
        }

        stdoutFormatter.writeIdentation([``, ...lines], 4);
    }

    private _dependencyAdded(name: string, fromPkg: IPackage, toPkg: IPackage): boolean {
        const { newPackages } = new DiffUtilities(fromPkg, toPkg);

        return newPackages.some(pkg => pkg.name === name);
    }
    private _dependencyRemoved(name: string, fromPkg: IPackage, toPkg: IPackage): boolean {
        const { removedPackages } = new DiffUtilities(fromPkg, toPkg);

        return removedPackages.some(pkg => pkg.name === name);
    }

    private _dependencyUpated(name: string, fromPkg: IPackage, toPkg: IPackage): boolean {
        const { updatedPackages } = new DiffUtilities(fromPkg, toPkg);

        return updatedPackages.some(([pkg]) => pkg.name === name);
    }

    private _printStatus(from: IPackage, status: Status): string;
    private _printStatus(from: IPackage, to: IPackage): string;
    private _printStatus(from: IPackage, toOrStatus: IPackage | Status): string {
        let line: string;

        if (typeof toOrStatus === "string") {
            line = `${from.fullName} (${new DependencyUtilities(from).transitiveCount})`;
        } else {
            line = `${from.fullName} (${new DependencyUtilities(from).transitiveCount}) -> ${
                toOrStatus.fullName
            } (${new DependencyUtilities(toOrStatus).transitiveCount})`;
        }

        if (toOrStatus === "added") {
            line = chalk.green(`a ${line}`);
        } else if (toOrStatus === "removed") {
            line = chalk.redBright(`r ${line}`);
        } else if (toOrStatus === "unchanged") {
            line = `u ${line}`;
        } else {
            line = chalk.yellow(`c ${line}`);
        }

        return line;
    }

    override validate(): z.ZodTypeAny {
        return DiffParams;
    }
}
