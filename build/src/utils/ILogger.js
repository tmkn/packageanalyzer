"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.numPadding = void 0;
function numPadding(i, total) {
    const digits = total.toString().length;
    const iPadding = `${i + 1}`.padStart(digits);
    return `${iPadding}/${total}`;
}
exports.numPadding = numPadding;
//# sourceMappingURL=Ilogger.js.map