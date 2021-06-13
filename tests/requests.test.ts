import { downloadHttpJson } from "../src/utils/requests";
import { createMockRequestServer, IMockServer } from "./server";

describe(`Request Tests`, () => {
    let server: IMockServer;
    const threshold = 200;

    beforeAll(async () => {
        server = await createMockRequestServer();
    });

    test(`Returns json`, async () => {
        const response = await downloadHttpJson(`http://localhost:${server.port}/echo`, threshold);

        expect(response).toEqual({ hello: "world" });
    });

    test(`Auto retries after a timeout`, async () => {
        const response = await downloadHttpJson(`http://localhost:${server.port}/stall`, threshold);

        expect(response).toEqual({ worked: "after all" });
    });

    test(`Returns null after all retries have been exhausted`, async () => {
        const response = await downloadHttpJson(
            `http://localhost:${server.port}/stall2`,
            threshold
        );

        expect(response).toBe(null);
    });

    test(`Returns null on server not found`, async () => {
        const response = await downloadHttpJson("http://localhost:4785/foo", threshold);

        expect(response).toBe(null);
    });

    test(`Returns null if response is not json`, async () => {
        const response = await downloadHttpJson(
            `http://localhost:${server.port}/notjson`,
            threshold
        );

        expect(response).toBe(null);
    });

    test(`Returns null if status code is not 200`, async () => {
        const response = await downloadHttpJson(`http://localhost:${server.port}/forbidden`);

        expect(response).toBe(null);
    });

    afterAll(() => server.close());
});
