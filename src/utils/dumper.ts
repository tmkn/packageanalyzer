import * as path from "path";
import { promises as fs } from "fs";

import { Package } from "../package/package";
import { OnlinePackageProvider } from "../providers/online";
import { Visitor } from "../visitors/visitor";
import { OraLogger } from "../loggers/OraLogger";
import { DependencyUtilities } from "../extensions/utilities/DependencyUtilities";
import { EntryTypes, isPackageVersionArray } from "../reports/Report";
import type { Url } from "../reports/Validation";

export class DependencyDumper {
    pkgs: Package[] = [];

    private _provider?: OnlinePackageProvider;

    async collect(pkg: EntryTypes, repoUrl: Url): Promise<void> {
        this._provider = new OnlinePackageProvider(repoUrl);

        if (isPackageVersionArray(pkg)) {
            for (const entry of pkg) {
                const visitor = new Visitor(entry, this._provider, new OraLogger());
                const pkg = await visitor.visit();
                this.pkgs.push(pkg);
            }
        } else {
            const visitor = new Visitor(pkg, this._provider, new OraLogger());
            const p = await visitor.visit();
            this.pkgs.push(p);
        }
    }

    async save(baseDir: string): Promise<void> {
        if (!this._provider) throw new Error(`pkg or provider is undefined`);

        const distinct: Set<string> = new Set();
        for (const pkg of this.pkgs) {
            const _distinct: Set<string> = new DependencyUtilities(pkg).withSelf.distinctNames;

            for (const name of _distinct) {
                distinct.add(name);
            }
        }

        const logger = new OraLogger();

        fs.mkdir(baseDir, { recursive: true });

        logger.start();

        try {
            for (const [i, dependency] of [...distinct].sort().entries()) {
                const data = await this._provider.getPackageMetadata(dependency);
                const folder = this._getFolder(baseDir, dependency);
                const fullPath = path.join(folder, `metadata.json`);

                if (typeof data === "undefined") {
                    throw new Error(`Data for ${dependency} was undefined`);
                }

                await fs.mkdir(folder, { recursive: true });
                await fs.writeFile(fullPath, JSON.stringify(data));

                const digits = distinct.size.toString().length;
                const prefix: string = `${i + 1}`.padStart(digits);
                logger.log(`[${prefix}/${distinct.size}]: ${fullPath}`);
            }
        } finally {
            const names: string = this.pkgs.map(pkg => pkg.fullName).join(`& `);
            logger.log(`Saved ${distinct.size} dependencies for ${names} at ${baseDir}`);
            logger.stop();
        }
    }

    private _getFolder(baseDir: string, pkgName: string): string {
        const parts = pkgName.split(`/`).filter(part => part !== ``);

        return path.join(baseDir, ...parts);
    }
}
