import { DecoratorData, DecoratorKey, IDecorator } from "../extensions/decorators/Decorator";
import { IPackageJson } from "../npm";
interface IDeprecatedInfo {
    deprecated: boolean;
    message: string;
}
interface IPackage<T> {
    parent: T | null;
    isLoop: boolean;
    name: string;
    version: string;
    fullName: string;
    directDependencies: T[];
    deprecatedInfo: IDeprecatedInfo;
    addDependency: (dependency: T) => void;
    visit: (callback: (dependency: T) => void, includeSelf: boolean) => void;
    getPackagesBy: (filter: (pkg: T) => boolean) => T[];
    getPackagesByName: (name: string, version?: string) => T[];
    getPackageByName: (name: string, version?: string) => T | null;
    getData(key: string): unknown;
    getDecoratorData<D extends IDecorator<any, unknown>>(key: DecoratorKey<D>): DecoratorData<D>;
    setDecoratorData<D extends IDecorator<any, unknown>>(key: DecoratorKey<D>, data: DecoratorData<D>): void;
}
export declare class Package implements IPackage<Package> {
    private readonly _data;
    parent: Package | null;
    isLoop: boolean;
    private _decoratorData;
    private readonly _dependencies;
    constructor(_data: Readonly<IPackageJson>);
    get name(): string;
    get version(): string;
    get fullName(): string;
    get directDependencies(): Package[];
    get deprecatedInfo(): IDeprecatedInfo;
    addDependency(dependency: Package): void;
    visit(callback: (dependency: Package) => void, includeSelf?: boolean): void;
    getPackagesBy(filter: (pkg: Package) => boolean): Package[];
    getPackagesByName(name: string, version?: string): Package[];
    getPackageByName(name: string, version?: string): Package | null;
    getData(key: string): unknown;
    getDecoratorData<E extends IDecorator<any, unknown>>(key: DecoratorKey<E>): DecoratorData<E>;
    setDecoratorData<E extends IDecorator<any, unknown>>(key: DecoratorKey<E>, data: DecoratorData<E>): void;
}
export {};
//# sourceMappingURL=package.d.ts.map