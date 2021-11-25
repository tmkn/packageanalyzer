import { Package } from "../package/package";
import { PackageVersion } from "../visitors/visitor";
import { IPackageMetadata, IPackageJson, IUnpublishedPackageMetadata } from "../npm";
import { IPackageJsonProvider } from "../providers/provider";
import { Url } from "./requests";
export declare class DependencyDumper {
    pkg?: Package;
    private _provider?;
    collect(pkg: PackageVersion, repoUrl: Url): Promise<void>;
    save(baseDir: string): Promise<void>;
    private _getFolder;
}
export declare class DependencyDumperProvider implements IPackageJsonProvider {
    private _dir;
    private _cache;
    private _initialized;
    constructor(_dir: string);
    getPackageInfo(name: string): Promise<IPackageMetadata | IUnpublishedPackageMetadata | undefined>;
    getPackageJson(name: string, version?: string): Promise<IPackageJson>;
    getPackageJsons(modules: PackageVersion[]): AsyncIterableIterator<IPackageJson>;
    private _populateCache;
    private _readDir;
}
//# sourceMappingURL=dumper.d.ts.map