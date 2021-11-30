"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.foo = exports.numPadding = void 0;
function numPadding(i, total) {
    const digits = total.toString().length;
    const iPadding = `${i + 1}`.padStart(digits);
    return `${iPadding}/${total}`;
}
exports.numPadding = numPadding;
exports.foo = 3;
//# sourceMappingURL=Ilogger.js.map