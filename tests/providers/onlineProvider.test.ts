import { OnlinePackageProvider } from "../../src/providers/online";
import { Visitor } from "../../src/visitors/visitor";
import { OraLogger } from "../../src/loggers/OraLogger";
import { createMockNpmServer, IMockServer } from "../server";
import { ReleaseAttachment } from "../../src/attachments/ReleaseAttachment";
import { ReleaseUtilities } from "../../src/extensions/utilities/ReleaseUtilities";

describe(`OnlineProvider Tests`, () => {
    let server: IMockServer;
    let provider: OnlinePackageProvider;

    beforeAll(async () => {
        server = await createMockNpmServer();
        provider = new OnlinePackageProvider(`http://localhost:${server.port}`);
    });

    test(`resolveFromName with name and version`, async () => {
        const visitor = new Visitor(["react", "16.8.1"], provider, new OraLogger());
        const p = await visitor.visit();

        expect(p.name).toBe("react");
        expect(p.version).toBe("16.8.1");
    });

    test(`resolveFromName with name`, async () => {
        const visitor = new Visitor(["react"], provider, new OraLogger());
        const p = await visitor.visit();

        expect(p.name).toBe("react");
        expect(p.version).toBe("16.8.6");
    });

    test(`Check oldest package`, async () => {
        const visitor = new Visitor(["react", "16.8.1"], provider, new OraLogger(), [
            new ReleaseAttachment(provider)
        ]);
        const p = await visitor.visit();
        const { oldest: oldestPackage } = new ReleaseUtilities(p);

        expect.assertions(1);

        if (oldestPackage) {
            expect(oldestPackage.name).toBe("object-assign");
        }
    });

    test(`Check newest package`, async () => {
        const visitor = new Visitor(["react", "16.8.1"], provider, new OraLogger(), [
            new ReleaseAttachment(provider)
        ]);
        const p = await visitor.visit();
        const { newest: newestPackage } = new ReleaseUtilities(p);

        expect.assertions(1);

        if (newestPackage) {
            expect(newestPackage.name).toBe("scheduler");
        }
    });

    test(`Should throw on unpublished`, async () => {
        expect.assertions(1);

        try {
            await provider.getPackageJson("unpublished");
        } catch (e) {
            expect(e).toBeInstanceOf(Error);
        }
    });

    test(`Should throw on missing package.json for specific version`, async () => {
        expect.assertions(1);

        try {
            await provider.getPackageJson("undefined-version", "5.0.0");
        } catch (e) {
            expect(e).toBeInstanceOf(Error);
        }
    });

    afterAll(() => server.close());
});
