"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const online_1 = require("../src/providers/online");
const visitor_1 = require("../src/visitors/visitor");
const logger_1 = require("../src/utils/logger");
const server_1 = require("./server");
const ReleaseDecorator_1 = require("../src/extensions/decorators/ReleaseDecorator");
const ReleaseUtilities_1 = require("../src/extensions/utilities/ReleaseUtilities");
describe(`OnlineProvider Tests`, () => {
    let server;
    let provider;
    beforeAll(async () => {
        server = await (0, server_1.createMockNpmServer)();
        provider = new online_1.OnlinePackageProvider(`http://localhost:${server.port}`);
    });
    test(`resolveFromName with name and version`, async () => {
        const visitor = new visitor_1.Visitor(["react", "16.8.1"], provider, new logger_1.OraLogger());
        const p = await visitor.visit();
        expect(p.name).toBe("react");
        expect(p.version).toBe("16.8.1");
    });
    test(`resolveFromName with name`, async () => {
        const visitor = new visitor_1.Visitor(["react"], provider, new logger_1.OraLogger());
        const p = await visitor.visit();
        expect(p.name).toBe("react");
        expect(p.version).toBe("16.8.6");
    });
    test(`Check oldest package`, async () => {
        const visitor = new visitor_1.Visitor(["react", "16.8.1"], provider, new logger_1.OraLogger(), [
            new ReleaseDecorator_1.ReleaseDecorator(provider)
        ]);
        const p = await visitor.visit();
        const { oldest: oldestPackage } = new ReleaseUtilities_1.ReleaseUtilities(p);
        expect.assertions(1);
        if (oldestPackage) {
            expect(oldestPackage.name).toBe("object-assign");
        }
    });
    test(`Check newest package`, async () => {
        const visitor = new visitor_1.Visitor(["react", "16.8.1"], provider, new logger_1.OraLogger(), [
            new ReleaseDecorator_1.ReleaseDecorator(provider)
        ]);
        const p = await visitor.visit();
        const { newest: newestPackage } = new ReleaseUtilities_1.ReleaseUtilities(p);
        expect.assertions(1);
        if (newestPackage) {
            expect(newestPackage.name).toBe("scheduler");
        }
    });
    test(`Should throw on unpublished`, async () => {
        expect.assertions(1);
        try {
            await provider.getPackageJson("unpublished");
        }
        catch (e) {
            expect(e).toBeInstanceOf(Error);
        }
    });
    test(`Should throw on missing package.json for specific version`, async () => {
        expect.assertions(1);
        try {
            await provider.getPackageJson("undefined-version", "5.0.0");
        }
        catch (e) {
            expect(e).toBeInstanceOf(Error);
        }
    });
    afterAll(() => server.close());
});
//# sourceMappingURL=onlineProvider.test.js.map