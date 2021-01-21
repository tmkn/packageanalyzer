import { OnlinePackageProvider } from "../src/providers/online";
import { Visitor } from "../src/visitors/visitor";
import { OraLogger } from "../src/logger";
import { MockNpmServer } from "./server";
import { ReleaseExtension } from "../src/extensions/ReleaseExtension";

describe.only(`OnlineProvider Tests`, () => {
    let server: MockNpmServer;
    let provider: OnlinePackageProvider;

    beforeAll(() => {
        server = new MockNpmServer(3003);
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

    test(`Check size`, () => {
        expect(provider.size).toBe(406);
    });

    test(`Check oldest package`, async () => {
        const visitor = new Visitor(["react", "16.8.1"], provider, new OraLogger(), [
            new ReleaseExtension(provider)
        ]);
        const p = await visitor.visit();
        const oldestPackage = p.oldest;

        expect.assertions(1);

        if (oldestPackage) {
            expect(oldestPackage.name).toBe("object-assign");
        }
    });

    test(`Check newest package`, async () => {
        const visitor = new Visitor(["react", "16.8.1"], provider, new OraLogger(), [
            new ReleaseExtension(provider)
        ]);
        const p = await visitor.visit();
        const newestPackage = p.newest;

        expect.assertions(1);

        if (newestPackage) {
            expect(newestPackage.name).toBe("scheduler");
        }
    });

    test(`Should throw on unpublished`, async () => {
        expect.assertions(1);

        try {
            await provider.getPackageByVersion("unpublished");
        } catch (e) {
            expect(e).toBeInstanceOf(Error);
        }
    });

    afterAll(() => {
        server.close();
    });
});
