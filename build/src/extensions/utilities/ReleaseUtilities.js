"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReleaseUtilities = void 0;
class ReleaseUtilities {
    constructor(_p) {
        this._p = _p;
    }
    get published() {
        return this._getPublished(this._p);
    }
    get newest() {
        return this._getNewest(this._p);
    }
    get oldest() {
        return this._getOldest(this._p);
    }
    _getPublished(p) {
        try {
            const data = p.getDecoratorData("releaseinfo");
            if (typeof data === "undefined")
                throw new Error();
            return data.published;
        }
        catch {
            return undefined;
        }
    }
    _getNewest(p) {
        let newest = undefined;
        const published = this._getPublished(p);
        if (published)
            newest = p;
        p.visit(d => {
            const dPublished = this._getPublished(d);
            if (newest) {
                const newestPublished = this._getPublished(newest);
                if (dPublished && newestPublished) {
                    if (dPublished > newestPublished)
                        newest = d;
                }
            }
            else {
                if (dPublished)
                    newest = d;
            }
        }, false);
        return newest;
    }
    _getOldest(p) {
        let oldest = undefined;
        const published = this._getPublished(p);
        if (published)
            oldest = p;
        p.visit(d => {
            const dPublished = this._getPublished(d);
            if (oldest) {
                const oldestPublished = this._getPublished(oldest);
                if (dPublished && oldestPublished) {
                    if (dPublished < oldestPublished)
                        oldest = d;
                }
            }
            else {
                if (dPublished)
                    oldest = d;
            }
        }, false);
        return oldest;
    }
}
exports.ReleaseUtilities = ReleaseUtilities;
//# sourceMappingURL=ReleaseUtilities.js.map