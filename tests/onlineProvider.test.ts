import * as path from "path";
import * as fs from "fs";
import { Server } from "http";
import * as express from "express";

import { INpmPackage, isUnpublished } from "../src/npm";
import { OnlinePackageProvider } from "../src/providers/online";
import { Visitor } from "../src/visitors/visitor";
import { OraLogger } from "../src/logger";

describe.only(`OnlineProvider Tests`, () => {
    let server: MockNpmServer;
    let provider: OnlinePackageProvider;
    const port = 3000;

    beforeAll(() => {
        provider = new OnlinePackageProvider(`http://localhost:${port}`);
        server = new MockNpmServer(port);
    });

    test(`resolveFromName with name and version`, async () => {
        const visitor = new Visitor(["react", "16.8.1"], provider, new OraLogger());
        const pa = await visitor.visit();

        expect(pa.name).toBe("react");
        expect(pa.version).toBe("16.8.1");
    });

    test(`resolveFromName with name`, async () => {
        const visitor = new Visitor(["react"], provider, new OraLogger());
        const pa = await visitor.visit();

        expect(pa.name).toBe("react");
        expect(pa.version).toBe("16.8.6");
    });

    test(`Check size`, () => {
        expect(provider.size).toBe(406);
    });

    test(`Check oldest package`, async () => {
        const visitor = new Visitor(["react", "16.8.1"], provider, new OraLogger());
        const pa = await visitor.visit();
        const oldestPackage = pa.oldest;

        expect.assertions(1);

        if (oldestPackage) {
            expect(oldestPackage.name).toBe("object-assign");
        }
    });

    test(`Check newest package`, async () => {
        const visitor = new Visitor(["react", "16.8.1"], provider, new OraLogger());
        const pa = await visitor.visit();
        const newestPackage = pa.newest;

        expect.assertions(1);

        if (newestPackage) {
            expect(newestPackage.name).toBe("scheduler");
        }
    });

    test(`Should throw on unpublished`, async () => {
        expect.assertions(1);

        try {
            await provider.getPackageByVersion("unpublished");
        } catch (e) {
            expect(e).toBeInstanceOf(Error);
        }
    });

    afterAll(() => {
        server.close();
    });
});

class MockNpmServer {
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
