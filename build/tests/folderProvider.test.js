"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const folder_1 = require("../src/providers/folder");
describe(`NodeModulesProvider Tests`, () => {
    let provider;
    beforeAll(() => {
        const destination = path.join("tests", "data", "testproject1", "node_modules");
        provider = new folder_1.FileSystemPackageProvider(destination);
    });
    test(`Found "js-tokens" dependency`, async () => {
        const name = "js-tokens";
        const version = "4.0.0";
        const dep = await provider.getPackageJson(name, version);
        expect(dep.name).toBe(name);
        expect(dep.version).toBe(version);
    });
    test(`Found "loose-envify" dependency`, async () => {
        const name = "loose-envify";
        const version = "1.4.0";
        const dep = await provider.getPackageJson(name, version);
        expect(dep.name).toBe(name);
        expect(dep.version).toBe(version);
    });
    test(`Found "object-assign" dependency`, async () => {
        const name = "object-assign";
        const version = "4.1.1";
        const dep = await provider.getPackageJson(name, version);
        expect(dep.name).toBe(name);
        expect(dep.version).toBe(version);
    });
    test(`Found "prop-types" dependency`, async () => {
        const name = "prop-types";
        const version = "15.7.2";
        const dep = await provider.getPackageJson(name, version);
        expect(dep.name).toBe(name);
        expect(dep.version).toBe(version);
    });
    test(`Found "react-is" dependency`, async () => {
        const name = "react-is";
        const version = "16.8.6";
        const dep = await provider.getPackageJson(name, version);
        expect(dep.name).toBe(name);
        expect(dep.version).toBe(version);
    });
    test(`Found "react" dependency`, async () => {
        const name = "react";
        const version = "16.8.6";
        const dep = await provider.getPackageJson(name, version);
        expect(dep.name).toBe(name);
        expect(dep.version).toBe(version);
    });
    test(`Found "scheduler" dependency`, async () => {
        const name = "scheduler";
        const version = "0.13.6";
        const dep = await provider.getPackageJson(name, version);
        expect(dep.name).toBe(name);
        expect(dep.version).toBe(version);
    });
    test(`Throws on missing package in getPackageByVersion`, async () => {
        expect.assertions(1);
        try {
            await provider.getPackageJson("doesntexist", "1.0.0");
        }
        catch (e) {
            expect(e).toBeInstanceOf(Error);
        }
    });
    test(`Get multiple packages with getPackagesByVersion`, async () => {
        const wanted = [
            ["scheduler", "0.13.6"],
            ["react", "16.8.6"]
        ];
        const pkgs = [];
        for await (const pkg of provider.getPackageJsons(wanted)) {
            pkgs.push(pkg);
        }
        expect(pkgs.length).toBe(2);
        expect(pkgs[0].name).toBe("scheduler");
        expect(pkgs[1].name).toBe("react");
    });
    test(`Throws on missing package in getPackagesByVersion`, async () => {
        expect.assertions(1);
        try {
            const wanted = [
                ["doesnexist", "0.13.6"],
                ["react", "16.8.6"]
            ];
            /* eslint-disable */
            for await (const pkgs of provider.getPackageJsons(wanted)) {
            }
            /* eslint-enable */
        }
        catch (e) {
            expect(e).toBeInstanceOf(Error);
        }
    });
});
//# sourceMappingURL=folderProvider.test.js.map