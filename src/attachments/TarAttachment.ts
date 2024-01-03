import * as https from "https";

import * as tar from "tar";

import { IApplyArgs, IAttachment } from "./Attachments";
import { pipeline } from "stream";

export interface ITarData {
    files: Map<string, string>;
}

type TarCache = Map<string, ITarData>;

export class TarAttachment implements IAttachment<"tar", ITarData> {
    constructor(private _cache: TarCache = new Map()) {}

    readonly name: string = `TarAttachment`;
    readonly key = "tar";

    apply({ p }: IApplyArgs): Promise<ITarData> {
        return new Promise<ITarData>((resolve, reject) => {
            let cachedFiles = this._cache.get(p.fullName);

            if (cachedFiles) resolve(cachedFiles);
            else {
                const files: Map<string, string> = new Map();
                const url = p.getData(`dist.tarball`);

                if (typeof url === "string") {
                    https.get(url, res => {
                        pipeline(
                            res,
                            new tar.Parse({
                                filter: (path, entry) => entry.type === "File",
                                onentry: entry => {
                                    let buffer: Buffer = Buffer.from(``);

                                    entry.on("data", chunk => {
                                        buffer = Buffer.concat([buffer, chunk]);
                                    });

                                    entry.on("end", chunk => {
                                        buffer += chunk;

                                        const file = buffer.toString("utf8");

                                        files.set(entry.path, file);
                                    });
                                }
                            }),
                            error => {
                                if (error) reject(error);
                                else {
                                    this._cache.set(p.fullName, { files });
                                    resolve({ files });
                                }
                            }
                        );
                    });
                } else {
                    reject(new Error(`No tarball url found for ${p.fullName}`));
                }
            }
        });
    }
}
