import { Package } from "../../analyzers/package";

//add custom data to each Package during lookup
export interface IDecoratorStatic<T, CArgs extends any[]> {
    new (...args: CArgs): IDecorator<T>;
    readonly key: Symbol;
}

export interface IDecorator<T> {
    readonly key: Symbol;
    readonly name: string;
    apply: (p: Package) => Promise<T>;
}

export type DecoratorType<T> = T extends IDecoratorStatic<infer U, any> ? U : never;
