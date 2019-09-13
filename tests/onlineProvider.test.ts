import * as assert from "assert";
import * as path from "path";
import * as fs from "fs";
import { Server } from "http";
import * as express from "express";

import { INpmPackageInfo, isUnpublished } from "../src/npm";
import { OnlinePackageProvider } from "../src/providers/online";
import { Resolver } from "../src/resolvers/resolver";
import { OraLogger } from "../src/logger";

describe(`OnlineProvider Tests`, () => {
    let server: MockNpmServer;
    const provider = new OnlinePackageProvider(`http://localhost:3000`);

    before(() => {
        server = new MockNpmServer();
    });

    it(`resolveFromName with name and version`, async () => {
        const resolver = new Resolver(() => ["react", "16.8.1"], provider, new OraLogger());
        const pa = await resolver.resolve();

        assert.equal(pa.name, "react");
        assert.equal(pa.version, "16.8.1");
    });

    it(`resolveFromName with name`, async () => {
        const resolver = new Resolver(() => "react", provider, new OraLogger());
        const pa = await resolver.resolve();

        assert.equal(pa.name, "react");
        assert.equal(pa.version, "16.8.6");
    });

    it(`Check size`, () => {
        assert.equal(provider.size, 406);
    });

    it(`Check oldest package`, async () => {
        const resolver = new Resolver(() => ["react", "16.8.1"], provider, new OraLogger());
        const pa = await resolver.resolve();
        const oldestPackage = pa.oldest;

        if (oldestPackage) {
            assert.equal(oldestPackage.name, "object-assign");
        } else {
            assert.fail(`Couldn't find oldest package`);
        }
    });

    it(`Check newest package`, async () => {
        const resolver = new Resolver(() => ["react", "16.8.1"], provider, new OraLogger());
        const pa = await resolver.resolve();
        const newestPackage = pa.newest;

        if (newestPackage) {
            assert.equal(newestPackage.name, "scheduler");
        } else {
            assert.fail(`Couldn't find newest package`);
        }
    });

    it(`Should throw on unpublished`, async () => {
        try {
            await provider.getPackageByVersion("unpublished");

            assert.fail(`Did not throw`);
        } catch (e) {
            assert.ok(`Did throw`);
        }
    });

    after(() => {
        server.close();
    });
});

class MockNpmServer {
    private _server: Server;
    private readonly _port = 3000;
    private _dataPath = path.join("tests", "data", "mockserverdata");
    private _cache: Map<string, INpmPackageInfo> = new Map();

    constructor() {
        const app = express();

        this._populateCache();

        app.get(`/:name/:version`, (req, res) => {
            const { name, version } = req.params;
            const data = this._cache.get(name);

            if (typeof data === "undefined") {
                res.status(404).send("Not found");
            } else {
                const versionData = data.versions[version];

                if (typeof versionData === "undefined") {
                    res.status(404).send(`version not found: ${version}`);
                } else {
                    res.json(versionData);
                }
            }
        });

        app.get(`/:name`, (req, res) => {
            const { name } = req.params;

            if (name === "unpublished") {
                const data = {
                    name: "unpublished",
                    time: {
                        unpublished: {
                            maintainers: [],
                            name: isUnpublished
                        }
                    }
                };

                res.json(data);
            } else {
                const data = this._cache.get(name);

                if (typeof data === "undefined") {
                    res.status(404).send({ error: "Not found" });
                } else {
                    res.json(data);
                }
            }
        });

        this._server = app.listen(this._port, () => console.log(`Started MockNpmServer`));
    }

    private _populateCache(): void {
        const files = fs.readdirSync(this._dataPath).map(f => path.join(this._dataPath, f));

        for (const file of files) {
            const name = path.basename(file, `.json`);

            this._cache.set(name, JSON.parse(fs.readFileSync(file, "utf8")));
        }
    }

    close(): void {
        this._server.close(e => {
            if (e) console.log(e);
        });
    }
}
