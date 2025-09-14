import { type IPackage } from "../../../../shared/src/package/package.js";
import { type IReleaseData } from "../../attachments/ReleaseAttachment.js";

type ReleaseAttachments = {
    releaseinfo: IReleaseData;
};

type ReleasePackage = IPackage<ReleaseAttachments>;

export class ReleaseUtilities {
    constructor(private readonly _p: ReleasePackage) {}

    get publishDate(): Date | undefined {
        return this._getPublishDate(this._p);
    }

    get newestPackage(): ReleasePackage | undefined {
        return this._getNewestPackage(this._p);
    }

    get oldestPackage(): ReleasePackage | undefined {
        return this._getOldestPackage(this._p);
    }

    private _getPublishDate(p: ReleasePackage): Date | undefined {
        try {
            const data = p.getAttachmentData("releaseinfo");

            if (typeof data === "undefined") throw new Error();

            return data.published;
        } catch {
            return undefined;
        }
    }

    private _getNewestPackage(p: ReleasePackage): ReleasePackage | undefined {
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

    private _getOldestPackage(p: ReleasePackage): ReleasePackage | undefined {
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
