import * as path from "path";
import { promises as fs } from "fs";

import { Package } from "../package/package";
import { OnlinePackageProvider } from "../providers/online";
import { PackageVersion, Visitor } from "../visitors/visitor";
import { OraLogger } from "./logger";

export class DependencyDumper {
    pkg?: Package;

    private _provider?: OnlinePackageProvider;

    async collect(pkg: PackageVersion, repoUrl: string): Promise<void> {
        try {
            this._provider = new OnlinePackageProvider(repoUrl);

            const visitor = new Visitor(pkg, this._provider, new OraLogger());
            this.pkg = await visitor.visit();
        } catch (e) {
            console.log(e);
        }
    }

    async save(baseDir: string): Promise<void> {
        try {
            if (!this.pkg || !this._provider) return;

            const distinct: Set<string> = new Set();

            this.pkg.visit(pkg => {
                distinct.add(pkg.name);
            }, true);

            fs.mkdir(baseDir, { recursive: true });

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
                console.log(`[${prefix}/${distinct.size}]: ${fullPath}`);
            }

            console.log(`Saved ${distinct.size} dependencies for ${this.pkg.fullName}`);
        } catch (e) {
            console.log(e);
        }
    }

    private _getFolder(baseDir: string, pkgName: string): string {
        const parts = pkgName.split(`/`).filter(part => part !== ``);

        return path.join(baseDir, ...parts);
    }
}
