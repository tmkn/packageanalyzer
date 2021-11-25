"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const update_1 = require("../src/utils/update");
const online_1 = require("../src/providers/online");
const server_1 = require("./server");
describe(`Update Tests`, () => {
    let server;
    let provider;
    beforeAll(async () => {
        server = await (0, server_1.createMockNpmServer)();
        provider = new online_1.OnlinePackageProvider(`http://localhost:${server.port}`);
    });
    afterAll(() => server.close());
    test(`Clean semantic version strings`, () => {
        const baseVersion = `1.2.3`;
        const normal = (0, update_1.cleanVersion)(baseVersion);
        const bugfix = (0, update_1.cleanVersion)(`~${baseVersion}`);
        const minor = (0, update_1.cleanVersion)(`^${baseVersion}`);
        expect(normal).toMatch(baseVersion);
        expect(bugfix).toMatch(baseVersion);
        expect(minor).toMatch(baseVersion);
    });
    test(`Should throw for invalid version strings`, () => {
        expect.assertions(1);
        try {
            (0, update_1.cleanVersion)(`adf`);
        }
        catch (e) {
            expect(e).toBeInstanceOf(Error);
        }
    });
    test(`Should throw on unknown package`, async () => {
        expect.assertions(1);
        try {
            await (0, update_1.updateCheck)("doesntexist", "16.8.0", provider);
        }
        catch (e) {
            expect(e).toBeInstanceOf(Error);
        }
    });
    test(`Should throw on unknown version`, async () => {
        expect.assertions(1);
        try {
            await (0, update_1.updateCheck)("react", "169.8.0", provider);
        }
        catch (e) {
            expect(e).toBeInstanceOf(Error);
        }
    });
    test(`Should throw on missing release data`, async () => {
        expect.assertions(1);
        try {
            await (0, update_1.updateCheck)("missingdates", "16.8.0", provider);
        }
        catch (e) {
            expect(e).toBeInstanceOf(Error);
        }
    });
    test(`Correctly creates bugfix version string`, () => {
        const baseVersion = `1.2.3`;
        const normal = (0, update_1.getBugfixVersionString)(baseVersion);
        const bugfix = (0, update_1.getBugfixVersionString)(`~${baseVersion}`);
        const minor = (0, update_1.getBugfixVersionString)(`^${baseVersion}`);
        expect(normal).toMatch(`~${baseVersion}`);
        expect(bugfix).toMatch(`~${baseVersion}`);
        expect(minor).toMatch(`~${baseVersion}`);
    });
    test(`Correctly creates minor version string`, () => {
        const baseVersion = `1.2.3`;
        const normal = (0, update_1.getMinorVersionString)(baseVersion);
        const bugfix = (0, update_1.getMinorVersionString)(`~${baseVersion}`);
        const minor = (0, update_1.getMinorVersionString)(`^${baseVersion}`);
        expect(normal).toMatch(`^${baseVersion}`);
        expect(bugfix).toMatch(`^${baseVersion}`);
        expect(minor).toMatch(`^${baseVersion}`);
    });
    test(`Correctly finds basic version update`, async () => {
        const { version } = await (0, update_1.updateCheck)("react", "16.8.0", provider);
        expect(version).toMatch(`16.8.0`);
    });
    test(`Correctly finds bugifx version update`, async () => {
        const { version } = await (0, update_1.updateCheck)("react", "~16.8.0", provider);
        expect(version).toMatch(`16.8.6`);
    });
    test(`Correctly finds minor version update`, async () => {
        const { version } = await (0, update_1.updateCheck)("react", "^16.0.0", provider);
        expect(version).toMatch(`16.8.6`);
    });
    test(`Correctly calculates update info`, async () => {
        const info = await (0, update_1.updateInfo)("react", "^15.5.0", provider);
        expect(info.version).toMatch(`^15.5.0`);
        expect(info.latestOverall.version).toMatch(`16.8.6`);
        expect(info.latestSemanticMatch.version).toMatch(`15.6.2`);
        expect(info.latestBugfix.version).toMatch(`15.5.4`);
        expect(info.latestMinor.version).toMatch(`15.6.2`);
    });
});
//# sourceMappingURL=update.test.js.map