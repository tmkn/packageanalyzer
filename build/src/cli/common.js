"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.daysAgo = exports.getVersion = exports.isValidDependencyType = exports.defaultDependencyType = void 0;
const path = require("path");
const fs = require("fs");
const dayjs = require("dayjs");
exports.defaultDependencyType = "dependencies";
function isValidDependencyType(type) {
    if (typeof type === "string" && (type === "dependencies" || type === "devDependencies"))
        return true;
    return false;
}
exports.isValidDependencyType = isValidDependencyType;
function getVersion() {
    try {
        const file = path.join(__dirname, "./../../../package.json");
        return JSON.parse(fs.readFileSync(file, "utf8")).version;
    }
    catch (e) {
        return "version parse error!";
    }
}
exports.getVersion = getVersion;
function daysAgo(date) {
    return `(${dayjs(new Date()).diff(date, "day")} days ago)`;
}
exports.daysAgo = daysAgo;
//# sourceMappingURL=common.js.map