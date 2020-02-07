import {
    cleanVersion,
    getBugfixVersionString,
    getMinorVersionString,
    updateCheck,
    updateInfo
} from "../src/analyzers/update";
import { OnlinePackageProvider } from "../src/providers/online";
import { MockNpmServer } from "./server";

describe(`Update Tests`, () => {
    let server: MockNpmServer;
    let provider: OnlinePackageProvider;
    const port = 3002;

    beforeAll(() => {
        provider = new OnlinePackageProvider(`http://localhost:${port}`);
        server = new MockNpmServer(port);
    });

    afterAll(() => {
        server.close();
    });

    test(`Clean semantic version strings`, () => {
        const baseVersion = `1.2.3`;

        const normal = cleanVersion(baseVersion);
        const bugfix = cleanVersion(`~${baseVersion}`);
        const minor = cleanVersion(`^${baseVersion}`);

        expect(normal).toMatch(baseVersion);
        expect(bugfix).toMatch(baseVersion);
        expect(minor).toMatch(baseVersion);
    });

    test(`Should throw for invalid version strings`, () => {
        expect.assertions(1);

        try {
            cleanVersion(`adf`);
        } catch (e) {
            expect(e).toBeInstanceOf(Error);
        }
    });

    test(`Correctly creates bugfix version string`, () => {
        const baseVersion = `1.2.3`;

        const normal = getBugfixVersionString(baseVersion);
        const bugfix = getBugfixVersionString(`~${baseVersion}`);
        const minor = getBugfixVersionString(`^${baseVersion}`);

        expect(normal).toMatch(`~${baseVersion}`);
        expect(bugfix).toMatch(`~${baseVersion}`);
        expect(minor).toMatch(`~${baseVersion}`);
    });

    test(`Correctly creates minor version string`, () => {
        const baseVersion = `1.2.3`;

        const normal = getMinorVersionString(baseVersion);
        const bugfix = getMinorVersionString(`~${baseVersion}`);
        const minor = getMinorVersionString(`^${baseVersion}`);

        expect(normal).toMatch(`^${baseVersion}`);
        expect(bugfix).toMatch(`^${baseVersion}`);
        expect(minor).toMatch(`^${baseVersion}`);
    });

    test(`Correctly finds basic version update`, async () => {
        const { version } = await updateCheck("react", "16.8.0", provider);

        expect(version).toMatch(`16.8.0`);
    });

    test(`Correctly finds bugifx version update`, async () => {
        const { version } = await updateCheck("react", "~16.8.0", provider);

        expect(version).toMatch(`16.8.6`);
    });

    test(`Correctly finds minor version update`, async () => {
        const { version } = await updateCheck("react", "^16.0.0", provider);

        expect(version).toMatch(`16.8.6`);
    });

    test(`Correctly calculates update info`, async () => {
        const info = await updateInfo("react", "^15.5.0", provider);

        expect(info.version).toMatch(`^15.5.0`);
        expect(info.latestOverall.version).toMatch(`16.8.6`);
        expect(info.latestSemanticMatch.version).toMatch(`15.6.2`);
        expect(info.latestBugfix.version).toMatch(`15.5.4`);
        expect(info.latestMinor.version).toMatch(`15.6.2`);
    });
});
