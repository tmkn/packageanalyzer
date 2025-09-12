import { describe, test, expect } from "vitest";

import { releaseAttachment } from "../../src/attachments/ReleaseAttachment.js";
import type { IPackageMetadata, IUnpublishedPackageMetadata } from "../../src/npm.js";
import { type IPackageMetaDataProvider } from "../../src/providers/provider.js";
import { createMockPackage, type IMockPackageJson } from "../mocks.js";

describe(`ReleaseAttachment Tests`, () => {
    const logStub = { logger: function () {} };

    test(`Correctly returns info`, async () => {
        const timestamp = "0";
        const version = "1.0.0";
        const provider = new (class implements IPackageMetaDataProvider {
            async getPackageMetadata(
                name: string
            ): Promise<IPackageMetadata | IUnpublishedPackageMetadata | undefined> {
                const data: Partial<IPackageMetadata> = { time: { [version]: timestamp } };

                return data as IPackageMetadata;
            }
        })();
        const extension = releaseAttachment(provider);
        const data: IMockPackageJson = { version: version };
        const p = createMockPackage(data);

        const extensionData = await extension({ p, ...logStub });

        expect(extensionData.published.toUTCString()).toEqual(new Date(timestamp).toUTCString());
    });

    test(`Throws on missing data`, async () => {
        const provider = new (class implements IPackageMetaDataProvider {
            async getPackageMetadata(
                name: string
            ): Promise<IPackageMetadata | IUnpublishedPackageMetadata | undefined> {
                return undefined;
            }
        })();
        const extension = releaseAttachment(provider);
        const p = createMockPackage({});

        await expect(extension({ p, ...logStub })).rejects.toThrow();
    });

    test(`Throws on missing version entry`, async () => {
        const provider = new (class implements IPackageMetaDataProvider {
            async getPackageMetadata(
                name: string
            ): Promise<IPackageMetadata | IUnpublishedPackageMetadata | undefined> {
                const data: Partial<IPackageMetadata> = { time: {} };

                return data as IPackageMetadata;
            }
        })();
        const extension = releaseAttachment(provider);
        const p = createMockPackage({});

        await expect(extension({ p, ...logStub })).rejects.toThrow();
    });
});
