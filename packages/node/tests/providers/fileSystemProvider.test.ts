import { describe, test, expect, beforeAll } from "vitest";
import * as path from "path";

import { FileSystemPackageProvider } from "../../src/providers/folder.js";

describe(`NodeModulesProvider Tests`, () => {
    let provider: FileSystemPackageProvider;

    beforeAll(() => {
        const destination = path.join(
            "packages",
            "node",
            "tests",
            "data",
            "testproject1",
            "node_modules"
        );
        provider = new FileSystemPackageProvider(destination);
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
        } catch (e) {
            expect(e).toBeInstanceOf(Error);
        }
    });
});
