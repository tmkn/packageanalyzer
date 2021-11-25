import { IFormatter } from "./formatter";
export interface ITreeFormatter<T> {
    getLabel(data: T): string | string[];
    getChildren(data: T): T[];
}
export declare function print<T>(node: T, converter: ITreeFormatter<T>, formatter: IFormatter): void;
//# sourceMappingURL=tree.d.ts.map