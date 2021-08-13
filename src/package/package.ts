import { get } from "lodash";
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
    setDecoratorData<D extends IDecorator<any, unknown>>(
        key: DecoratorKey<D>,
        data: DecoratorData<D>
    ): void;
}

export class Package implements IPackage<Package> {
    parent: Package | null = null;
    isLoop = false;

    private _decoratorData: Map<IDecorator<any, any>, any> = new Map();
    private readonly _dependencies: Package[] = [];

    constructor(private readonly _data: Readonly<IPackageJson>) {}

    get name(): string {
        return this._data.name;
    }

    get version(): string {
        return this._data.version;
    }

    get fullName(): string {
        return `${this.name}@${this.version}`;
    }

    get directDependencies(): Package[] {
        return this._dependencies;
    }

    get deprecatedInfo(): IDeprecatedInfo {
        const deprecated = this.getData("deprecated");

        if (typeof deprecated === "string") {
            return {
                deprecated: true,
                message: deprecated
            };
        }

        return {
            deprecated: false,
            message: ``
        };
    }

    addDependency(dependency: Package): void {
        dependency.parent = this;

        this._dependencies.push(dependency);
    }

    visit(callback: (dependency: Package) => void, includeSelf = false): void {
        if (includeSelf) callback(this);

        for (const child of this._dependencies) {
            callback(child);
            child.visit(callback, false);
        }
    }

    getPackagesBy(filter: (pkg: Package) => boolean): Package[] {
        const matches: Package[] = [];

        this.visit(d => {
            if (filter(d)) matches.push(d);
        }, true);

        return matches;
    }

    getPackagesByName(name: string, version?: string): Package[] {
        const matches: Package[] = [];

        this.visit(d => {
            if (typeof version === "undefined") {
                if (d.name === name) matches.push(d);
            } else {
                if (d.name === name && d.version === version) matches.push(d);
            }
        }, true);

        return matches;
    }

    getPackageByName(name: string, version?: string): Package | null {
        const matches: Package[] = this.getPackagesByName(name, version);

        return matches[0] ?? null;
    }

    getData(key: string): unknown {
        return get(this._data, key);
    }

    getDecoratorData<E extends IDecorator<any, unknown>>(key: DecoratorKey<E>): DecoratorData<E> {
        const data = this._decoratorData.get(key);

        if (typeof data === "undefined") {
            throw new Error(`No extension data found for ${key.toString()}`);
        }

        return data;
    }

    setDecoratorData<E extends IDecorator<any, unknown>>(
        key: DecoratorKey<E>,
        data: DecoratorData<E>
    ): void {
        this._decoratorData.set(key, data);
    }
}
