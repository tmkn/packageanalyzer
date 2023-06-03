import { IPackage } from "../../package/package";

//add custom data to each Package during lookup

export interface IApplyArgs {
    p: IPackage;
    logger: (msg: string) => void;
}

export interface IDecorator<K extends string, T> {
    readonly key: K;
    readonly name: string;
    apply: (args: IApplyArgs) => Promise<T>;
}

export type DecoratorData<T> = T extends IDecorator<any, infer D> ? D : never;

export type DecoratorKey<T> = T extends IDecorator<infer K, any> ? K : never;
