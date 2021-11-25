import { Command } from "clipanion";
export declare class LicenseCheckCommand extends Command {
    package?: string;
    type: string;
    allowList?: string[];
    grouped: boolean;
    folder?: string;
    static usage: import("clipanion").Usage;
    static paths: string[][];
    execute(): Promise<void>;
}
//# sourceMappingURL=licenseCommand.d.ts.map