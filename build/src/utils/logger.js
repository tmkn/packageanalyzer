"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.numPadding = exports.OraLogger = void 0;
const ora = require("ora");
class OraLogger {
    constructor() {
        this._logger = ora();
    }
    start() {
        this._logger.start();
    }
    stop() {
        this._logger.stop();
    }
    log(msg) {
        this._logger.text = msg;
        this._logger.render();
    }
    error(msg) {
        this._logger.stopAndPersist({
            symbol: "❌ ",
            text: msg
        });
    }
}
exports.OraLogger = OraLogger;
function numPadding(i, total) {
    const digits = total.toString().length;
    const iPadding = `${i + 1}`.padStart(digits);
    return `${iPadding}/${total}`;
}
exports.numPadding = numPadding;
//# sourceMappingURL=logger.js.map