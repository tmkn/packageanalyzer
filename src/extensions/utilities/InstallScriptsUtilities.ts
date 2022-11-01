import { Package } from "../../package/package";

interface InstallScripts {
    postinstall?: string;
    preinstall?: string;
}

// actually with a little rework this should work with any key in the package.json... but no use case yet
export class InstallScriptUtilities {
    postinstallScripts: Map<string, string>;
    preinstallScripts: Map<string, string>;

    constructor(private readonly _entry: Package) {
        const tuples = this._entry
            .collect<InstallScripts>(pkg => {
                const postinstall = pkg.getData("scripts.postinstall");
                const preinstall = pkg.getData("scripts.preinstall");

                return {
                    postinstall: postinstall ? postinstall + "" : undefined,
                    preinstall: preinstall ? preinstall + "" : undefined
                };
            })
            .flatten();

        const postInstallTuples: [string, string][] = tuples
            .filter(([_, scripts]) => scripts.postinstall)
            .map(([[pkg], scripts]) => [pkg.fullName, scripts.postinstall!]);

        this.postinstallScripts = new Map(postInstallTuples);

        const preInstallTuples: [string, string][] = tuples
            .filter(([_, scripts]) => scripts.preinstall)
            .map(([[pkg], scripts]) => [pkg.fullName, scripts.preinstall!]);

        this.preinstallScripts = new Map(preInstallTuples);
    }
}
