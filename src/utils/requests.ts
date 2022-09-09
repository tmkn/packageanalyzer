import * as http from "http";
import * as https from "https";

import * as t from "io-ts";

export type Url = `http://${string}` | `https://${string}`;

export const urlType = new t.Type<Url>(
    "urlType",
    (input: unknown): input is Url =>
        typeof input === "string" && (input.startsWith(`http://`) || input.startsWith(`https://`)),
    (input, context) => {
        if (
            typeof input === "string" &&
            (input.startsWith(`http://`) || input.startsWith(`https://`))
        ) {
            return t.success(input as Url);
        }

        return t.failure(
            input,
            context,
            `Expected "dependencies" or "devDependencies" but got "${input}"`
        );
    },
    t.identity
);

function download(url: Url, timeoutLimit: number): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        /**
         * if startsWith http
         * elseif startsWith https
         * else reject
         */
        if (!url.startsWith(`http://`) && !url.startsWith(`https://`))
            reject(`Wrong protocol: ${url}`);

        const protocol = url.startsWith(`http://`) ? http : https;

        protocol
            .get(url, res => {
                const { statusCode } = res;
                let data = "";

                if (statusCode !== 200) {
                    reject(`Server Error '${url}'`);
                    clearTimeout(id);
                }

                res.setEncoding("utf8");
                res.on("data", chunk => {
                    data += chunk;
                });
                res.on("end", () => {
                    resolve(data);
                    clearTimeout(id);
                });
            })
            .on("error", () => {
                reject();
                clearTimeout(id);
            })
            .setTimeout(timeoutLimit, () => {
                reject(`Timeout '${url}'`);
                clearTimeout(id);
            });

        const id = setTimeout(() => {
            reject(`Timeout 2 '${url}'`);
            clearTimeout(id);
        }, timeoutLimit);
    });
}

export async function downloadJson<T extends object>(
    url: Url,
    timeoutLimit = 10000
): Promise<T | null> {
    const maxRetries = 4;
    let retries = 0;

    while (retries < maxRetries) {
        try {
            const response = await download(url, timeoutLimit);

            return JSON.parse(response);
        } catch (e) {
            retries++;

            continue;
        }
    }

    return null;
}
