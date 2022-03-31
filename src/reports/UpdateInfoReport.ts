import * as chalk from "chalk";
import * as t from "io-ts";

import { daysAgo } from "../cli/common";
import { Package } from "../package/package";
import { OnlinePackageProvider } from "../providers/online";
import { updateInfo } from "../utils/update";
import { getPackageVersionfromString, PackageVersion } from "../visitors/visitor";
import { AbstractReport, IReportContext } from "./Report";
import { BasePackageParameter } from "./Validation";

export const onlinePackageProviderType = new t.Type<OnlinePackageProvider>(
    "onlinePackageProviderType",
    (input: unknown): input is OnlinePackageProvider =>
        typeof input === "object" &&
        input !== null &&
        "getPackageMetadata" in input &&
        "getPackageJson" in input,
    (input, context) => {
        if (
            typeof input === "object" &&
            input !== null &&
            "getPackageMetadata" in input &&
            "getPackageJson" in input
        ) {
            return t.success(input as OnlinePackageProvider);
        }

        return t.failure(input, context, `Failed to verify OnlinePackageProvider`);
    },
    t.identity
);

export type IUpdateInfoParams = t.TypeOf<typeof BasePackageParameter>;

export class UpdateInfoReport extends AbstractReport<IUpdateInfoParams> {
    name = `Update Info Report`;
    pkg: PackageVersion;

    constructor(params: IUpdateInfoParams) {
        super(params);

        this.depth = 0;
        this.pkg = getPackageVersionfromString(params.package);
    }

    async report(
        pkg: Package,
        { stdoutFormatter, stderrFormatter }: IReportContext
    ): Promise<void> {
        const [name, version] = this.pkg;

        try {
            if (typeof version === "undefined") {
                throw new Error(`Version info is missing (${name})`);
            }

            if (!onlinePackageProviderType.is(this.provider)) {
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
        } catch (e: any) {
            stderrFormatter.writeLine(e?.toString());
        }
    }

    override validate(): t.Type<IUpdateInfoParams> {
        return BasePackageParameter;
    }
}
