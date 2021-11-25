"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDownloadsLastWeek = exports.DownloadReport = void 0;
const requests_1 = require("../utils/requests");
const utils_1 = require("../visitors/utils");
const Report_1 = require("./Report");
class DownloadReport extends Report_1.AbstractReport {
    constructor(params) {
        super();
        this.params = params;
        this.name = `Download Report`;
        this.depth = 0;
        this.pkg = (0, utils_1.getPackageVersionfromString)(params.pkg);
    }
    async report(pkg, { stdoutFormatter }) {
        await cliDownloads(pkg.name, this.params.url ?? null, stdoutFormatter);
    }
}
exports.DownloadReport = DownloadReport;
async function cliDownloads(pkg, url, formatter) {
    try {
        const downloads = url !== null ? await getDownloadsLastWeek(pkg, url) : await getDownloadsLastWeek(pkg);
        formatter.writeLine(`${pkg}: ${downloads.downloads} Downloads`);
    }
    catch (e) {
        console.log(e);
        formatter.writeLine(`Couldn't get downloads for ${pkg}`);
    }
}
async function getDownloadsLastWeek(name, url = `https://api.npmjs.org/downloads/point/last-week/`) {
    const json = await (0, requests_1.downloadJson)(`${url}${encodeURIComponent(name)}`);
    if (json !== null)
        return json;
    throw new Error(`Couldn't get download numbers for ${name}`);
}
exports.getDownloadsLastWeek = getDownloadsLastWeek;
//# sourceMappingURL=DownloadCountReport.js.map