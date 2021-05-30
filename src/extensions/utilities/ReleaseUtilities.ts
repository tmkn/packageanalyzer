import { Package } from "../../package/package";
import { ReleaseDecorator } from "../decorators/ReleaseDecorator";

export class ReleaseUtilities {
    constructor(private _p: Package) {}

    get published(): Date | undefined {
        return this._getPublished(this._p);
    }

    get newest(): Package | undefined {
        return this._getNewest(this._p);
    }

    get oldest(): Package | undefined {
        return this._getOldest(this._p);
    }

    private _getPublished(p: Package): Date | undefined {
        try {
            const data = p.getDecoratorData<ReleaseDecorator>("releaseinfo");

            if (typeof data === "undefined") throw new Error();

            return data.published;
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
