import { promises as fs } from "fs";
import * as path from "path";

import { Writable } from "stream";
import { OnlinePackageProvider, OraLogger } from "../src";
import { IDecorator } from "../src/extensions/decorators/Decorator";
import { DependencyMetrics } from "../src/extensions/metrics/DependencyMetrics";
import { Package } from "../src/package/package";
import { IPackageVersionProvider } from "../src/providers/folder";
import { IReport } from "../src/reports/Report";
import { IFormatter } from "../src/utils/formatter";
import { DependencyTypes, PackageVersion, Visitor } from "../src/visitors/visitor";

export class TestWritable extends Writable {
    public lines: string[] = [];

    _write(chunk: any, encoding: BufferEncoding, callback: (error?: Error | null) => void): void {
        const data: string = chunk.toString();

        if (data.endsWith(`\n`)) this.lines.push(data.slice(0, data.length - 1));
        else this.lines.push(data);

        callback();
    }
}

interface ITestReport {
    pkg: PackageVersion;
    report: (pkg: Package, formatter: IFormatter) => Promise<void>;

    decorators?: IDecorator<any>[];
    provider?: IPackageVersionProvider;
    type?: DependencyTypes;
    depth?: number;
}

export class TestReport implements IReport<ITestReport> {
    name = `Test Report`;
    pkg: PackageVersion;

    decorators?: IDecorator<any>[];
    provider?: IPackageVersionProvider;
    type?: DependencyTypes;
    depth?: number;

    constructor(public params: ITestReport) {
        this.pkg = params.pkg;

        this.decorators = params.decorators;
        this.provider = params.provider;
        this.type = params.type;
        this.depth = params.depth;
    }

    async report(pkg: Package, formatter: IFormatter): Promise<void> {
        return this.params.report(pkg, formatter);
    }
}

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
