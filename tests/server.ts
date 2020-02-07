import * as path from "path";
import * as fs from "fs";
import { Server } from "http";
import * as express from "express";

import { INpmPackage, isUnpublished } from "../src/npm";

/* istanbul ignore next */
export class MockNpmServer {
    private _server: Server;
    private _dataPath = path.join("tests", "data", "mockserverdata");
    private _cache: Map<string, INpmPackage> = new Map();

    constructor(private readonly _port: number) {
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
