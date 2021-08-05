import * as chalk from "chalk";

import { daysAgo } from "../cli/common";
import { Package } from "../package/package";
import { OnlinePackageProvider } from "../providers/online";
import { IPackageJsonProvider } from "../providers/provider";
import { IFormatter } from "../utils/formatter";
import { updateInfo } from "../utils/update";
import { getPackageVersionfromString, PackageVersion } from "../visitors/visitor";
import { IReport } from "./Report";

export interface IUpdateInfoParams {
    package: string;
    provider: OnlinePackageProvider;
}

export class UpdateInfoReport implements IReport<IUpdateInfoParams> {
    name = `Update Info Report`;
    pkg: PackageVersion;
    provider: IPackageJsonProvider;
    depth: number = 0;

    constructor(readonly params: IUpdateInfoParams) {
        this.pkg = getPackageVersionfromString(params.package);
        this.provider = params.provider;
    }

    async report(pkg: Package, formatter: IFormatter): Promise<void> {
        const [name, version] = this.pkg;

        if (typeof version === "undefined") {
            formatter.writeLine(`Version info is missing (${name})`);

            return;
        }

        const data = await updateInfo(name, version, this.params.provider);
        const updateStr = chalk.bold(`Update Info for ${pkg.fullName}`);

        formatter.writeLine(`${updateStr}\n`);
        formatter.writeGroup([
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
