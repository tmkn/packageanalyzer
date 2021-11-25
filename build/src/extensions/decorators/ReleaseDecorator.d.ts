import { IPackageMetaDataProvider } from "../../providers/provider";
import { IApplyArgs, IDecorator } from "./Decorator";
interface IReleaseData {
    published: Date;
}
export declare class ReleaseDecorator implements IDecorator<"releaseinfo", IReleaseData> {
    private _provider;
    constructor(_provider: IPackageMetaDataProvider);
    readonly name: string;
    readonly key = "releaseinfo";
    apply({ p }: IApplyArgs): Promise<IReleaseData>;
}
export {};
//# sourceMappingURL=ReleaseDecorator.d.ts.map