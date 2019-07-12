import * as assert from "assert";
import * as path from "path";
import * as fs from "fs";
import { Server } from "http";
import * as express from "express";

import { INpmPackageInfo } from "../src/npm";
import { resolveFromName } from "../src/resolvers/nameResolver";
import { OnlinePackageProvider } from "../src/providers/onlineProvider";

describe.only(`OnlineProvider Tests`, () => {
    let server: MockNpmServer;

    before(() => {
        server = new MockNpmServer();
    });

    it(`resolveFromName Tests`, async () => {
        let pa = await resolveFromName(
            ["react", "16.8.1"],
            new OnlinePackageProvider(`http://localhost:3000`)
        );

        assert.equal(pa.name, "react");
        assert.equal(pa.version, "16.8.1");
    });

    it(`resolveFromName Tests 2`, async () => {
        let pa = await resolveFromName("react", new OnlinePackageProvider(`http://localhost:3000`));

        assert.equal(pa.name, "react");
        assert.equal(pa.version, "16.8.6");
    });

    it(`Check size`, () => {
        const mock = new OnlinePackageProvider(`http://localhost:3000`);

        assert.equal(mock.size, 0);
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
            let { name, version } = req.params;
            let data = this._cache.get(name);

            if (typeof data === "undefined") {
                res.status(404).send("Not found");
            } else {
                let versionData = data.versions[version];

                if (typeof versionData === "undefined") {
                    res.status(404).send(`version not found: ${version}`);
                } else {
                    res.json(versionData);
                }
            }
        });

        app.get(`/:name`, (req, res) => {
            let { name } = req.params;
            let data = this._cache.get(name);

            if (typeof data === "undefined") {
                res.status(404).send({ error: "Not found" });
            } else {
                res.json(data);
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
