import chalk from "chalk";
import { z } from "zod";

import { daysAgo } from "../cli/common.js";
import { type IPackage } from "../package/package.js";
import { OnlinePackageProvider } from "../providers/online.js";
import { updateInfo } from "../utils/update.js";
import { getPackageVersionfromString } from "../visitors/visitor.js";
import { AbstractReport, type IReportConfig, type IReportContext } from "./Report.js";
import { BasePackageParameter } from "./Validation.js";

export const onlinePackageProviderType = z.custom<OnlinePackageProvider>(input => {
    return (
        typeof input === "object" &&
        input !== null &&
        "getPackageMetadata" in input &&
        "getPackageJson" in input
    );
});

export type IUpdateInfoParams = z.infer<typeof BasePackageParameter>;

export class UpdateInfoReport extends AbstractReport<IUpdateInfoParams> {
    name = `Update Info Report`;
    configs: IReportConfig;

    constructor(params: IUpdateInfoParams) {
        super(params);

        this.configs = { pkg: getPackageVersionfromString(params.package), depth: 0 };
    }

    async report(
        [pkg]: [IPackage],
        { stdoutFormatter, stderrFormatter }: IReportContext
    ): Promise<void> {
        const [name, version] = this.configs.pkg;

        try {
            if (typeof version === "undefined") {
                throw new Error(`Version info is missing (${name})`);
            }

            if (!this._isOnlinePackageProvider(this.provider)) {
                throw new Error(`Wrong provider instance`);
            }

            const data = await updateInfo(name, version, this.provider);
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
        } catch (e: unknown) {
            if (e instanceof Error) {
                stderrFormatter.writeLine(e?.toString());
            }
        }
    }

    private _isOnlinePackageProvider(
        data: unknown
    ): data is z.infer<typeof onlinePackageProviderType> {
        return onlinePackageProviderType.safeParse(data).success;
    }

    override validate(): z.ZodTypeAny {
        return BasePackageParameter;
    }
}
