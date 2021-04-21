import { getDownloadsLastWeek } from "../src/npm";
import { createServer, MockNpmServer } from "./server";

describe(`Download Tests`, () => {
    let server: MockNpmServer;

    beforeAll(async () => {
        server = await createServer();
    });

    afterAll(() => server.close());

    test(`Clean semantic version strings`, async () => {
        const stats = await getDownloadsLastWeek(`_downloads`, `http://localhost:${server.port}/`);

        expect(stats.downloads).toEqual(8609192);
    });
});
