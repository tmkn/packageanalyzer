"use strict";
/* istanbul ignore file */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMockRequestServer = exports.createMockDownloadServer = exports.createMockNpmServer = exports.createMockServer = void 0;
const path = require("path");
const fs = require("fs");
const express = require("express");
const npm_1 = require("../src/npm");
let i = 3000;
function getPort() {
    return i++;
}
class AbstractMockServer {
    constructor() {
        this._app = express();
        this.port = 3000;
    }
    start(port) {
        return new Promise((resolve, reject) => {
            //if (!this._server) reject();
            //else {
            this.port = port;
            this._server = this._app
                .listen(this.port, () => {
                process.stdout.write(`Started ${this.name}\n`);
                resolve();
            })
                .on("error", e => {
                process.stderr.write(e.message);
                reject();
            });
            //}
        });
    }
    close() {
        return new Promise(resolve => {
            if (!this._server)
                resolve();
            else
                this._server.close(e => {
                    if (e)
                        process.stderr.write(e.message);
                    resolve();
                });
        });
    }
}
async function createMockServer(server) {
    const maxRetries = 100;
    server.setup();
    for (let i = 0; i < maxRetries; i++) {
        try {
            await server.start(getPort());
            return;
        }
        catch (e) { }
    }
    throw new Error(`Couldn't start server`);
}
exports.createMockServer = createMockServer;
class MockNpmServer extends AbstractMockServer {
    constructor() {
        super(...arguments);
        this.name = `MockNpmServer`;
        this._dataPath = path.join("tests", "data", "mockserverdata");
        this._cache = new Map();
    }
    setup() {
        this._populateCache();
        this._app.get(`/:name/:version`, (req, res) => {
            const { name, version } = req.params;
            const data = this._cache.get(name);
            if (typeof data === "undefined") {
                res.status(404).send("Not found");
            }
            else {
                const versionData = data.versions[version];
                if (typeof versionData === "undefined") {
                    res.status(404).send(`version not found: ${version}`);
                }
                else {
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
                            name: npm_1.isUnpublished
                        }
                    }
                };
                res.json(data);
            }
            else if (name === "missingdates") {
                const data = this._cache.get("react");
                if (typeof data === "undefined")
                    res.status(404).send({ error: "Not found" });
                else {
                    const mock = { ...data };
                    mock.time = {};
                    res.json(mock);
                }
            }
            else {
                const data = this._cache.get(name);
                if (typeof data === "undefined") {
                    res.status(404).send({ error: "Not found" });
                }
                else {
                    res.json(data);
                }
            }
        });
    }
    _populateCache() {
        const files = fs.readdirSync(this._dataPath).map(f => path.join(this._dataPath, f));
        for (const file of files) {
            const name = path.basename(file, `.json`);
            this._cache.set(name, JSON.parse(fs.readFileSync(file, "utf8")));
        }
    }
}
async function createMockNpmServer() {
    const server = new MockNpmServer();
    await createMockServer(server);
    return server;
}
exports.createMockNpmServer = createMockNpmServer;
class MockDownloadServer extends AbstractMockServer {
    constructor() {
        super(...arguments);
        this.name = `MockDownloadServer`;
    }
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
async function createMockDownloadServer() {
    const server = new MockDownloadServer();
    await createMockServer(server);
    return server;
}
exports.createMockDownloadServer = createMockDownloadServer;
class MockRequestServer extends AbstractMockServer {
    constructor() {
        super(...arguments);
        this.name = `MockRequestServer`;
        this._artificalDelay = 2000;
    }
    setup() {
        let stallCalls = 0;
        this._app.get("/echo", (req, res) => res.json({ hello: "world" }));
        this._app.get("/stall", (req, res) => {
            stallCalls++;
            if (stallCalls >= 4)
                res.json({ worked: "after all" });
            else
                setTimeout(() => res.json({ hello: "world" }), this._artificalDelay);
        });
        this._app.get("/stall2", (req, res) => {
            setTimeout(() => res.json({ hello: "world" }), this._artificalDelay);
        });
        this._app.get("/notjson", (req, res) => res.send("not json"));
        this._app.get("/forbidden", (req, res) => res.status(401).json({ message: "forbidden" }));
    }
}
async function createMockRequestServer() {
    const server = new MockRequestServer();
    await createMockServer(server);
    return server;
}
exports.createMockRequestServer = createMockRequestServer;
//# sourceMappingURL=server.js.map