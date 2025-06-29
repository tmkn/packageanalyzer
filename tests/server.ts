/* istanbul ignore file */

import * as path from "path";
import * as fs from "fs";
import { Server } from "http";

import express from "express";

import { type IPackageMetadata, isUnpublished } from "../src/npm.js";

export interface IMockServer {
    port: number;
    close(): Promise<void>;
}

abstract class AbstractMockServer {
    abstract name: string;
    private _server: Server | undefined;
    protected _app: express.Application = express();

    get port(): number {
        const address = this._server?.address();

        if (address && typeof address !== "string") {
            return address.port;
        }

        throw new Error(`Server is not yet running for port number`);
    }

    abstract setup(): void;

    start(): Promise<void> {
        return new Promise((resolve, reject) => {
            this._server = this._app
                .listen(0, () => {
                    process.stdout.write(`Started ${this.name}\n`);
                    resolve();
                })
                .on("error", e => {
                    process.stderr.write(e.message);

                    reject();
                });
        });
    }

    close(): Promise<void> {
        return new Promise(resolve => {
            if (!this._server) resolve();
            else {
                this._server.closeAllConnections();
                this._server.close(e => {
                    if (e) process.stderr.write(e.message);
                    resolve();
                });
            }
        });
    }
}

export async function createMockServer(server: AbstractMockServer): Promise<void> {
    server.setup();

    try {
        await server.start();

        return;
    } catch (e) {
        await server.close();

        console.error(`Error starting server: ${e}`);
    }
}

class MockNpmServer extends AbstractMockServer {
    name = `MockNpmServer`;
    private _dataPath = path.join("tests", "data", "mockserverdata");
    private _cache: Map<string, Readonly<IPackageMetadata>> = new Map();

    setup() {
        this._populateCache();

        this._app.get(`/:name/:version`, (req, res) => {
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

        this._app.get(`/:name`, (req, res) => {
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
            } else if (name === "missingdates") {
                const data = this._cache.get("react");

                if (typeof data === "undefined") res.status(404).send({ error: "Not found" });
                else {
                    const mock: IPackageMetadata = { ...data };

                    mock.time = {};

                    res.json(mock);
                }
            } else {
                const data = this._cache.get(name);

                if (typeof data === "undefined") {
                    res.status(404).send({ error: "Not found" });
                } else {
                    res.json(data);
                }
            }
        });
    }

    private _populateCache(): void {
        const files = fs.readdirSync(this._dataPath).map(f => path.join(this._dataPath, f));

        for (const file of files) {
            const name = path.basename(file, `.json`);

            this._cache.set(name, JSON.parse(fs.readFileSync(file, "utf8")));
        }
    }
}

export async function createMockNpmServer(): Promise<IMockServer> {
    const server = new MockNpmServer();

    await createMockServer(server);

    return server;
}

class MockDownloadServer extends AbstractMockServer {
    name = `MockDownloadServer`;

    setup() {
        this._app.get(`/:name`, (req, res) => {
            const { name } = req.params;

            if (name === "_downloads" || name === "react") {
                res.json({
                    downloads: 8609192,
                    start: "2020-11-27",
                    end: "2020-12-03",
                    package: "react"
                });
            }
        });
    }
}

export async function createMockDownloadServer(): Promise<IMockServer> {
    const server = new MockDownloadServer();

    await createMockServer(server);

    return server;
}

class MockRequestServer extends AbstractMockServer {
    name = `MockRequestServer`;
    private _artificalDelay = 2000;

    setup() {
        let stallCalls = 0;

        this._app.get("/echo", (req, res) => void res.json({ hello: "world" }));
        this._app.get("/stall", (req, res) => {
            stallCalls++;

            if (stallCalls >= 4) res.json({ worked: "after all" });
            else setTimeout(() => res.json({ hello: "world" }), this._artificalDelay);
        });
        this._app.get("/stall2", (req, res) => {
            setTimeout(() => res.json({ hello: "world" }), this._artificalDelay);
        });
        this._app.get("/notjson", (req, res) => void res.send("not json"));
        this._app.get(
            "/forbidden",
            (req, res) => void res.status(401).json({ message: "forbidden" })
        );
    }
}

export async function createMockRequestServer(): Promise<IMockServer> {
    const server = new MockRequestServer();

    await createMockServer(server);

    return server;
}
