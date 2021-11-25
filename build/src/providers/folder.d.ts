import { IPackageJson } from "../npm";
import { PackageVersion } from "../visitors/visitor";
import { IPackageJsonProvider } from "./provider";
export declare class FileSystemPackageProvider implements IPackageJsonProvider {
    private _paths;
    private readonly _cache;
    constructor(_folder: string);
    private _findPackageJson;
    private _load;
    addPackage(pkg: IPackageJson): void;
    getPackageJsons(modules: PackageVersion[]): AsyncIterableIterator<IPackageJson>;
    getPackageJson(name: string, version?: string | undefined): Promise<IPackageJson>;
}
//# sourceMappingURL=folder.d.ts.map