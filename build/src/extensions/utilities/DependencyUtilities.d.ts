import { Package } from "../../package/package";
declare type Name = string;
declare type Version = string;
export declare type VersionSummary = Map<Name, Set<Version>>;
export interface IMostReferred {
    pkgs: string[];
    count: number;
}
declare class BaseDependencyUtilities {
    private _p;
    private _includeSelf;
    constructor(_p: Package, _includeSelf: boolean);
    get transitiveCount(): number;
    get distinctNameCount(): number;
    get distinctVersionCount(): number;
    get distinctNames(): Set<Name>;
    get mostReferred(): IMostReferred;
    get mostDirectDependencies(): Package[];
    get mostVersions(): VersionSummary;
    get all(): Package[];
    get group(): Map<Name, Map<Version, Package>>;
}
export declare class DependencyUtilities extends BaseDependencyUtilities {
    withSelf: BaseDependencyUtilities;
    constructor(_p: Package, _includeSelf?: boolean);
}
export {};
//# sourceMappingURL=DependencyUtilities.d.ts.map