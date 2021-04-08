import { Package } from "../../package/package";

//add custom data to each Package during lookup
export interface IDecoratorStatic<T, CArgs extends any[]> {
    new (...args: CArgs): IDecorator<T>;
    readonly key: Symbol;
}

export interface IApplyArgs {
    p: Package;
}

export interface IDecorator<T> {
    readonly key: Symbol;
    readonly name: string;
    apply: (args: IApplyArgs) => Promise<T>;
}

export type DecoratorType<T> = T extends IDecoratorStatic<infer U, any> ? U : never;
