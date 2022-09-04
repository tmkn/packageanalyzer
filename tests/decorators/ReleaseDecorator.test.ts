import { Package } from "../../src";
import { ReleaseDecorator } from "../../src/extensions/decorators/ReleaseDecorator";
import { IPackageMetadata, IPackageJson, IUnpublishedPackageMetadata } from "../../src/npm";
import { IPackageMetaDataProvider } from "../../src/providers/provider";
import { createMockPackage } from "../common";

describe(`ReleaseDecorator Tests`, () => {
    const logStub = {
        logger: function () {}
    };

    test(`Correctly returns info`, async () => {
        const timestamp = "0";
        const version = "1.0.0";
        const provider = new (class implements IPackageMetaDataProvider {
            async getPackageMetadata(
                name: string
            ): Promise<IPackageMetadata | IUnpublishedPackageMetadata | undefined> {
                const data: Partial<IPackageMetadata> = {
                    time: {
                        [version]: timestamp
                    }
                };

                return data as IPackageMetadata;
            }
        })();
        const extension = new ReleaseDecorator(provider);
        const data: Partial<IPackageJson> = {
            version: version
        };
        const p = createMockPackage(data);

        const extensionData = await extension.apply({ p, ...logStub });

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
        const extension = new ReleaseDecorator(provider);
        const p = createMockPackage();

        await expect(extension.apply({ p, ...logStub })).rejects.toThrowError();
    });

    test(`Throws on missing version entry`, async () => {
        const provider = new (class implements IPackageMetaDataProvider {
            async getPackageMetadata(
                name: string
            ): Promise<IPackageMetadata | IUnpublishedPackageMetadata | undefined> {
                const data: Partial<IPackageMetadata> = {
                    time: {}
                };

                return data as IPackageMetadata;
            }
        })();
        const extension = new ReleaseDecorator(provider);
        const p = createMockPackage();

        await expect(extension.apply({ p, ...logStub })).rejects.toThrowError();
    });
});
