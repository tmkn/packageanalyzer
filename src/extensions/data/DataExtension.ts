import { Package } from "../../analyzers/package";

//add custom data to each Package during lookup
export interface IDataExtensionStatic<T, CArgs extends any[]> {
    new (...args: CArgs): IDataExtension<T>;
    readonly key: Symbol;
}

export interface IDataExtension<T> {
    readonly key: Symbol;
    apply: (p: Package) => Promise<T>;
}

export type DataExtensionType<T> = T extends IDataExtensionStatic<infer U, any> ? U : never;
