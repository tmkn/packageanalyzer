import * as chalk from "chalk";

import { daysAgo } from "../cli/common";
import { Package } from "../package/package";
import { OnlinePackageProvider } from "../providers/online";
import { IFormatter } from "../utils/formatter";
import { updateInfo } from "../utils/update";
import { getPackageVersionfromString, PackageVersion } from "../visitors/visitor";
import { AbstractReport, IReportContext } from "./Report";

export interface IUpdateInfoParams {
    package: string;
    provider: OnlinePackageProvider;
}

export class UpdateInfoReport extends AbstractReport<IUpdateInfoParams> {
    name = `Update Info Report`;
    pkg: PackageVersion;

    constructor(readonly params: IUpdateInfoParams) {
        super();

        this.depth = 0;
        this.pkg = getPackageVersionfromString(params.package);
        this.provider = params.provider;
    }

    async report(pkg: Package, { stdoutFormatter }: IReportContext): Promise<void> {
        const [name, version] = this.pkg;

        if (typeof version === "undefined") {
            stdoutFormatter.writeLine(`Version info is missing (${name})`);

            return;
        }

        const data = await updateInfo(name, version, this.params.provider);
        const updateStr = chalk.bold(`Update Info for ${pkg.fullName}`);

        stdoutFormatter.writeLine(`${updateStr}\n`);
        stdoutFormatter.writeGroup([
            [
                `Semantic match`,
                `${data.latestSemanticMatch.version}  ${daysAgo(
                    data.latestSemanticMatch.releaseDate
                )}`
            ],
            [
                `Latest bugfix`,
                `${data.latestBugfix.version} ${daysAgo(data.latestBugfix.releaseDate)}`
            ],
            [
                `Latest minor`,
                `${data.latestMinor.version} ${daysAgo(data.latestMinor.releaseDate)}`
            ],
            [
                `Latest version`,
                `${data.latestOverall.version} ${daysAgo(data.latestOverall.releaseDate)}`
            ]
        ]);
    }
}
