"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.downloadJson = void 0;
const http = require("http");
const https = require("https");
function download(url, timeoutLimit) {
    return new Promise((resolve, reject) => {
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
            }
            catch (e) {
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
async function downloadJson(url, timeoutLimit = 10000) {
    const maxRetries = 4;
    let retries = 0;
    while (retries < maxRetries) {
        try {
            const response = await download(url, timeoutLimit);
            return JSON.parse(response);
        }
        catch (e) {
            retries++;
            continue;
        }
    }
    return null;
}
exports.downloadJson = downloadJson;
//# sourceMappingURL=requests.js.map