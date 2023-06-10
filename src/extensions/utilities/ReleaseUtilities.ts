import { IPackage } from "../../package/package";
import { ReleaseDecorator } from "../decorators/ReleaseDecorator";

export class ReleaseUtilities {
    constructor(private _p: IPackage<[ReleaseDecorator]>) {}

    get published(): Date | undefined {
        return this._getPublished(this._p);
    }

    get newest(): IPackage<[ReleaseDecorator]> | undefined {
        return this._getNewest(this._p);
    }

    get oldest(): IPackage<[ReleaseDecorator]> | undefined {
        return this._getOldest(this._p);
    }

    private _getPublished(p: IPackage<[ReleaseDecorator]>): Date | undefined {
        try {
            const data = p.getDecoratorData("releaseinfo");

            if (typeof data === "undefined") throw new Error();

            return data.published;
        } catch {
            return undefined;
        }
    }

    private _getNewest(p: IPackage<[ReleaseDecorator]>): IPackage<[ReleaseDecorator]> | undefined {
        let newest: IPackage<[ReleaseDecorator]> | undefined = undefined;
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

    private _getOldest(p: IPackage<[ReleaseDecorator]>): IPackage<[ReleaseDecorator]> | undefined {
        let oldest: IPackage<[ReleaseDecorator]> | undefined = undefined;
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
