import * as http from "http";
import * as https from "https";

export type Url = `http://${string}` | `https://${string}`;

function download(url: Url, timeoutLimit: number): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        //todo check if TS 4.5 can make sense of startsWith
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
                try {
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
                } catch (e) {
                    reject();
                }
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
