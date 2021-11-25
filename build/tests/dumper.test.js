"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const fs_1 = require("fs");
const dumper_1 = require("../src/utils/dumper");
const server_1 = require("./server");
const DependencyUtilities_1 = require("../src/extensions/utilities/DependencyUtilities");
describe(`DependencyDumper Tests`, () => {
    let server;
    const outputFolder = path.join(process.cwd(), `tmp`, `dump`);
    beforeAll(async () => {
        server = await (0, server_1.createMockNpmServer)();
    });
    test(`Correctly collect package & dependencies from online registry`, async () => {
        const dumper = new dumper_1.DependencyDumper();
        await dumper.collect(["react", "16.8.1"], `http://localhost:${server.port}`);
        expect(dumper.pkg).not.toBeUndefined();
        expect(dumper.pkg?.name).toEqual(`react`);
        expect(dumper.pkg?.version).toEqual(`16.8.1`);
    });
    test(`Save files`, async () => {
        const dumper = new dumper_1.DependencyDumper();
        await dumper.collect(["react", "16.8.1"], `http://localhost:${server.port}`);
        await fs_1.promises.rm(outputFolder, { recursive: true, force: true });
        await dumper.save(outputFolder);
        const folder = await fs_1.promises.readdir(outputFolder);
        expect(new DependencyUtilities_1.DependencyUtilities(dumper.pkg).withSelf.distinctNames.size).toEqual(folder.length);
    });
    test(`Throws on undefined pkg`, async () => {
        expect.assertions(1);
        try {
            const dumper = new dumper_1.DependencyDumper();
            await dumper.save(``);
        }
        catch (e) {
            expect(e).toBeInstanceOf(Error);
        }
    });
    test(`Throws on missing data`, async () => {
        expect.assertions(1);
        try {
            const dumper = new dumper_1.DependencyDumper();
            await dumper.collect(["react", "16.8.1"], `http://localhost:${server.port}`);
            //@ts-expect-error
            dumper.pkg._data.name = `unknownpkg`;
            await fs_1.promises.rm(outputFolder, { recursive: true, force: true });
            await dumper.save(outputFolder);
        }
        catch (e) {
            expect(e).toBeInstanceOf(Error);
        }
    });
    afterAll(() => server.close());
});
describe(`DependencyDumper Provider`, () => {
    const outputFolder = path.join(process.cwd(), `tests`, `data`, `loopsdata`);
    const provider = new dumper_1.DependencyDumperProvider(outputFolder);
    test(`Looks up packages`, async () => {
        const expectedVersions = [`1.9.0`, `1.11.0`];
        const actualVersions = [];
        for await (const pkg of provider.getPackageJsons([
            [`@webassemblyjs/ast`, `1.9.0`],
            [`@webassemblyjs/ast`]
        ])) {
            actualVersions.push(pkg.version);
        }
        expect(expectedVersions).toEqual(actualVersions);
    });
    test(`Throws on non existing package`, async () => {
        expect.assertions(1);
        try {
            await provider.getPackageJson(`doesntexist`);
        }
        catch (e) {
            expect(e).toBeInstanceOf(Error);
        }
    });
    test(`Throws on non existing version`, async () => {
        expect.assertions(1);
        try {
            await provider.getPackageJson(`@webassemblyjs/ast`, `x.x.x`);
        }
        catch (e) {
            expect(e).toBeInstanceOf(Error);
        }
    });
});
//# sourceMappingURL=dumper.test.js.map