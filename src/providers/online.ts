import { type IPackageMetadata, type IUnpublishedPackageMetadata } from "../npm.js";
import type { Url } from "../reports/Validation.js";
import { downloadJson } from "../utils/requests.js";
import { AbstractPackageProvider } from "./provider.js";

//loads npm data from the web
export class OnlinePackageProvider extends AbstractPackageProvider {
    constructor(private _url: Url) {
        super();
    }

    async getPackageMetadata(
        name: string
    ): Promise<IPackageMetadata | IUnpublishedPackageMetadata | undefined> {
        const cachedInfo = this._cache.get(name);

        if (typeof cachedInfo !== "undefined") {
            return cachedInfo;
        } else {
            const data = await downloadJson<IPackageMetadata>(
                `${this._url}/${encodeURIComponent(name)}`
            );

            return data ?? undefined;
        }
    }
}

export const npmOnline = new OnlinePackageProvider(`https://registry.npmjs.com`);
