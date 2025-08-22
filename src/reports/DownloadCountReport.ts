import { z } from "zod";
import { QueryClient } from "@tanstack/query-core";

import { type INpmDownloadStatistic } from "../npm.js";
import { type IPackage } from "../package/package.js";
import { type IFormatter } from "../utils/formatter.js";
import { downloadJson } from "../utils/requests.js";
import { getPackageVersionfromString } from "../visitors/visitor.js";
import { AbstractReport, type IReportConfig, type IReportContext } from "./Report.js";
import { BasePackageParameter, type Url, urlType } from "./Validation.js";

const OptionalParams = z.object({
    url: z.optional(urlType)
});

const DownloadParams = BasePackageParameter.merge(OptionalParams);

export type IDownloadParams = z.infer<typeof DownloadParams>;

export class DownloadReport extends AbstractReport<IDownloadParams> {
    name = `Download Report`;
    configs: IReportConfig;

    constructor(params: IDownloadParams) {
        super(params);

        this.configs = {
            pkg: getPackageVersionfromString(params.package),
            depth: 0
        };
    }

    async report([pkg]: [IPackage], { stdoutFormatter }: IReportContext): Promise<void> {
        await cliDownloads(pkg.name, this.params.url ?? null, stdoutFormatter);
    }

    override validate(): z.ZodType<IDownloadParams> {
        return DownloadParams;
    }
}

async function cliDownloads(pkg: string, url: Url | null, formatter: IFormatter): Promise<void> {
    try {
        const downloads =
            url !== null ? await getDownloadsLastWeek(pkg, url) : await getDownloadsLastWeek(pkg);

        formatter.writeLine(`${pkg}: ${downloads.downloads} Downloads`);
    } catch (e) {
        console.log(e);
        formatter.writeLine(`Couldn't get downloads for ${pkg}`);
    }
}

export async function getDownloadsLastWeek(
    name: string,
    url: Url = `https://api.npmjs.org/downloads/point/last-week/`
): Promise<INpmDownloadStatistic> {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                retry: 3
            }
        }
    });

    const downloadResponse = await queryClient.fetchQuery({
        queryKey: ["downloads", name],
        queryFn: async ({ signal }) => {
            const json = await downloadJson<INpmDownloadStatistic>(
                `${url}${encodeURIComponent(name)}`,
                { signal }
            );

            if (json !== null) return json;

            throw new Error(`Couldn't get download numbers for ${name}`);
        }
    });

    return downloadResponse;
}
