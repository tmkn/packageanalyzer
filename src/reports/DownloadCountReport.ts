import { getDownloadsLastWeek } from "../npm";
import { Package } from "../package/package";
import { IFormatter } from "../utils/formatter";
import { getPackageVersionfromString, PackageVersion } from "../visitors/visitor";
import { IReport } from "./Report";

export interface IDownloadParams {
    pkg: string;
}

export class DownloadReport implements IReport<IDownloadParams> {
    name = `Download Report`;
    pkg: PackageVersion;
    depth: number = 0;

    constructor(readonly params: IDownloadParams) {
        this.pkg = getPackageVersionfromString(params.pkg);
    }

    async report(pkg: Package, formatter: IFormatter): Promise<void> {
        await cliDownloads(pkg.name, null, formatter);
    }
}

async function cliDownloads(pkg: string, url: string | null, formatter: IFormatter): Promise<void> {
    try {
        const downloads =
            url !== null ? await getDownloadsLastWeek(pkg, url) : await getDownloadsLastWeek(pkg);

        formatter.writeLine(`${pkg}: ${downloads.downloads} Downloads`);
    } catch (e) {
        console.log(e);
        formatter.writeLine(`Couldn't get downloads for ${pkg}`);
    }
}
