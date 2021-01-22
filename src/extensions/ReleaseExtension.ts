import { Package } from "../analyzers/package";
import { INpmPackageProvider } from "../providers/folder";
import { IStaticDataExtension } from "./extension";

interface IReleaseData {
    published: Date;
}

const ReleaseExtensionSymbol = Symbol();

export const ReleaseExtension: IStaticDataExtension<
    IReleaseData,
    [INpmPackageProvider]
> = class ReleaseExtension {
    static get key() {
        return ReleaseExtensionSymbol;
    }

    constructor(private _provider: INpmPackageProvider) {}

    get key() {
        return ReleaseExtension.key;
    }

    async apply(p: Package): Promise<IReleaseData> {
        const info = await this._provider.getPackageInfo(p.name);

        if (!info) throw new Error(`ReleaseExtension: Couldn't get data`);

        const time = info.time;
        const released = time[p.version];

        if (!released) throw new Error(`ReleaseExtension: Couldn't get release data`);

        return {
            published: new Date(released)
        };
    }
};
