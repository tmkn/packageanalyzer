import { IPackageMetadata, IUnpublishedPackageMetadata } from "../npm";
import { downloadJson, Url } from "../utils/requests";
import { AbstractPackageProvider } from "./provider";

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

            return data === null ? undefined : data;
        }
    }
}

export const npmOnline = new OnlinePackageProvider(`https://registry.npmjs.com`);
