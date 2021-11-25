import { Package } from "../../package/package";
export interface IApplyArgs {
    p: Package;
    logger: (msg: string) => void;
}
export interface IDecorator<K extends string, T> {
    readonly key: K;
    readonly name: string;
    apply: (args: IApplyArgs) => Promise<T>;
}
export declare type DecoratorData<T> = T extends IDecorator<any, infer D> ? D : never;
export declare type DecoratorKey<T> = T extends IDecorator<infer K, any> ? K : never;
//# sourceMappingURL=Decorator.d.ts.map