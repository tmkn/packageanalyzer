import { getDownloadsLastWeek } from "../src/npm";
import { createMockDownloadServer, MockDownloadServer } from "./server";

describe(`Download Tests`, () => {
    let server: MockDownloadServer;

    beforeAll(async () => {
        server = await createMockDownloadServer();
    });

    afterAll(() => server.close());

    test(`Clean semantic version strings`, async () => {
        const stats = await getDownloadsLastWeek(`_downloads`, `http://localhost:${server.port}/`);

        expect(stats.downloads).toEqual(8609192);
    });
});
