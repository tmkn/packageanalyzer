import * as path from "path";
import * as https from "https";
import * as zlib from "zlib";

import * as tar from "tar";

import { IPackageMetaDataProvider } from "../../providers/provider";
import { IApplyArgs, IDecorator } from "./Decorator";

interface ITarData {
    files: Map<string, string>;
}

class TarEntry {
    private _text: string | undefined = undefined;

    constructor(private _tar: tar.ReadEntry) {}

    async getFile(): Promise<string> {
        if(this._text)
            return this._text;

        return new Promise<string>((resolve, _reject) => {
            const data: any[] = [];

            this._tar.on("data", chunk => data.push(chunk)).on("end", () => {
                this._text = data.toString();
                console.log(16,data);
                console.log(this._tar);
                resolve(this._text);
            });
        });
    }
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
    const files = new Map<string, string>();

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
                    //console.log(entry.path);
                    //console.log(entry);
                    //entry.resume();

                    //files.set(entry.path, new TarEntry(entry));

                    const data: any[] = [];

                    entry.on("data", chunk => data.push(chunk));
                    entry.on("end", () => {
                        /*console.log(data.toString());

                        throw new Error(`whoops`);*/
                        files.set(entry.path, data.toString());
                    });
                });
            res.on("end", () => {
                console.log(`Download finished: ${data.length}`);
                console.log(`Files: ${files.size}`);

                console.log(files.get(`package/lib/typescript.js`));

                console.log(path.resolve(`package`, `./lib/typescript.js`));

                //const buf = Buffer.from(data);

                //console.log(buf);
            });
        }
    );
})();
