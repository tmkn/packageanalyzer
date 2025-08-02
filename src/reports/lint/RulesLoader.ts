import path from "path";
import { z } from "zod";

import { createJiti } from "jiti";

import { type ILintFile, ZodLintRule } from "./LintRule.js";

export interface IRulesLoader {
    getRules(): Promise<ILintFile>;
}

// Interface for module loading to allow mocking in tests
export interface IModuleLoader {
    import(path: string): Promise<unknown>;
}

// Production jiti-based module loader
class JitiModuleLoader implements IModuleLoader {
    private _jiti = createJiti(import.meta.url);

    async import(path: string): Promise<unknown> {
        return this._jiti.import(path, { default: true });
    }
}

// Native module loader for testing/fallback
class NativeModuleLoader implements IModuleLoader {
    async import(path: string): Promise<unknown> {
        const module = await import(path);
        return (module as { default?: unknown }).default || module;
    }
}

const LintFile = z.object({
    rules: z.array(ZodLintRule)
});

export class LintFileLoader implements IRulesLoader {
    private _moduleLoader: IModuleLoader;

    constructor(
        private readonly _lintFile: string,
        moduleLoader?: IModuleLoader
    ) {
        // Allow injection of module loader for testing, default to jiti
        this._moduleLoader = moduleLoader || new JitiModuleLoader();
    }

    async getRules(): Promise<ILintFile> {
        let importPath: string = this._lintFile;

        // ! should be obsolete when moving to jiti !
        // windows needs file:// protocol for importing files
        // some tests provide a file:// path, as they are read from disk, use it as is
        // some tests provide a unix style path that is read from memory, handle like usual
        if (!this._isFileUrl(this._lintFile)) {
            importPath = path.isAbsolute(this._lintFile)
                ? this._lintFile
                : path.join(process.cwd(), this._lintFile);
        }

        const importedLintFile = await this._moduleLoader.import(importPath);

        if (this._isLintFile(importedLintFile)) {
            return importedLintFile;
        } else {
            throw new Error(`Invalid lint file format: ${this._lintFile}`);
        }
    }

    private _isLintFile(data: unknown): data is ILintFile {
        return LintFile.safeParse(data).success;
    }

    private _isFileUrl(inputString: string): boolean {
        try {
            const url = new URL(inputString);

            return url.protocol === "file:";
        } catch {
            return false;
        }
    }
}

// Export the native module loader for tests
export { NativeModuleLoader };
