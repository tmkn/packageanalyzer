import * as assert from "assert";
import * as path from "path";

import { NodeModulesProvider } from "../src/providers/folderProvider";

describe(`NodeModulesProvider Tests`, () => {
    let provider: NodeModulesProvider;

    before(() => {
        const destination = path.join("tests", "data", "testproject1", "node_modules");
        provider = new NodeModulesProvider(destination);
    });

    it(`Found all dependencies`, () => {
        assert.equal(provider.size, 7);
    });

    it(`Found "js-tokens" dependency`, async () => {
        let name = "js-tokens";
        let version = "4.0.0";
        let dep = await provider.getPackageByVersion(name, version);

        assert.equal(dep.name, name);
        assert.equal(dep.version, version);
    });

    it(`Found "loose-envify" dependency`, async () => {
        let name = "loose-envify";
        let version = "1.4.0";
        let dep = await provider.getPackageByVersion(name, version);

        assert.equal(dep.name, name);
        assert.equal(dep.version, version);
    });

    it(`Found "object-assign" dependency`, async () => {
        let name = "object-assign";
        let version = "4.1.1";
        let dep = await provider.getPackageByVersion(name, version);

        assert.equal(dep.name, name);
        assert.equal(dep.version, version);
    });

    it(`Found "prop-types" dependency`, async () => {
        let name = "prop-types";
        let version = "15.7.2";
        let dep = await provider.getPackageByVersion(name, version);

        assert.equal(dep.name, name);
        assert.equal(dep.version, version);
    });

    it(`Found "react-is" dependency`, async () => {
        let name = "react-is";
        let version = "16.8.6";
        let dep = await provider.getPackageByVersion(name, version);

        assert.equal(dep.name, name);
        assert.equal(dep.version, version);
    });

    it(`Found "react" dependency`, async () => {
        let name = "react";
        let version = "16.8.6";
        let dep = await provider.getPackageByVersion(name, version);

        assert.equal(dep.name, name);
        assert.equal(dep.version, version);
    });

    it(`Found "scheduler" dependency`, async () => {
        let name = "scheduler";
        let version = "0.13.6";
        let dep = await provider.getPackageByVersion(name, version);

        assert.equal(dep.name, name);
        assert.equal(dep.version, version);
    });

    it(`Throws on missing package in getPackageByVersion`, async () => {
        try {
            let dep = await provider.getPackageByVersion("doesntexist", "1.0.0");

            assert.equal(false, true);
        } catch {
            assert.equal(true, true);
        }
    });

    it(`Get multiple packages with getPackagesByVersion`, async () => {
        try {
            let wanted: [string, string | undefined][] = [
                ["scheduler", "0.13.6"],
                ["react", "16.8.6"]
            ];

            for await (const pkgs of provider.getPackagesByVersion(wanted)) {
                assert.equal(pkgs.length, 2);
                assert.equal(pkgs[0].name, "scheduler");
                assert.equal(pkgs[1].name, "react");
            }
        } catch {
            assert.equal(false, true);
        }
    });

    it(`Throws on missing package in getPackagesByVersion`, async () => {
        try {
            let wanted: [string, string | undefined][] = [
                ["doesnexist", "0.13.6"],
                ["react", "16.8.6"]
            ];

            for await (const pkgs of provider.getPackagesByVersion(wanted)) {
                assert.equal(false, true);
            }
        } catch {
            assert.equal(true, true);
        }
    });
});
