import { Package } from "../../index.web";

interface IScripts {
    preInstall?: string;
    postInstall?: string;
}

type ScriptTuple = [Package, string];

export class InstallScriptsUtilities {
    private _installScripts: Map<Package, IScripts> = new Map();

    constructor(private _entry: Package) {
        _entry.visit(pkg => {
            const preInstall = pkg.getData(`scripts.preinstall`);
            const postInstall = pkg.getData(`scripts.postinstall`);

            if (preInstall) {
                let value = this._installScripts.get(pkg) ?? {};

                value = {
                    ...value,
                    preInstall: preInstall.toString()
                };

                this._installScripts.set(pkg, value);
            }

            if (postInstall) {
                let value = this._installScripts.get(pkg) ?? {};

                value = {
                    ...value,
                    preInstall: postInstall.toString()
                };

                this._installScripts.set(pkg, value);
            }
        }, true);
    }

    get preInstallScripts(): ScriptTuple[] {
        const scripts: ScriptTuple[] = [];

        for (const [pkg, { preInstall }] of this._installScripts) {
            if (preInstall) scripts.push([pkg, preInstall]);
        }

        return scripts;
    }

    get postInstallScripts(): ScriptTuple[] {
        const scripts: ScriptTuple[] = [];

        for (const [pkg, { postInstall }] of this._installScripts) {
            if (postInstall) scripts.push([pkg, postInstall]);
        }

        return scripts;
    }
}
