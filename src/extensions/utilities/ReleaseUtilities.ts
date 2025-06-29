import { type AttachmentData } from "../../attachments/Attachments.js";
import { type IPackage } from "../../package/package.js";
import { ReleaseAttachment } from "../../attachments/ReleaseAttachment.js";

export class ReleaseUtilities {
    constructor(private _p: IPackage<AttachmentData<ReleaseAttachment>>) {}

    get publishDate(): Date | undefined {
        return this._getPublishDate(this._p);
    }

    get newestPackage(): IPackage<AttachmentData<ReleaseAttachment>> | undefined {
        return this._getNewestPackage(this._p);
    }

    get oldestPackage(): IPackage<AttachmentData<ReleaseAttachment>> | undefined {
        return this._getOldestPackage(this._p);
    }

    private _getPublishDate(p: IPackage<AttachmentData<ReleaseAttachment>>): Date | undefined {
        try {
            const data = p.getAttachmentData("releaseinfo");

            if (typeof data === "undefined") throw new Error();

            return data.published;
        } catch {
            return undefined;
        }
    }

    private _getNewestPackage(
        p: IPackage<AttachmentData<ReleaseAttachment>>
    ): IPackage<AttachmentData<ReleaseAttachment>> | undefined {
        let newestPackage = p;

        p.visit(d => {
            const newestPublishDate = this._getPublishDate(newestPackage);
            const currentPublishDate = this._getPublishDate(d);

            if (currentPublishDate) {
                if (newestPublishDate) {
                    if (currentPublishDate > newestPublishDate) newestPackage = d;
                } else {
                    newestPackage = d;
                }
            }
        }, false);

        return this._getPublishDate(newestPackage) ? newestPackage : undefined;
    }

    private _getOldestPackage(
        p: IPackage<AttachmentData<ReleaseAttachment>>
    ): IPackage<AttachmentData<ReleaseAttachment>> | undefined {
        let oldestPackage = p;

        p.visit(d => {
            const oldestPublishDate = this._getPublishDate(oldestPackage);
            const currentPublishDate = this._getPublishDate(d);

            if (currentPublishDate) {
                if (oldestPublishDate) {
                    if (currentPublishDate < oldestPublishDate) oldestPackage = d;
                } else {
                    oldestPackage = d;
                }
            }
        }, false);

        return this._getPublishDate(oldestPackage) ? oldestPackage : undefined;
    }
}
