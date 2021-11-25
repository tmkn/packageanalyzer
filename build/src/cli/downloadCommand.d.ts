import { Command } from "clipanion";
import { IPackageJsonProvider } from "../providers/provider";
import { Url } from "../utils/requests";
export declare class DownloadCommand extends Command {
    package?: string;
    static usage: import("clipanion").Usage;
    static DownloadUrl?: Url;
    static PackageProvider?: IPackageJsonProvider;
    static paths: string[][];
    execute(): Promise<void>;
}
//# sourceMappingURL=downloadCommand.d.ts.map