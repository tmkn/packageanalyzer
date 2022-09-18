import { IPackageMetaDataProvider, PackageMetaData } from "../../providers/provider";
import { IApplyArgs, IDecorator } from "./Decorator";

interface IMetaFileData {
    metaFile: PackageMetaData;
}

export class MetaFileDecorator implements IDecorator<"metafile", IMetaFileData> {
    constructor(private _provider: IPackageMetaDataProvider) {}

    readonly name: string = `ReleaseDecorator`;
    readonly key = "metafile";

    async apply({ p }: IApplyArgs): Promise<IMetaFileData> {
        const data = await this._provider.getPackageMetadata(p.name);

        if (!data) throw new Error(`${this.name}: Couldn't get metafile for ${p.name}`);

        return {
            metaFile: data
        };
    }
}
