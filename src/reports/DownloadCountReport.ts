import { getDownloadsLastWeek } from "../npm";
import { Package } from "../package/package";
import { IFormatter } from "../utils/formatter";
import { Url } from "../utils/requests";
import { getPackageVersionfromString } from "../visitors/utils";
import { PackageVersion } from "../visitors/visitor";
import { AbstractReport, IReportContext } from "./Report";

export interface IDownloadParams {
    pkg: string;
    url?: Url;
}

export class DownloadReport extends AbstractReport<IDownloadParams> {
    name = `Download Report`;
    pkg: PackageVersion;

    constructor(readonly params: IDownloadParams) {
        super();

        this.depth = 0;
        this.pkg = getPackageVersionfromString(params.pkg);
    }

    async report(pkg: Package, { stdoutFormatter }: IReportContext): Promise<void> {
        await cliDownloads(pkg.name, this.params.url ?? null, stdoutFormatter);
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
