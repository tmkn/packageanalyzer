import { IPackageMetaDataProvider } from "../providers/provider";
interface IReleaseInfo {
    version: string;
    releaseDate: string;
}
interface IUpdateResult {
    name: string;
    version: string;
    latestOverall: IReleaseInfo;
    latestSemanticMatch: IReleaseInfo;
    latestMinor: IReleaseInfo;
    latestBugfix: IReleaseInfo;
}
export declare function cleanVersion(rawVersion: string): string;
export declare function getBugfixVersionString(rawVersion: string): string;
export declare function getMinorVersionString(rawVersion: string): string;
export declare function updateCheck(name: string, version: string, provider: IPackageMetaDataProvider): Promise<IReleaseInfo>;
export declare function updateInfo(name: string, version: string, provider: IPackageMetaDataProvider): Promise<IUpdateResult>;
export {};
//# sourceMappingURL=update.d.ts.map