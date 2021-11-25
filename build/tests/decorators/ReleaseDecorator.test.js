"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const src_1 = require("../../src");
const ReleaseDecorator_1 = require("../../src/extensions/decorators/ReleaseDecorator");
describe(`ReleaseDecorator Tests`, () => {
    const logStub = {
        logger: function () { }
    };
    test(`Correctly returns info`, async () => {
        const timestamp = "0";
        const version = "1.0.0";
        const provider = new (class {
            async getPackageMetadata(name) {
                const data = {
                    time: {
                        [version]: timestamp
                    }
                };
                return data;
            }
        })();
        const extension = new ReleaseDecorator_1.ReleaseDecorator(provider);
        const data = {
            name: "foo",
            version: version
        };
        const p = new src_1.Package(data);
        const extensionData = await extension.apply({ p, ...logStub });
        expect(extensionData.published.toUTCString()).toEqual(new Date(timestamp).toUTCString());
    });
    test(`Throws on missing data`, async () => {
        const provider = new (class {
            async getPackageMetadata(name) {
                return undefined;
            }
        })();
        const extension = new ReleaseDecorator_1.ReleaseDecorator(provider);
        const data = {
            name: "foo",
            version: "1.0.0"
        };
        const p = new src_1.Package(data);
        await expect(extension.apply({ p, ...logStub })).rejects.toThrowError();
    });
    test(`Throws on missing version entry`, async () => {
        const provider = new (class {
            async getPackageMetadata(name) {
                const data = {
                    time: {}
                };
                return data;
            }
        })();
        const extension = new ReleaseDecorator_1.ReleaseDecorator(provider);
        const data = {
            name: "foo",
            version: "1.0.0"
        };
        const p = new src_1.Package(data);
        await expect(extension.apply({ p, ...logStub })).rejects.toThrowError();
    });
});
//# sourceMappingURL=ReleaseDecorator.test.js.map