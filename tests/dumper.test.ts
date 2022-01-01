import * as path from "path";
import { promises as fs } from "fs";

import { DependencyDumper, DependencyDumperProvider } from "../src/utils/dumper";
import { createMockNpmServer, IMockServer } from "./server";
import { DependencyUtilities } from "../src/extensions/utilities/DependencyUtilities";

describe(`DependencyDumper Tests`, () => {
    let server: IMockServer;
    const outputFolder = path.join(process.cwd(), `tmp`, `dump`);

    beforeAll(async () => {
        server = await createMockNpmServer();
    });

    test(`Correctly collect package & dependencies from online registry`, async () => {
        const dumper = new DependencyDumper();

        await dumper.collect(["react", "16.8.1"], `http://localhost:${server.port}`);

        expect(dumper.pkg).not.toBeUndefined();
        expect(dumper.pkg?.name).toEqual(`react`);
        expect(dumper.pkg?.version).toEqual(`16.8.1`);
    });

    test(`Save files`, async () => {
        const dumper = new DependencyDumper();

        await dumper.collect(["react", "16.8.1"], `http://localhost:${server.port}`);

        await fs.rm(outputFolder, { recursive: true, force: true });
        await dumper.save(outputFolder);

        const folder = await fs.readdir(outputFolder);

        expect(new DependencyUtilities(dumper.pkg!).withSelf.distinctNames.size).toEqual(
            folder.length
        );
    });

    test(`Throws on undefined pkg`, async () => {
        expect.assertions(1);

        try {
            const dumper = new DependencyDumper();

            await dumper.save(``);
        } catch (e) {
            expect(e).toBeInstanceOf(Error);
        }
    });

    test(`Throws on missing data`, async () => {
        expect.assertions(1);

        try {
            const dumper = new DependencyDumper();

            await dumper.collect(["react", "16.8.1"], `http://localhost:${server.port}`);
            //@ts-expect-error
            dumper.pkg._data.name = `unknownpkg`;

            await fs.rm(outputFolder, { recursive: true, force: true });
            await dumper.save(outputFolder);
        } catch (e) {
            expect(e).toBeInstanceOf(Error);
        }
    });

    afterAll(() => server.close());
});

describe(`DependencyDumper Provider`, () => {
    const outputFolder = path.join(process.cwd(), `tests`, `data`, `loopsdata`);
    const provider = new DependencyDumperProvider(outputFolder);

    test(`Looks up packages`, async () => {
        const expectedVersions: string[] = [`1.9.0`, `1.11.0`];
        const actualVersions: string[] = [];

        /*for await (const pkg of provider.getPackageJsons([
            [`@webassemblyjs/ast`, `1.9.0`],
            [`@webassemblyjs/ast`]
        ])) {
            actualVersions.push(pkg.version);
        }*/

        const dep1 = await provider.getPackageJson(`@webassemblyjs/ast`, `1.9.0`);
        const dep2 = await provider.getPackageJson(`@webassemblyjs/ast`);

        actualVersions.push(...[dep1.version, dep2.version]);

        expect(expectedVersions).toEqual(actualVersions);
    });

    test(`Throws on non existing package`, async () => {
        expect.assertions(1);

        try {
            await provider.getPackageJson(`doesntexist`);
        } catch (e) {
            expect(e).toBeInstanceOf(Error);
        }
    });

    test(`Throws on non existing version`, async () => {
        expect.assertions(1);

        try {
            await provider.getPackageJson(`@webassemblyjs/ast`, `x.x.x`);
        } catch (e) {
            expect(e).toBeInstanceOf(Error);
        }
    });
});
