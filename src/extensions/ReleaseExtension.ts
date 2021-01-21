import { Package } from "../analyzers/package";
import { IStaticDataExtension } from "./extension";

interface IReleaseData {
    published: number;
}

const ReleaseExtensionSymbol = Symbol();

export const ReleaseExtension: IStaticDataExtension<IReleaseData, []> = class ReleaseExtension {
    static get key() {
        return ReleaseExtensionSymbol;
    }

    static getData(): Promise<IReleaseData> {
        throw new Error(`Not Implemented`);
    }

    constructor() {}

    get key() {
        return ReleaseExtension.key;
    }

    apply(p: Package): Promise<IReleaseData> {
        throw new Error(`Not Implemented`);
    }
};
