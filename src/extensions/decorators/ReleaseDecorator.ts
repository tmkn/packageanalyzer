import { IPackageMetaDataProvider } from "../../providers/provider";
import { IApplyArgs, IDecorator } from "./Decorator";

interface IReleaseData {
    published: Date;
}

export class ReleaseDecorator implements IDecorator<"releaseinfo", IReleaseData> {
    constructor(private _provider: IPackageMetaDataProvider) {}

    readonly name: string = `ReleaseDecorator`;
    readonly key = "releaseinfo";

    async apply({ p }: IApplyArgs): Promise<IReleaseData> {
        const info = await this._provider.getPackageMetadata(p.name);

        if (!info) throw new Error(`${this.name}: Couldn't get data`);

        const time = info.time;
        const released = time[p.version];

        if (!released) throw new Error(`${this.name}: Couldn't get release data`);

        return {
            published: new Date(released)
        };
    }
}
