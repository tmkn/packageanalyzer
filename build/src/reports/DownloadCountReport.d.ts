import { INpmDownloadStatistic } from "../npm";
import { Package } from "../package/package";
import { Url } from "../utils/requests";
import { PackageVersion } from "../visitors/visitor";
import { AbstractReport, IReportContext } from "./Report";
export interface IDownloadParams {
    pkg: string;
    url?: Url;
}
export declare class DownloadReport extends AbstractReport<IDownloadParams> {
    readonly params: IDownloadParams;
    name: string;
    pkg: PackageVersion;
    constructor(params: IDownloadParams);
    report(pkg: Package, { stdoutFormatter }: IReportContext): Promise<void>;
}
export declare function getDownloadsLastWeek(name: string, url?: Url): Promise<INpmDownloadStatistic>;
//# sourceMappingURL=DownloadCountReport.d.ts.map