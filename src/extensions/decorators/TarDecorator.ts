import * as https from "https";
import * as zlib from "zlib";

import * as tar from "tar";

import { IPackageMetaDataProvider } from "../../providers/provider";
import { IApplyArgs, IDecorator } from "./Decorator";

interface ITarData {
    published: Date;
}

export class TarDecorator implements IDecorator<"tar", ITarData> {
    constructor(private _provider: IPackageMetaDataProvider) {}

    readonly name: string = `TarDecorator`;
    readonly key = "tar";

    async apply({ p }: IApplyArgs): Promise<ITarData> {
        throw new Error(`Not Implemented`);
    }
}

(async () => {
    console.log(`Hello World`);

    https.get(
        `https://registry.yarnpkg.com/typescript/-/typescript-4.7.2.tgz#1f9aa2ceb9af87cca227813b4310fff0b51593c4`,
        res => {
            const data: any[] = [];

            /*res.on("data", chunk => {
            data.push(chunk);
        });*/
            res.on("error", console.log)
                //.pipe(zlib.createGunzip())
                .pipe(new tar.Parse({}))
                .on("entry", entry => {
                    console.log(entry.path);
                    //console.log(entry);
                    //entry.resume();

                    const data: any[] = [];

                    entry.on("data", chunk => data.push(chunk));
                    entry.on("end", () => {
                        console.log(data.toString());

                        throw new Error(`whoops`);
                    });
                });
            /*res.on("end", () => {
            console.log(`Download finished: ${data.length}`);

            const buf = Buffer.from(data);

            console.log(buf);
        });*/
        }
    );
})();
