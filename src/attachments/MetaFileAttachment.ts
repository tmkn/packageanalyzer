import type { IPackageMetaDataProvider, PackageMetaData } from "../providers/provider.js";
import { classToAttachmentFn, type IApplyArgs, type IClassAttachment } from "./Attachments.js";

interface IMetaFileData {
    metaFile: PackageMetaData;
}

class MetaFileAttachment implements IClassAttachment<IMetaFileData> {
    constructor(private readonly _provider: IPackageMetaDataProvider) {}

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

export const createMetaFileAttachment = classToAttachmentFn(MetaFileAttachment);

export type MetaFileAttachmentFn = ReturnType<typeof createMetaFileAttachment>;
