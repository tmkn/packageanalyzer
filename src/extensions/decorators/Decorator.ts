import { IPackage } from "../../package/package";

type SimplePackage = Pick<IPackage, "name" | "version" | "fullName" | "getData">;

//add custom data to each Package during lookup

export interface IApplyArgs {
    p: SimplePackage;
    logger: (msg: string) => void;
}

export interface IDecorator<K extends string, T> {
    readonly key: K;
    readonly name: string;
    apply: (args: IApplyArgs) => Promise<T>;
}

export type Decorators = IDecorator<string, unknown>[];

// creates a record of decorator keys with their corresponding data types
// export type DecoratorRecord<T extends Decorators> = T extends []
//     ? {}
//     : {
//           [K in T[number]["key"]]: ReturnType<
//               Extract<T[number], { key: K }>["apply"]
//           > extends Promise<infer V>
//               ? V
//               : never;
//       };

type DecoratorValue<T> = T extends IDecorator<infer K, infer D> ? D : void;

type DecoratorRecord<T extends Array<IDecorator<string, any>>> = T extends Array<
    IDecorator<infer K, infer D>
>
    ? { [key in K]: DecoratorValue<Extract<T[number], IDecorator<key, any>>> }
    : void;

type Coerce<T> = T extends Record<string, never> ? {} : T;

export type DecoratorData<T extends Array<IDecorator<string, any>>> = Coerce<DecoratorRecord<T>>;
