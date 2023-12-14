import { IPackageMetaDataProvider, PackageMetaData } from "../providers/provider";
import { IApplyArgs, IAttachment } from "./Attachments";

interface IReleaseData {
    published: Date;
}

export class ReleaseAttachment implements IAttachment<"releaseinfo", IReleaseData> {
    constructor(private _provider: IPackageMetaDataProvider) {}

    readonly name: string = `ReleaseAttachment`;
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
