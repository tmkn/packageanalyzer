import { Package } from "../analyzers/package";
import { ReleaseExtension } from "../extensions/ReleaseExtension";
import { IAnalysis } from "./analysis";

interface IReleaseData {
    published?: Date;
    newest?: Package;
    oldest?: Package;
}

export class ReleaseAnalysis implements IAnalysis<IReleaseData> {
    async apply(p: Package): Promise<IReleaseData> {
        return {
            published: this._getPublished(p),
            newest: this._getNewest(p),
            oldest: this._getOldest(p)
        };
    }

    private _getPublished(p: Package): Date | undefined {
        try {
            const { published } = p.getExtensionData(ReleaseExtension);

            return published;
        } catch {
            return undefined;
        }
    }

    private _getNewest(p: Package): Package | undefined {
        let newest: Package | undefined = undefined;
        const published = this._getPublished(p);

        if (published) newest = p;

        p.visit(d => {
            const dPublished = this._getPublished(d);

            if (newest) {
                const newestPublished = this._getPublished(newest);

                if (dPublished && newestPublished) {
                    if (dPublished > newestPublished) newest = d;
                }
            } else {
                if (dPublished) newest = d;
            }
        }, false);

        return newest;
    }

    private _getOldest(p: Package): Package | undefined {
        let oldest: Package | undefined = undefined;
        const published = this._getPublished(p);

        if (published) oldest = p;

        p.visit(d => {
            const dPublished = this._getPublished(d);

            if (oldest) {
                const oldestPublished = this._getPublished(oldest);

                if (dPublished && oldestPublished) {
                    if (dPublished < oldestPublished) oldest = d;
                }
            } else {
                if (dPublished) oldest = d;
            }
        }, false);

        return oldest;
    }
}
