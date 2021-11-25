/// <reference types="node" />
import { Writable } from "stream";
declare type LineKeyValue = [string, string];
export interface IFormatter {
    writeLine: (line: string) => void;
    writeGroup: (lines: Array<LineKeyValue | string>) => void;
    writeIdentation: (lines: [string, ...string[]], padding: number) => void;
}
export declare class Formatter implements IFormatter {
    private _writer;
    constructor(_writer: Writable);
    writeLine(line: string): void;
    writeGroup(lines: Array<LineKeyValue | string>): void;
    writeIdentation(lines: [string, ...string[]], padding: number): void;
}
export {};
//# sourceMappingURL=formatter.d.ts.map