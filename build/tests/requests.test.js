"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const requests_1 = require("../src/utils/requests");
const server_1 = require("./server");
describe(`Request Tests`, () => {
    let server;
    const threshold = 200;
    beforeAll(async () => {
        server = await (0, server_1.createMockRequestServer)();
        jest.useRealTimers();
    });
    test(`Returns json`, async () => {
        const response = await (0, requests_1.downloadJson)(`http://localhost:${server.port}/echo`, threshold);
        expect(response).toEqual({ hello: "world" });
    });
    test(`Auto retries after a timeout`, async () => {
        const response = await (0, requests_1.downloadJson)(`http://localhost:${server.port}/stall`, threshold);
        expect(response).toEqual({ worked: "after all" });
    });
    test(`Returns null after all retries have been exhausted`, async () => {
        const response = await (0, requests_1.downloadJson)(`http://localhost:${server.port}/stall2`, threshold);
        expect(response).toBeNull();
    });
    test(`Returns null on server not found`, async () => {
        const response = await (0, requests_1.downloadJson)("http://localhost:4785/foo", threshold);
        expect(response).toBeNull();
    });
    test(`Returns null if response is not json`, async () => {
        const response = await (0, requests_1.downloadJson)(`http://localhost:${server.port}/notjson`, threshold);
        expect(response).toBeNull();
    });
    test(`Returns null if status code is not 200`, async () => {
        const response = await (0, requests_1.downloadJson)(`http://localhost:${server.port}/forbidden`);
        expect(response).toBeNull();
    });
    test(`Returns null for invalid protocol`, async () => {
        //@ts-expect-error
        const response = await (0, requests_1.downloadJson)(`abc`, threshold);
        expect(response).toBeNull();
    });
    afterAll(() => server.close());
});
//# sourceMappingURL=requests.test.js.map