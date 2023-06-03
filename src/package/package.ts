import { get } from "lodash";
import { DecoratorData, DecoratorKey, IDecorator } from "../extensions/decorators/Decorator";

import { IPackageJson } from "../npm";
import { CollectorNode, ICollectorNode } from "./collector";

interface IDeprecatedInfo {
    deprecated: boolean;
    message: string;
}

export interface IPackage {
    parent: IPackage | null;
    isLoop: boolean;
    name: string;
    version: string;
    fullName: string;
    directDependencies: IPackage[];
    deprecatedInfo: IDeprecatedInfo;

    addDependency: (dependency: IPackage) => void;

    visit: (callback: (dependency: IPackage) => void, includeSelf?: boolean) => void;
    getPackagesBy: (filter: (pkg: IPackage) => boolean) => IPackage[];
    getPackagesByName: (name: string, version?: string) => IPackage[];
    getPackageByName: (name: string, version?: string) => IPackage | null;

    getData(): Readonly<IPackageJson>;
    getData(key: string): unknown;

    getDecoratorData<D extends IDecorator<any, unknown>>(key: DecoratorKey<D>): DecoratorData<D>;
    setDecoratorData<D extends IDecorator<any, unknown>>(
        key: DecoratorKey<D>,
        data: DecoratorData<D>
    ): void;
}

export class Package implements IPackage {
    parent: IPackage | null = null;
    isLoop = false;

    private _decoratorData: Map<IDecorator<any, any>, any> = new Map();
    private readonly _dependencies: IPackage[] = [];

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

    get directDependencies(): IPackage[] {
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

    addDependency(dependency: IPackage): void {
        dependency.parent = this;

        this._dependencies.push(dependency);
    }

    visit(callback: (dependency: IPackage) => void, includeSelf = false): void {
        if (includeSelf) callback(this);

        for (const child of this._dependencies) {
            callback(child);
            child.visit(callback, false);
        }
    }

    getPackagesBy(filter: (pkg: IPackage) => boolean): IPackage[] {
        const matches: IPackage[] = [];

        this.visit(d => {
            if (filter(d)) matches.push(d);
        }, true);

        return matches;
    }

    getPackagesByName(name: string, version?: string): IPackage[] {
        const matches: IPackage[] = [];

        this.visit(d => {
            if (typeof version === "undefined") {
                if (d.name === name) matches.push(d);
            } else {
                if (d.name === name && d.version === version) matches.push(d);
            }
        }, true);

        return matches;
    }

    getPackageByName(name: string, version?: string): IPackage | null {
        const matches: IPackage[] = this.getPackagesByName(name, version);

        return matches[0] ?? null;
    }

    getData(key: string): unknown;
    getData(): Readonly<IPackageJson>;
    getData(key?: string): unknown {
        if (key) return get(this._data, key);
        else return JSON.parse(JSON.stringify(this._data));
    }

    getDecoratorData<E extends IDecorator<any, unknown>>(key: DecoratorKey<E>): DecoratorData<E> {
        const data = this._decoratorData.get(key);

        if (typeof data === "undefined") {
            throw new Error(`No decorator data found for "${key.toString()}"`);
        }

        return data;
    }

    setDecoratorData<E extends IDecorator<any, unknown>>(
        key: DecoratorKey<E>,
        data: DecoratorData<E>
    ): void {
        this._decoratorData.set(key, data);
    }

    collect<T>(dataFn: (pkg: Package) => T): ICollectorNode<T, Package> {
        const identityFn = (i: Package) => i.fullName;
        const rootCollectorNode: ICollectorNode<T, Package> = new CollectorNode(
            dataFn(this),
            this,
            identityFn
        );

        const visit = (parentCollector: ICollectorNode<T, Package>, parentPkg: Package): void => {
            for (const pkg of parentPkg.directDependencies) {
                const collectorNode = new CollectorNode(dataFn(pkg), pkg, identityFn);

                collectorNode.parent = parentCollector;

                parentCollector.children.push(collectorNode);

                visit(collectorNode, pkg);
            }
        };

        visit(rootCollectorNode, this);

        return rootCollectorNode;
    }
}
