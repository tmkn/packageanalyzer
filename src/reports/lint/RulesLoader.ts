import path from "path";
import { z } from "zod";

import { ILintFile, ZodLintRule } from "./LintRule";

export interface IRulesLoader {
    getRules(): Promise<ILintFile>;
}

const LintFile = z.object({
    rules: z.array(ZodLintRule)
});

export class LintFileLoader implements IRulesLoader {
    constructor(private readonly _lintFile: string) {}

    async getRules(): Promise<ILintFile> {
        const importPath: string = path.isAbsolute(this._lintFile)
            ? this._lintFile
            : path.join(process.cwd(), this._lintFile);

        const importedLintFile = await import(importPath);

        if (this._isLintFile(importedLintFile)) {
            return importedLintFile;
        } else {
            throw new Error(`Invalid lint file format: ${this._lintFile}`);
        }
    }

    private _isLintFile(data: unknown): data is ILintFile {
        return LintFile.safeParse(data).success;
    }
}
