import { IPackageMetadata, IPackageJson, IUnpublishedPackageMetadata } from "../npm";
import { PackageVersion } from "../visitors/visitor";
export interface IPackageMetaDataProvider {
    getPackageMetadata(name: string): Promise<IPackageMetadata | IUnpublishedPackageMetadata | undefined>;
}
export interface IPackageJsonProvider {
    getPackageJson: (...args: PackageVersion) => Promise<IPackageJson>;
    getPackageJsons: (modules: PackageVersion[]) => AsyncIterableIterator<IPackageJson>;
}
//# sourceMappingURL=provider.d.ts.map