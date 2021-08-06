import { IPackageMetadata, IPackageJson, IUnpublishedPackageMetadata } from "../npm";
import { PackageVersion } from "../visitors/visitor";

export interface IPackageMetaDataProvider {
    getPackageMetadata(
        name: string
    ): Promise<IPackageMetadata | IUnpublishedPackageMetadata | undefined>;
}

//loads npm data from a folder
export interface IPackageJsonProvider {
    //load version specific data, loads latest version if no version is specified
    getPackageJson: (...args: PackageVersion) => Promise<IPackageJson>;
    getPackageJsons: (modules: PackageVersion[]) => AsyncIterableIterator<IPackageJson>;
}
