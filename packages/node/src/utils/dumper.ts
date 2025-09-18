import * as path from "path";
import { promises as fs } from "fs";

import { type IPackage } from "../../../shared/src/package/package.js";
import { OnlinePackageProvider } from "../providers/online.js";
import { Visitor } from "../../../shared/src/visitors/visitor.js";
import { OraLogger } from "../loggers/OraLogger.js";
import { DependencyUtilities } from "../extensions/utilities/DependencyUtilities.js";
import { isReportConfigArray, type ReportConfigs } from "../../../shared/src/reports/Report.js";
import type { Url } from "../../../shared/src/reports/Validation.js";

export class DependencyDumper {
    pkgs: IPackage[] = [];

    private _provider?: OnlinePackageProvider;

    async collect(configs: ReportConfigs, repoUrl: Url): Promise<void> {
        this._provider = new OnlinePackageProvider(repoUrl);

        if (isReportConfigArray(configs)) {
            for (const entry of configs) {
                const visitor = new Visitor(entry.pkg, this._provider, new OraLogger());
                const pkg = await visitor.visit();
                this.pkgs.push(pkg);
            }
        } else {
            const visitor = new Visitor(configs.pkg, this._provider, new OraLogger());
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
            for (const [i, dependency] of [...distinct]
                .sort((a, b) => a.localeCompare(b))
                .entries()) {
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
