import { Command } from "clipanion";
import { Url } from "../utils/requests";
export declare class DependencyDumperCommand extends Command {
    package?: string;
    folder?: string;
    registry: Url;
    static usage: import("clipanion").Usage;
    static paths: string[][];
    execute(): Promise<void>;
}
//# sourceMappingURL=dependencyDumpCommand.d.ts.map