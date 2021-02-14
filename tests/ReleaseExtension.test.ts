import { Package } from "../src";
import { ReleaseDecorator } from "../src/extensions/decorators/ReleaseDecorator";
import { INpmPackage, INpmPackageVersion, IUnpublishedNpmPackage } from "../src/npm";
import { INpmPackageProvider } from "../src/providers/folder";

describe(`ReleaseExtension Tests`, () => {
    test(`Correctly returns info`, async () => {
        const timestamp = "0";
        const version = "1.0.0";
        const provider = new (class implements INpmPackageProvider {
            async getPackageInfo(
                name: string
            ): Promise<INpmPackage | IUnpublishedNpmPackage | undefined> {
                const data: Partial<INpmPackage> = {
                    time: {
                        [version]: timestamp
                    }
                };

                return data as INpmPackage;
            }
        })();
        const extension = new ReleaseDecorator(provider);
        const data: Partial<INpmPackageVersion> = {
            name: "foo",
            version: version
        };
        const p = new Package(data as INpmPackageVersion);

        const extensionData = await extension.apply(p);

        expect(extensionData.published.toUTCString()).toEqual(new Date(timestamp).toUTCString());
    });

    test(`Throws on missing data`, async () => {
        const provider = new (class implements INpmPackageProvider {
            async getPackageInfo(
                name: string
            ): Promise<INpmPackage | IUnpublishedNpmPackage | undefined> {
                return undefined;
            }
        })();
        const extension = new ReleaseDecorator(provider);
        const data: Partial<INpmPackageVersion> = {
            name: "foo",
            version: "1.0.0"
        };
        const p = new Package(data as INpmPackageVersion);

        await expect(extension.apply(p)).rejects.toThrowError();
    });

    test(`Throws on missing version entry`, async () => {
        const provider = new (class implements INpmPackageProvider {
            async getPackageInfo(
                name: string
            ): Promise<INpmPackage | IUnpublishedNpmPackage | undefined> {
                const data: Partial<INpmPackage> = {
                    time: {}
                };

                return data as INpmPackage;
            }
        })();
        const extension = new ReleaseDecorator(provider);
        const data: Partial<INpmPackageVersion> = {
            name: "foo",
            version: "1.0.0"
        };
        const p = new Package(data as INpmPackageVersion);

        await expect(extension.apply(p)).rejects.toThrowError();
    });
});
