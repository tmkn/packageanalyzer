import { getDownloadsLastWeek } from "../src/npm";
import { MockNpmServer } from "./server";

describe(`Download Tests`, () => {
    let server: MockNpmServer;

    beforeAll(() => {
        server = new MockNpmServer(3007);
    });

    afterAll(() => {
        server.close();
    });

    test(`Clean semantic version strings`, async () => {
        const stats = await getDownloadsLastWeek(`_downloads`, `http://localhost:${server.port}/`);

        expect(stats.downloads).toEqual(8609192);
    });
});
