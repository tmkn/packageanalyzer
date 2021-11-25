"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isUnpublished = void 0;
function isUnpublished(data) {
    if (typeof data === "object" && data !== null) {
        if ("time" in data) {
            if ("unpublished" in data.time)
                return true;
        }
    }
    return false;
}
exports.isUnpublished = isUnpublished;
//# sourceMappingURL=npm.js.map