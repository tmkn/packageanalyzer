import * as https from "https";

import * as tar from "tar";

import { classToAttachmentFn, type IApplyArgs, type IClassAttachment } from "./Attachments.js";
import { pipeline } from "stream";

// process tarball, discard directories and save files to files map
function processTar(files: Map<string, string>): tar.Parser {
    return tar.t({
        filter: (path, entry) => entry instanceof tar.ReadEntry && entry.type === "File",
        onReadEntry: entry => {
            let buffer: Buffer = Buffer.from(``);

            entry.on("data", chunk => {
                buffer = Buffer.concat([buffer, chunk]);
            });

            entry.on("end", () => {
                const file = buffer.toString("utf8");
                files.set(entry.path, file);
            });
        }
    });
}

export interface ITarData {
    files: Map<string, string>;
}

type TarCache = Map<string, ITarData>;

export class TarAttachment implements IClassAttachment<ITarData> {
    constructor(private _cache: TarCache = new Map()) {}

    apply({ p }: IApplyArgs): Promise<ITarData> {
        return new Promise<ITarData>((resolve, reject) => {
            const cachedFiles = this._cache.get(p.fullName);

            if (cachedFiles) resolve(cachedFiles);
            else {
                const files: Map<string, string> = new Map();
                const url = p.getData(`dist.tarball`);

                if (typeof url === "string") {
                    https.get(url, res => {
                        pipeline(res, processTar(files), error => {
                            if (error) reject(error);
                            else {
                                this._cache.set(p.fullName, { files });
                                resolve({ files });
                            }
                        });
                    });
                } else {
                    reject(new Error(`No tarball url found for ${p.fullName}`));
                }
            }
        });
    }
}

export const createTarAttachment = classToAttachmentFn(TarAttachment);
