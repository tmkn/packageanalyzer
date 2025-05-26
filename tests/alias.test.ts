import { OraLogger, Visitor } from "../src";
import { IMockPackageJson, MockProvider } from "./mocks";

describe(`Alias Tests`, () => {
    test(`correctly returns alias`, async () => {
        const dep1: IMockPackageJson = {
            name: `dep1`,
            version: `1.0.0`,
            dependencies: [
                {
                    name: `aliasdep`,
                    version: `npm:dep2@1.0.0`
                }
            ]
        };

        const dep2: IMockPackageJson = {
            name: `dep2`,
            version: `1.0.0`
        };

        const provider = new MockProvider([dep1, dep2]);

        const visitor = new Visitor(["dep1", "1.0.0"], provider, new OraLogger());
        const p = await visitor.visit();

        expect(p.directDependencies[0].alias).toBe("aliasdep");
        expect(p.directDependencies[0].name).toBe("dep2");
    });

    test(`correctly returns null when alias is not set`, async () => {
        const dep1: IMockPackageJson = {
            name: `dep1`,
            version: `1.0.0`,
            dependencies: [
                {
                    name: `dep2`,
                    version: `1.0.0`
                }
            ]
        };

        const dep2: IMockPackageJson = {
            name: `dep2`,
            version: `1.0.0`
        };

        const provider = new MockProvider([dep1, dep2]);

        const visitor = new Visitor(["dep1", "1.0.0"], provider, new OraLogger());
        const p = await visitor.visit();

        expect(p.directDependencies[0].alias).toBe(null);
        expect(p.directDependencies[0].name).toBe("dep2");
    });
});
