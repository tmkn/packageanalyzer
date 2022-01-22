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

const UpdateInfoParams = t.intersection([
    BasePackageParameter,
    t.type({
        provider: onlinePackageProviderType
    })
]);

export type IUpdateInfoParams = t.TypeOf<typeof UpdateInfoParams>;

export class UpdateInfoReport extends AbstractReport<IUpdateInfoParams> {
    name = `Update Info Report`;
    pkg: PackageVersion;

    constructor(params: IUpdateInfoParams) {
        super(params);

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

    validate(): t.Type<IUpdateInfoParams> {
        return UpdateInfoParams;
    }
}
