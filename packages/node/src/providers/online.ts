import { QueryClient } from "@tanstack/query-core";

import {
    type IPackageMetadata,
    type IUnpublishedPackageMetadata
} from "../../../shared/src/npm.js";
import type { Url } from "../../../shared/src/reports/Validation.js";
import { AbstractPackageProvider } from "../../../shared/src/providers/provider.js";
import { downloadJson } from "../utils/requests.js";

//loads npm data from the web
export class OnlinePackageProvider extends AbstractPackageProvider {
    private readonly _queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                retry: 3,
                retryDelay: 0, // with the default, the tests ran into timeouts, no delay yolo
                staleTime: Infinity // not really useful right now as caching is done via _cache
            }
        }
    });

    constructor(private readonly _url: Url) {
        super();
    }

    async getPackageMetadata(
        name: string
    ): Promise<IPackageMetadata | IUnpublishedPackageMetadata | undefined> {
        const cachedInfo = this._cache.get(name);

        if (typeof cachedInfo !== "undefined") {
            return cachedInfo;
        } else {
            const packageMetadata = await this._queryClient.fetchQuery({
                queryKey: ["package", name],
                queryFn: async ({ signal }) => {
                    const response = await downloadJson<
                        IPackageMetadata | IUnpublishedPackageMetadata
                    >(`${this._url}/${encodeURIComponent(name)}`, { signal });

                    if (response === null) {
                        console.error(
                            `Failed to fetch package metadata for "${name}" from ${this._url}, RETRYING...`
                        );
                        throw new Error(
                            `Failed to fetch package metadata for "${name}" from ${this._url}`
                        );
                    }

                    return response;
                }
            });

            return packageMetadata;
        }
    }
}

export const npmOnline = new OnlinePackageProvider(`https://registry.npmjs.com`);
