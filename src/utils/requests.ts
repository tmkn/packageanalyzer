import * as http from "http";
import * as https from "https";

import type { Url } from "../reports/Validation.js";

function download(url: Url, timeoutLimit: number): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        /**
         * if startsWith http
         * elseif startsWith https
         * else reject
         */
        if (!url.startsWith(`http://`) && !url.startsWith(`https://`))
            reject(new Error(`Wrong protocol: ${url}`));

        const protocol = url.startsWith(`http://`) ? http : https;

        protocol
            .get(url, res => {
                const { statusCode } = res;
                let data = "";

                if (statusCode !== 200) {
                    reject(new Error(`Server Error '${url}'`));
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
                reject(new Error());
                clearTimeout(id);
            })
            .setTimeout(timeoutLimit, () => {
                reject(new Error(`Timeout '${url}'`));
                clearTimeout(id);
            });

        const id = setTimeout(() => {
            reject(new Error(`Timeout 2 '${url}'`));
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
        } catch {
            retries++;

            continue;
        }
    }

    return null;
}
