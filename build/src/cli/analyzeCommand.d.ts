import { Command } from "clipanion";
export declare class AnalyzeCommand extends Command {
    package?: string;
    type?: string;
    folder?: string;
    full: boolean;
    static usage: import("clipanion").Usage;
    static paths: string[][];
    execute(): Promise<void>;
}
//# sourceMappingURL=analyzeCommand.d.ts.map