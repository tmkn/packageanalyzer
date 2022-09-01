import * as nock from "nock";
import { Package } from "../../src";

import { ITarData, TarDecorator } from "../../src/extensions/decorators/TarDecorator";

describe(`TarDecorator Tests`, () => {
    const logStub = {
        logger: function () {}
    };

    beforeAll(() => {
        jest.useFakeTimers("legacy");
        nock.disableNetConnect();
    });

    it(`should run`, async () => {
        // const scope = nock('https://example.com')
        // .get('/todos')
        // .reply(200, {foo: `bar`})

        const cache: Map<string, ITarData> = new Map();
        const tarDecorator = new TarDecorator(cache);
        //@ts-expect-error
        const p: Package = new (class {
            fullName: string = `react@1.2.3`;
            getData(key: string): unknown {
                return `https://foosdfsdf32323.com`;
            }
        })();

        await expect(tarDecorator.apply({ p, ...logStub })).rejects.toThrow();

        // try {
        //     await tarDecorator.apply({ p, ...logStub });
        // } catch (e) {
        //     console.error(e);
        // }
    });

    afterAll(() => {
        nock.cleanAll();
        nock.enableNetConnect();
        jest.useFakeTimers("modern");
    });
});
