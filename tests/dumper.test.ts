import * as path from "path";
import { promises as fs } from "fs";

import { DependencyDumper } from "../src/utils/dumper.js";
import { createMockNpmServer, type IMockServer } from "./server.js";
import { DependencyUtilities } from "../src/extensions/utilities/DependencyUtilities.js";
import { DumpPackageProvider } from "../src/providers/folder.js";

describe(`DependencyDumper Tests`, () => {
    let server: IMockServer;
    const outputFolder = path.join(process.cwd(), `tmp`, `dump`);

    beforeAll(async () => {
        server = await createMockNpmServer();
    });

    test(`Correctly collect package & dependencies from online registry`, async () => {
        const dumper = new DependencyDumper();

        await dumper.collect(["react", "16.8.1"], `http://localhost:${server.port}`);

        expect(dumper.pkgs).not.toBeUndefined();
        expect(dumper.pkgs[0].name).toEqual(`react`);
        expect(dumper.pkgs[0].version).toEqual(`16.8.1`);
    });

    test(`Correctly collect package & dependencies via array from online registry`, async () => {
        const dumper = new DependencyDumper();

        await dumper.collect([["react", "16.8.1"]], `http://localhost:${server.port}`);

        expect(dumper.pkgs).not.toBeUndefined();
        expect(dumper.pkgs[0].name).toEqual(`react`);
        expect(dumper.pkgs[0].version).toEqual(`16.8.1`);
    });

    test(`Save files`, async () => {
        const dumper = new DependencyDumper();

        await dumper.collect(["react", "16.8.1"], `http://localhost:${server.port}`);

        await fs.rm(outputFolder, { recursive: true, force: true });
        await dumper.save(outputFolder);

        const folder = await fs.readdir(outputFolder);

        expect(new DependencyUtilities(dumper.pkgs[0]).withSelf.distinctNames.size).toEqual(
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
            //@ts-expect-error idk anymore
            dumper.pkg._data.name = `unknownpkg`;

            await fs.rm(outputFolder, { recursive: true, force: true });
            await dumper.save(outputFolder);
        } catch (e) {
            expect(e).toBeInstanceOf(Error);
        }
    });

    afterAll(() => server.close());
});
