import { Package } from "../../package/package";
import { IFormatter } from "../../utils/formatter";
export declare function printDependencyTree(p: Package, formatter: IFormatter): void;
export declare class LoopUtilities {
    private _p;
    constructor(_p: Package);
    get loopPathString(): string;
    get loops(): Package[];
    get loopPathMap(): ReadonlyMap<string, Set<string>>;
    get distinctLoopCount(): number;
}
//# sourceMappingURL=LoopUtilities.d.ts.map