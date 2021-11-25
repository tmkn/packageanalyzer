import { Package } from "../../package/package";
export declare class ReleaseUtilities {
    private _p;
    constructor(_p: Package);
    get published(): Date | undefined;
    get newest(): Package | undefined;
    get oldest(): Package | undefined;
    private _getPublished;
    private _getNewest;
    private _getOldest;
}
//# sourceMappingURL=ReleaseUtilities.d.ts.map