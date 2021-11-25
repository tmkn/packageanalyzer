import { Command } from "clipanion";
import { IPackageJsonProvider } from "../providers/provider";
export declare class LoopsCommand extends Command {
    package?: string;
    type: string;
    static usage: import("clipanion").Usage;
    static PackageProvider?: IPackageJsonProvider;
    static paths: string[][];
    execute(): Promise<void>;
}
//# sourceMappingURL=loopsCommand.d.ts.map