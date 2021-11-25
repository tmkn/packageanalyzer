"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Formatter = void 0;
class Formatter {
    constructor(_writer) {
        this._writer = _writer;
    }
    writeLine(line) {
        this._writer.write(`${line}\n`);
    }
    writeGroup(lines) {
        const padding = lines.reduce((prev, current) => {
            if (Array.isArray(current)) {
                const [key] = current;
                if (key.length > prev)
                    return key.length;
            }
            return prev;
        }, 0) + 2;
        for (const line of lines) {
            if (typeof line === "string") {
                this.writeLine(line);
            }
            else {
                const [key, value] = line;
                const keyPadding = `${key}:`.padEnd(padding);
                this.writeLine(`${keyPadding}${value}`);
            }
        }
    }
    writeIdentation(lines, padding) {
        const padStr = new Array(padding).fill(" ").join("");
        const [header, ...rest] = lines;
        this.writeLine(header);
        for (const line of rest) {
            this.writeLine(`${padStr}${line}`);
        }
    }
}
exports.Formatter = Formatter;
//# sourceMappingURL=formatter.js.map