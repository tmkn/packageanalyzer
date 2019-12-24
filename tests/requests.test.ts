import { Server } from "http";

import * as express from "express";
import { downloadHttpJson } from "../src/requests";

describe(`Request Tests`, () => {
    let server: Server;
    const threshold = 200;
    const artificalDelay = 2000;
    const port = 3001;

    if (threshold >= artificalDelay) {
        console.log(
            `Make sure threshold is lower than artifical delay to correctly trigger retries`
        );
    }

    beforeAll(() => {
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
        app.get("/forbidden", (req, res) => res.status(401).json({ message: "forbidden" }));

        server = app.listen(port, () => console.log(`Started server`));
    });

    test(`Returns json`, async () => {
        const response = await downloadHttpJson(`http://localhost:${port}/echo`, threshold);

        expect(response).toEqual({ hello: "world" });
    });

    test(`Auto retries after a timeout`, async () => {
        const response = await downloadHttpJson(`http://localhost:${port}/stall`, threshold);

        expect(response).toEqual({ worked: "after all" });
    });

    test(`Returns null after all retries have been exhausted`, async () => {
        const response = await downloadHttpJson(`http://localhost:${port}/stall2`, threshold);

        expect(response).toBe(null);
    });

    test(`Returns null on server not found`, async () => {
        const response = await downloadHttpJson("http://localhost:4785/foo", threshold);

        expect(response).toBe(null);
    });

    test(`Returns null if response is not json`, async () => {
        const response = await downloadHttpJson(`http://localhost:${port}/notjson`, threshold);

        expect(response).toBe(null);
    });

    test(`Returns null if status code is not 200`, async () => {
        const response = await downloadHttpJson(`http://localhost:${port}/forbidden`);

        expect(response).toBe(null);
    });

    afterAll(() => {
        server.close(e => {
            if (e) console.log(e);
        });
    });
});
