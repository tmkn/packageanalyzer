import * as http from "http";
import * as https from "https";
import { INpmSingleStatistic, INpmRangeStatistic, INpmAllPackagesResponse } from "./npm";

function downloadHttp(url: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        http.get(url, res => {
            try {
                let { statusCode } = res;
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
                        resolve(data);
                    } catch {
                        reject();
                    }
                });
            } catch (e) {
                reject();
            }
        })
            .on("error", e => {
                reject();
            })
            .setTimeout(500, () => {
                reject(`Timeout '${url}'`);
            });
    });
}

export async function downloadHttpJson<T extends object>(url: string): Promise<T | null> {
    const maxRetries = 4;
    let retries = 0;

    while (retries < maxRetries) {
        try {
            let response = await downloadHttp(url);
            let data: T = JSON.parse(response);

            return data;
        } catch {
            retries++;

            continue;
        }
    }

    return null;
}

function downloadJsonHttps<T extends object>(url: string): Promise<T> {
    return new Promise<T>((resolve, reject) => {
        https
            .get(url, res => {
                let { statusCode } = res;
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

export function numberOfDownloadsLastWeek(name: string): Promise<INpmSingleStatistic> {
    return downloadJsonHttps(
        `https://api.npmjs.org/downloads/point/last-week/${encodeURIComponent(name)}`
    );
}

export function numberOfDownloadsRange(
    name: string,
    from: string,
    to: string
): Promise<INpmRangeStatistic> {
    return downloadJsonHttps(
        `https://api.npmjs.org/downloads/range/${encodeURIComponent(from)}:${encodeURIComponent(
            to
        )}/${encodeURIComponent(name)}`
    );
}

interface IGithubRepository {}
export function githubRepositoryInfo(user: string, repo: string): Promise<IGithubRepository> {
    return downloadJsonHttps(`https://api.github.com/repos/${user}/${repo}`);
}

export function npmAllPackageNames(): Promise<INpmAllPackagesResponse> {
    //limit=23
    //offset=23
    return downloadJsonHttps(`https://replicate.npmjs.com/_all_docs`);
}
