import { INpmPackage, INpmPackageVersion, IUnpublishedNpmPackage } from "../npm";
import { PackageVersion } from "../visitors/visitor";

export interface INpmPackageProvider {
    getPackageInfo(name: string): Promise<INpmPackage | IUnpublishedNpmPackage | undefined>;
}

//loads npm data from a folder
export interface IPackageVersionProvider {
    //load version specific data, loads latest version if no version is specified
    size: number;
    getPackageByVersion: (...args: PackageVersion) => Promise<INpmPackageVersion>;
    getPackagesByVersion: (modules: PackageVersion[]) => AsyncIterableIterator<INpmPackageVersion>;
}