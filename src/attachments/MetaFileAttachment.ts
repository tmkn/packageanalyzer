import { IPackageMetaDataProvider, PackageMetaData } from "../providers/provider";
import { IApplyArgs, IAttachment } from "./Attachments";

interface IMetaFileData {
    metaFile: PackageMetaData;
}

export class MetaFileAttachment implements IAttachment<"metafile", IMetaFileData> {
    constructor(private _provider: IPackageMetaDataProvider) {}

    readonly name: string = `ReleaseAttachment`;
    readonly key = "metafile";

    async apply({ p }: IApplyArgs): Promise<IMetaFileData> {
        const data = await this._provider.getPackageMetadata(p.name);

        if (!data) throw new Error(`${this.name}: Couldn't get metafile for ${p.name}`);

        return {
            metaFile: data
        };
    }
}
