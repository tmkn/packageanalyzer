import * as path from "path";
import { promises as fs } from "fs";

import { Package } from "../package/package";
import { OnlinePackageProvider } from "../providers/online";
import { PackageVersion, Visitor } from "../visitors/visitor";
import { OraLogger } from "./logger";
import { DependencyMetrics } from "../extensions/metrics/DependencyMetrics";

export class DependencyDumper {
    pkg?: Package;

    private _provider?: OnlinePackageProvider;

    async collect(pkg: PackageVersion, repoUrl: string): Promise<void> {
        this._provider = new OnlinePackageProvider(repoUrl);

        const visitor = new Visitor(pkg, this._provider, new OraLogger());
        this.pkg = await visitor.visit();
    }

    async save(baseDir: string): Promise<void> {
        if (!this.pkg || !this._provider) throw new Error(`pkg or provider is undefined`);

        const distinct: Set<string> = new DependencyMetrics(this.pkg).distinctByName;
        const logger = new OraLogger();

        fs.mkdir(baseDir, { recursive: true });

        logger.start();

        try {
            for (const [i, dependency] of [...distinct].sort().entries()) {
                const data = await this._provider.getPackageInfo(dependency);
                const folder = this._getFolder(baseDir, dependency);
                const fullPath = path.join(folder, `package.json`);

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
            logger.log(
                `Saved ${distinct.size} dependencies for ${this.pkg.fullName} at ${baseDir}`
            );
            logger.stop();
        }
    }

    private _getFolder(baseDir: string, pkgName: string): string {
        const parts = pkgName.split(`/`).filter(part => part !== ``);

        return path.join(baseDir, ...parts);
    }
}
