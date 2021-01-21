import { Package } from "../analyzers/package";

//add more data to Package
export interface IStaticDataExtension<T, CArgs extends []> {
    new (...args: CArgs): IDataExtension<T>;
    readonly key: Symbol;
    getData: (p: Package) => Promise<T>;
}

export interface IDataExtension<T> {
    readonly key: Symbol;
    apply: (p: Package) => Promise<T>;
}

export type ExtensionData<T> = T extends IStaticDataExtension<infer U, any> ? U : never;
