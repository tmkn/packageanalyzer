import * as assert from "assert";
import * as path from "path";

import { FileSystemPackageProvider } from "../src/providers/folder";
import { INpmPackage } from "../src/npm";

describe(`NodeModulesProvider Tests`, () => {
    let provider: FileSystemPackageProvider;

    before(() => {
        const destination = path.join("tests", "data", "testproject1", "node_modules");
        provider = new FileSystemPackageProvider(destination);
    });

    it(`Found all dependencies`, () => {
        assert.equal(provider.size, 7);
    });

    it(`Found "js-tokens" dependency`, async () => {
        const name = "js-tokens";
        const version = "4.0.0";
        const dep = await provider.getPackageByVersion(name, version);

        assert.equal(dep.name, name);
        assert.equal(dep.version, version);
    });

    it(`Found "loose-envify" dependency`, async () => {
        const name = "loose-envify";
        const version = "1.4.0";
        const dep = await provider.getPackageByVersion(name, version);

        assert.equal(dep.name, name);
        assert.equal(dep.version, version);
    });

    it(`Found "object-assign" dependency`, async () => {
        const name = "object-assign";
        const version = "4.1.1";
        const dep = await provider.getPackageByVersion(name, version);

        assert.equal(dep.name, name);
        assert.equal(dep.version, version);
    });

    it(`Found "prop-types" dependency`, async () => {
        const name = "prop-types";
        const version = "15.7.2";
        const dep = await provider.getPackageByVersion(name, version);

        assert.equal(dep.name, name);
        assert.equal(dep.version, version);
    });

    it(`Found "react-is" dependency`, async () => {
        const name = "react-is";
        const version = "16.8.6";
        const dep = await provider.getPackageByVersion(name, version);

        assert.equal(dep.name, name);
        assert.equal(dep.version, version);
    });

    it(`Found "react" dependency`, async () => {
        const name = "react";
        const version = "16.8.6";
        const dep = await provider.getPackageByVersion(name, version);

        assert.equal(dep.name, name);
        assert.equal(dep.version, version);
    });

    it(`Found "scheduler" dependency`, async () => {
        const name = "scheduler";
        const version = "0.13.6";
        const dep = await provider.getPackageByVersion(name, version);

        assert.equal(dep.name, name);
        assert.equal(dep.version, version);
    });

    it(`Throws on missing package in getPackageByVersion`, async () => {
        try {
            await provider.getPackageByVersion("doesntexist", "1.0.0");

            assert.equal(false, true);
        } catch {
            assert.equal(true, true);
        }
    });

    it(`Get multiple packages with getPackagesByVersion`, async () => {
        try {
            const wanted: [string, string | undefined][] = [
                ["scheduler", "0.13.6"],
                ["react", "16.8.6"]
            ];
            const pkgs: INpmPackage[] = [];

            for await (const pkg of provider.getPackagesByVersion(wanted)) {
                pkgs.push(pkg);
            }

            assert.equal(pkgs.length, 2);
            assert.equal(pkgs[0].name, "scheduler");
            assert.equal(pkgs[1].name, "react");
        } catch {
            assert.equal(false, true);
        }
    });

    it(`Throws on missing package in getPackagesByVersion`, async () => {
        try {
            const wanted: [string, string | undefined][] = [
                ["doesnexist", "0.13.6"],
                ["react", "16.8.6"]
            ];

            /* eslint-disable */
            for await (const pkgs of provider.getPackagesByVersion(wanted)) {
                assert.equal(false, true);
            }
            /* eslint-enable */
        } catch {
            assert.equal(true, true);
        }
    });
});
