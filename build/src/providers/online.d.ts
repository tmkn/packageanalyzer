import { IPackageMetadata, IPackageJson, IUnpublishedPackageMetadata } from "../npm";
import { Url } from "../utils/requests";
import { PackageVersion } from "../visitors/visitor";
import { IPackageJsonProvider, IPackageMetaDataProvider } from "./provider";
export declare class OnlinePackageProvider implements IPackageJsonProvider, IPackageMetaDataProvider {
    private _url;
    private readonly _cache;
    constructor(_url: Url);
    getPackageMetadata(name: string): Promise<IPackageMetadata | IUnpublishedPackageMetadata | undefined>;
    getPackageJsons(modules: PackageVersion[]): AsyncIterableIterator<IPackageJson>;
    getPackageJson(name: string, version?: string | undefined): Promise<IPackageJson>;
}
export declare const npmOnline: OnlinePackageProvider;
//# sourceMappingURL=online.d.ts.map