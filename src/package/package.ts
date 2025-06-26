import _ from "lodash";
const { get } = _;

import { AliasName, type IPackageJson } from "../npm.js";
import { CollectorNode, type ICollectorNode } from "./collector.js";

interface IDeprecatedInfo {
    deprecated: boolean;
    message: string;
}

export interface IPackage<T extends Record<string, any> = Record<string, any>> {
    parent: IPackage<T> | null;
    isLoop: boolean;
    name: string;
    alias: string | null;
    version: string;
    fullName: string;
    directDependencies: IPackage<T>[];
    deprecatedInfo: IDeprecatedInfo;

    addDependency: (dependency: IPackage<T>) => void;

    visit: (callback: (dependency: IPackage<T>) => void, includeSelf?: boolean) => void;
    getPackagesBy: (filter: (pkg: IPackage<T>) => boolean) => IPackage<T>[];
    getPackagesByName: (name: string, version?: string) => IPackage<T>[];
    getPackageByName: (name: string, version?: string) => IPackage<T> | null;

    getData(): Readonly<IPackageJson>;
    getData(key: string): unknown;

    // Partial<...> because attachments could have failed during lookup
    getAttachmentData(): Partial<T>;
    getAttachmentData<K extends keyof T>(key: K): T[K];
    setAttachmentData<K extends keyof T>(key: K, data: T[K]): void;
}

export class Package<T extends Record<string, any>> implements IPackage<T> {
    parent: IPackage<T> | null = null;
    isLoop = false;

    private _attachmentData: T = {} as T;
    private readonly _dependencies: IPackage<T>[] = [];

    constructor(private readonly _data: Readonly<IPackageJson>) {}

    get name(): string {
        return this._data.name;
    }

    get alias(): string | null {
        const aliasName = this._data[AliasName];

        if (typeof aliasName === "string") {
            return aliasName;
        }

        return null;
    }
    get version(): string {
        return this._data.version;
    }

    get fullName(): string {
        return `${this.name}@${this.version}`;
    }

    get directDependencies(): IPackage<T>[] {
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

    addDependency(dependency: IPackage<T>): void {
        dependency.parent = this;

        this._dependencies.push(dependency);
    }

    visit(callback: (dependency: IPackage<T>) => void, includeSelf = false): void {
        if (includeSelf) callback(this);

        for (const child of this._dependencies) {
            callback(child);
            child.visit(callback, false);
        }
    }

    getPackagesBy(filter: (pkg: IPackage<T>) => boolean): IPackage<T>[] {
        const matches: IPackage<T>[] = [];

        this.visit(d => {
            if (filter(d)) matches.push(d);
        }, true);

        return matches;
    }

    getPackagesByName(name: string, version?: string): IPackage<T>[] {
        const matches: IPackage<T>[] = [];

        this.visit(d => {
            if (typeof version === "undefined") {
                if (d.name === name) matches.push(d);
            } else if (d.name === name && d.version === version) {
                matches.push(d);
            }
        }, true);

        return matches;
    }

    getPackageByName(name: string, version?: string): IPackage<T> | null {
        const matches: IPackage<T>[] = this.getPackagesByName(name, version);

        return matches[0] ?? null;
    }

    getData(key: string): unknown;
    getData(): Readonly<IPackageJson>;
    getData(key?: string): unknown {
        if (key) return get(this._data, key);
        else return JSON.parse(JSON.stringify(this._data));
    }

    getAttachmentData(): Partial<T>;
    getAttachmentData<K extends keyof T>(key: K): T[K];
    getAttachmentData<K extends keyof T>(key?: K): T[K] | Partial<T> {
        if (key) {
            const data = this._attachmentData[key];

            if (typeof data === "undefined") {
                throw new Error(`No attachment data found for "${key.toString()}"`);
            }

            return data;
        } else {
            return structuredClone(this._attachmentData);
        }
    }

    setAttachmentData<K extends keyof T>(key: K, data: T[K]): void {
        this._attachmentData[key] = data;
    }

    collect<D>(dataFn: (pkg: IPackage<T>) => D): ICollectorNode<D, IPackage<T>> {
        const identityFn = (i: IPackage<T>) => i.fullName;
        const rootCollectorNode: ICollectorNode<D, IPackage<T>> = new CollectorNode(
            dataFn(this),
            this,
            identityFn
        );

        const visit = (
            parentCollector: ICollectorNode<D, IPackage<T>>,
            parentPkg: IPackage<T>
        ): void => {
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
