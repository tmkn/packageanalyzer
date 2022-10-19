import { Package } from "../../package/package";

type ScriptTuple = [Package, string];

interface IScriptEntries {
    "scripts.preinstall": string;
    "scripts.postinstall": string;
}

type ScriptEntries = Partial<IScriptEntries>;

type ScriptKeys = keyof IScriptEntries;

// actually with a little rework this should work with any key in the package.json... but no use case yet
export class InstallScriptsUtilities {
    private _installScripts: Map<ScriptKeys, Map<Package, ScriptEntries>> = new Map();

    constructor(
        private readonly _entry: Package,
        private readonly _scriptKeys: ScriptKeys[] = ["scripts.postinstall", "scripts.preinstall"]
    ) {
        this._entry.visit(pkg => {
            for (const scriptKey of this._scriptKeys) {
                const value = pkg.getData(scriptKey);

                if (typeof value !== "undefined") {
                    const entry =
                        this._installScripts.get(scriptKey) ?? new Map<Package, ScriptEntries>();
                    let scriptEntries = entry.get(pkg) ?? {};

                    scriptEntries = {
                        ...scriptEntries,
                        [scriptKey]: value + ""
                    };
                    entry.set(pkg, scriptEntries);

                    this._installScripts.set(scriptKey, entry);
                }
            }
        }, true);
    }

    private _getByScriptKey(scriptKey: ScriptKeys): Map<Package, ScriptEntries> {
        return this._installScripts.get(scriptKey) ?? new Map();
    }

    private _getAsTuple(scriptKey: ScriptKeys): ScriptTuple[] {
        const scriptMap = this._getByScriptKey(scriptKey);
        const scriptTuples: ScriptTuple[] = [];

        for (const [pkg, scriptEntries] of scriptMap) {
            const entry = scriptEntries[scriptKey];

            if (entry) scriptTuples.push([pkg, entry]);
        }

        return scriptTuples;
    }

    get preInstallScripts(): ScriptTuple[] {
        return this._getAsTuple("scripts.preinstall");
    }

    get postInstallScripts(): ScriptTuple[] {
        return this._getAsTuple("scripts.postinstall");
    }
}
