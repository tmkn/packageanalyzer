import { getDownloadsLastWeek } from "../src/npm";
import { OnlinePackageProvider } from "../src/providers/online";
import { MockNpmServer } from "./server";

describe(`Download Tests`, () => {
    let server: MockNpmServer;
    let provider: OnlinePackageProvider;

    beforeAll(() => {
        server = new MockNpmServer(3007);
        provider = new OnlinePackageProvider(`http://localhost:${server.port}`);
    });

    afterAll(() => {
        server.close();
    });

    test(`Clean semantic version strings`, async () => {
        const stats = await getDownloadsLastWeek(`_downloads`, `http://localhost:${server.port}/`);

        expect(stats.downloads).toEqual(8609192);
    });
});
