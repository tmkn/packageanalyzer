import { Writable } from "stream";

type LineKeyValue = [string, string];

export interface IFormatter {
    writeLine: (line: string) => void;
    writeGroup: (lines: Array<LineKeyValue | string>) => void;
    writeIdentation: (lines: [string, ...string[]], padding: number) => void;
}

export class Formatter implements IFormatter {
    constructor(private readonly _writer: Writable) {}

    writeLine(line: string): void {
        this._writer.write(`${line}\n`);
    }

    writeGroup(lines: Array<LineKeyValue | string>): void {
        const padding: number =
            lines.reduce((prev, current) => {
                if (Array.isArray(current)) {
                    const [key] = current;

                    if (key.length > prev) return key.length;
                }

                return prev;
            }, 0) + 2;

        for (const line of lines) {
            if (typeof line === "string") {
                this.writeLine(line);
            } else {
                const [key, value] = line;
                const keyPadding = `${key}:`.padEnd(padding);

                this.writeLine(`${keyPadding}${value}`);
            }
        }
    }

    writeIdentation(lines: [string, ...string[]], padding: number): void {
        const padStr = new Array(padding).fill(" ").join("");
        const [header, ...rest] = lines;

        this.writeLine(header);

        for (const line of rest) {
            this.writeLine(`${padStr}${line}`);
        }
    }
}
