import path from "path";
import { z } from "zod";

import { type ILintFile, ZodLintRule } from "./LintRule.js";

export interface IRulesLoader {
    getRules(): Promise<ILintFile>;
}

const LintFile = z.object({
    rules: z.array(ZodLintRule)
});

export class LintFileLoader implements IRulesLoader {
    constructor(private readonly _lintFile: string) {}

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

        const importedLintFile = await import(importPath);

        if (this._isLintFile(importedLintFile.default)) {
            return importedLintFile.default;
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
