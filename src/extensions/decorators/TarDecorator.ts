import * as path from "path";
import * as https from "https";
//import { pipeline } from "stream/promises";

import * as tar from "tar";

import { IPackageJsonProvider, IPackageMetaDataProvider } from "../../providers/provider";
import { IApplyArgs, IDecorator } from "./Decorator";
import { Readable, Writable, Transform, type WritableOptions, pipeline, PassThrough } from "stream";
//import { ReadableStream } from "stream/web";

// class Test extends Writable {
//     private _buffer: Buffer = Buffer.from(``);

//     constructor(private _path: string, private _files: Map<string, string>) {
//         super();
//     }

//     override _write(
//         chunk: any,
//         encoding: BufferEncoding,
//         callback: (error?: Error | null | undefined) => void
//     ): void {
//         this._buffer += chunk;

//         callback();
//     }

//     override end(cb?: (() => void) | undefined): this;
//     override end(chunk: any, cb?: (() => void) | undefined): this;
//     override end(chunk: any, encoding: BufferEncoding, cb?: (() => void) | undefined): this;
//     override end(chunk?: unknown, encoding?: unknown, cb?: unknown): this {
//         const file = this._buffer.toString("utf8");

//         this._files.set(this._path, file);

//         return this;
//     }
// }

interface ITarData {
    files: Map<string, string>;
}

export class TarDecorator implements IDecorator<"tar", ITarData> {
    constructor(private _provider: IPackageJsonProvider) {}

    readonly name: string = `TarDecorator`;
    readonly key = "tar";

    apply({ p }: IApplyArgs): Promise<ITarData> {
        return new Promise<ITarData>((resolve, reject) => {
            //const pkgJson = await this._provider.getPackageJson(p.name, p.version);
            const files: Map<string, string> = new Map();
            const url = p.getData(`dist.tarball`);

            if (typeof url === "string") {
                https.get(url, res => {
                    pipeline(
                        res,
                        new tar.Parse({
                            filter: (path, entry) => entry.type === "File",
                            onentry: async entry => {
                                let buffer: Buffer = Buffer.from(``);

                                //@ts-ignore
                                for await (const data of entry) {
                                    buffer += data;
                                }

                                const file = buffer.toString("utf8");

                                files.set(entry.path, file);
                            }
                        }),
                        error => {
                            if (error) reject(error);
                            else resolve({ files });
                        }
                    );
                });
            }
        });
    }
}
