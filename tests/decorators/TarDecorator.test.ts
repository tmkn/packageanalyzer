import * as http from "http";

import * as nock from "nock";
//const nock = require("nock");
import { Package } from "../../src";

import { ITarData, TarDecorator } from "../../src/extensions/decorators/TarDecorator";
import { downloadJson } from "../../src/utils/requests";

describe(`TarDecorator Tests`, () => {
    const logStub = {
        logger: function () {}
    };

    // beforeAll(() => {
    //     nock.disableNetConnect();
    // });

    it(`should run`, async () => {
        nock.disableNetConnect();
        //nock.activate();

        // const scope = nock('example.com')
        // .get('/todos')
        // .reply(200, 'domain matched')

        const options = {
            hostname: "example.com",
            //port: 443,
            path: "/todos",
            method: "GET"
        };

        const req = http.request(options, res => {
            console.log(`statusCode: ${res.statusCode}`);

            res.on("data", d => {
                process.stdout.write(d);
                console.error(d);
            });
        });

        req.on("error", error => {
            console.error(error);
        });

        //req.end();

        nock.cleanAll();
        nock.enableNetConnect();

        //const foo = await downloadJson(`https://fadfjlasdjfadsd.com/resource`)
        //console.log(foo);
        //expect(true).toBeTruthy();
        // const req = http.get('http://google.com/', res => {

        // })
        // req.on('error', err => {
        //   console.log(err)
        // })

        // const cache: Map<string, ITarData> = new Map();
        // const tarDecorator = new TarDecorator(cache);
        // //@ts-expect-error
        // const p: Package = new (class {
        //     fullName: string = `react@1.2.3`;
        //     getData(key: string): unknown {
        //         return `https://foosdfsdf32323.com`;
        //     }
        // })();

        // try {
        //     await tarDecorator.apply({ p, ...logStub });
        // } catch(e) {
        //     console.error(e);
        // }
    });

    // afterAll(() => {
    //     nock.cleanAll();
    //     nock.enableNetConnect();
    // });
});
