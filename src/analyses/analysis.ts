import { Package } from "../analyzers/package";

export interface IAnalysis<T> {
    apply: (p: Package) => Promise<T>;
}
