import { z } from "zod";

import { type ILintFile, ZodLintRule } from "./LintRule.js";
import { loadConfig } from "../../utils/configLoader.js";

export interface IRulesLoader {
    getRules(): Promise<ILintFile>;
}

const LintFile = z.object({
    rules: z.array(ZodLintRule)
});

export class LintFileLoader implements IRulesLoader {
    constructor(private readonly _lintFile: string) {}

    async getRules(): Promise<ILintFile> {
        const importedLintFile = await loadConfig(this._lintFile);

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
