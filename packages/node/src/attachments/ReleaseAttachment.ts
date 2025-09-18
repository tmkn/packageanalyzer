import type { IPackageMetaDataProvider } from "../../../shared/src/providers/provider.js";
import type { AttachmentFn, IApplyArgs } from "../../../shared/src/attachments/Attachments.js";

export interface IReleaseData {
    published: Date;
}

export function releaseAttachment(provider: IPackageMetaDataProvider): AttachmentFn<IReleaseData> {
    const name: string = `ReleaseAttachment`;

    return async function ({ p }: IApplyArgs): Promise<IReleaseData> {
        const info = await provider.getPackageMetadata(p.name);

        if (!info) throw new Error(`${name}: Couldn't get data`);

        const time = info.time;
        const released = time[p.version];

        if (!released) throw new Error(`${name}: Couldn't get release data`);

        return {
            published: new Date(released)
        };
    };
}
