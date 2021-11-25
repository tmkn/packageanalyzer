import { Command } from "clipanion";
export declare class NpmDumpCommand extends Command {
    npmFile?: string;
    package?: string;
    static usage: import("clipanion").Usage;
    static paths: string[][];
    execute(): Promise<void>;
}
//# sourceMappingURL=npmDumpCommand.d.ts.map