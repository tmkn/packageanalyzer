import path from "path";
import { z } from "zod";

import { createJiti } from "jiti";
const jiti = createJiti(import.meta.url);

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

        let importedLintFile: unknown;
        
        // Use native dynamic imports in test environment to support vi.doMock()
        // jiti doesn't respect Vitest's module mocking system
        if (this._isTestEnvironment()) {
            const module = await import(importPath);
            importedLintFile = (module as { default?: unknown }).default || module;
        } else {
            importedLintFile = await jiti.import(importPath, { default: true });
        }

        if (this._isLintFile(importedLintFile)) {
            return importedLintFile;
        } else {
            throw new Error(`Invalid lint file format: ${this._lintFile}`);
        }
    }

    private _isLintFile(data: unknown): data is ILintFile {
        return LintFile.safeParse(data).success;
    }

    private _isTestEnvironment(): boolean {
        return (
            process.env.NODE_ENV === "test" ||
            process.env.VITEST === "true" ||
            typeof global !== "undefined" && 
            Object.prototype.hasOwnProperty.call(global, "vi") || 
            typeof globalThis !== "undefined" && 
            Object.prototype.hasOwnProperty.call(globalThis, "vi")
        );
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
