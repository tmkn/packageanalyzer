import { Server } from "http";
import * as assert from "assert";

import * as express from "express";
import { downloadHttpJson } from "../src/requests";

describe(`Request Tests`, () => {
    let server: Server;
    const threshold = 200;
    const artificalDelay = 2000;
    const port = 3000;

    if (threshold >= artificalDelay) {
        console.log(
            `Make sure threshold is lower than artifical delay to correctly trigger retries`
        );
    }

    before(() => {
        const app = express();
        let stallCalls = 0;

        app.get("/echo", (req, res) => res.json({ hello: "world" }));
        app.get("/stall", (req, res) => {
            stallCalls++;

            if (stallCalls >= 4) res.json({ worked: "after all" });
            else setTimeout(() => res.json({ hello: "world" }), artificalDelay);
        });
        app.get("/stall2", (req, res) => {
            setTimeout(() => res.json({ hello: "world" }), artificalDelay);
        });
        app.get("/notjson", (req, res) => res.send("not json"));

        server = app.listen(port, () => console.log(`Started server`));
    });

    it(`Returns json`, async () => {
        let response = await downloadHttpJson(`http://localhost:${port}/echo`, threshold);

        if (!response) {
            assert.fail(`response is null`);
        } else {
            assert.deepEqual(response, { hello: "world" });
        }
    });

    it(`Auto retries after a timeout`, async () => {
        let response = await downloadHttpJson(`http://localhost:${port}/stall`, threshold);

        assert.deepEqual(response, { worked: "after all" });
    });

    it(`Returns null after all retries have been exhausted`, async () => {
        let response = await downloadHttpJson(`http://localhost:${port}/stall2`, threshold);

        assert.equal(response, null);
    });

    it(`Returns null on server not found`, async () => {
        let response = await downloadHttpJson("http://localhost:4785/foo", threshold);

        assert.equal(response, null);
    });

    it(`Returns null if response is not json`, async () => {
        let response = await downloadHttpJson(`http://localhost:${port}/notjson`, threshold);

        assert.equal(response, null);
    });

    after(() => {
        server.close(e => {
            if (e) console.log(e);
        });
    });
});
