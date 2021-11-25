import { Command } from "clipanion";
import { DependencyTypes } from "../visitors/visitor";
export declare class TreeCommand extends Command {
    package?: string;
    type: DependencyTypes;
    folder?: string;
    static usage: import("clipanion").Usage;
    static paths: string[][];
    execute(): Promise<void>;
}
//# sourceMappingURL=treeCommand.d.ts.map