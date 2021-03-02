import * as http from "http";
import * as https from "https";

function downloadHttp(url: string, timeoutLimit: number): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        http.get(url, res => {
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

export async function downloadHttpJson<T extends object>(
    url: string,
    timeoutLimit = 10000
): Promise<T | null> {
    const maxRetries = 4;
    let retries = 0;

    while (retries < maxRetries) {
        try {
            const response = await downloadHttp(url, timeoutLimit);

            return JSON.parse(response);
        } catch (e) {
            retries++;

            continue;
        }
    }

    return null;
}

/* istanbul ignore next */
export function downloadJsonHttps<T extends object>(url: string): Promise<T> {
    return new Promise<T>((resolve, reject) => {
        https
            .get(url, res => {
                const { statusCode } = res;
                let data = "";

                if (statusCode !== 200) {
                    reject(`Server Error '${url}'`);
                }

                res.setEncoding("utf8");
                res.on("data", chunk => {
                    data += chunk;
                });
                res.on("end", () => {
                    try {
                        resolve(JSON.parse(data));
                    } catch {
                        reject(`Parse Error`);
                    }
                });
            })
            .on("error", e => {
                console.log(url);
                reject(e);
            });
    });
}
