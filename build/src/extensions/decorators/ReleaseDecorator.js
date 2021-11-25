"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReleaseDecorator = void 0;
class ReleaseDecorator {
    constructor(_provider) {
        this._provider = _provider;
        this.name = `ReleaseDecorator`;
        this.key = "releaseinfo";
    }
    async apply({ p }) {
        const info = await this._provider.getPackageMetadata(p.name);
        if (!info)
            throw new Error(`${this.name}: Couldn't get data`);
        const time = info.time;
        const released = time[p.version];
        if (!released)
            throw new Error(`${this.name}: Couldn't get release data`);
        return {
            published: new Date(released)
        };
    }
}
exports.ReleaseDecorator = ReleaseDecorator;
//# sourceMappingURL=ReleaseDecorator.js.map