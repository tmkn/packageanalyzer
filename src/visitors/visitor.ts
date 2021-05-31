import * as path from "path";
import * as fs from "fs";

import { IPackageVersionProvider } from "../providers/folder";
import { Package } from "../package/package";
import { INpmKeyValue, INpmPackageVersion } from "../npm";
import { ILogger, numPadding } from "../utils/logger";
import { IDecorator } from "../extensions/decorators/Decorator";

export type PackageVersion = [name: string, version?: string];

interface IPackageVisitor {
    visit: (depType?: DependencyTypes) => Promise<Package>;
}

export type DependencyTypes = "dependencies" | "devDependencies";

export class Visitor implements IPackageVisitor {
    private _depthStack: string[] = [];
    private _depType: DependencyTypes = "dependencies";

    constructor(
        private readonly _entry: PackageVersion,
        private readonly _provider: IPackageVersionProvider,
        private readonly _logger: ILogger,
        private readonly _decorators: IDecorator<any, any>[] = [],
        private readonly _maxDepth: number = Infinity
    ) {}

    async visit(depType = this._depType): Promise<Package> {
        try {
            const [name, version] = this._entry;
            const rootPkg = await this._provider.getPackageByVersion(name, version);
            const root: Package = new Package(rootPkg);

            this._logger.start();
            this._logger.log("Fetching");
            this._depType = depType;

            await this._addDecorator(root);

            this._depthStack.push(root.fullName);
            this._logger.log(`Fetched ${root.fullName}`);

            try {
                if (this._depthStack.length <= this._maxDepth)
                    await this.visitDependencies(root, rootPkg[depType]);
            } catch (e) {
                this._logger.error("Error evaluating dependencies");

                throw e;
            }

            return root;
        } finally {
            this._logger.stop();
        }
    }

    private async visitDependencies(
        parent: Package,
        dependencies: INpmKeyValue | undefined
    ): Promise<void> {
        try {
            const dependencyField = typeof dependencies !== "undefined" ? dependencies : {};
            const dependencyArray = Object.entries(dependencyField);
            const packages: INpmPackageVersion[] = [];

            for await (const resolvedDependencies of this._provider.getPackagesByVersion(
                dependencyArray
            )) {
                packages.push(resolvedDependencies);
            }

            for (const p of packages) {
                const dependency = new Package(p);

                await this._addDecorator(dependency);

                this._logger.log(`Fetched ${dependency.fullName}`);
                parent.addDependency(dependency);

                if (this._depthStack.includes(dependency.fullName)) {
                    dependency.isLoop = true;
                } else {
                    if (this._depthStack.length < this._maxDepth) {
                        this._depthStack.push(dependency.fullName);
                        await this.visitDependencies(dependency, p[this._depType]);
                    }
                }
            }
        } finally {
            this._depthStack.pop();
        }
    }

    private async _addDecorator(p: Package): Promise<void> {
        const totalDecorators = this._decorators.length;

        for (const [i, decorator] of this._decorators.entries()) {
            try {
                const decoratorMsg = `[${p.fullName}][Decorator: ${numPadding(
                    i,
                    totalDecorators
                )} - ${decorator.name}]`;
                this._logger.log(decoratorMsg);

                const data = await decorator.apply({
                    p,
                    logger: (msg: string) => this._logger.log(`${decoratorMsg} - ${msg}`)
                });

                p.setDecoratorData(decorator.key, data);
            } catch {
                this._logger.log(`Failed to apply decorator: ${decorator.name}`);
            }
        }
    }
}

export function getPackageVersionfromString(name: string): PackageVersion {
    if (name.startsWith(`@`)) {
        const parts = name.slice(1).split("@");

        if (parts.length === 1) {
            return [`@${parts[0]}`, undefined];
        } else if (parts.length === 2) {
            if (parts[1].trim() !== "") return [`@${parts[0]}`, parts[1]];
        }

        throw new Error(`Unable to determine version from "${name}"`);
    } else {
        const parts = name.split("@");

        if (parts.length === 1) {
            return [`${parts[0]}`, undefined];
        } else if (parts.length === 2) {
            if (parts[1].trim() !== "") return [`${parts[0]}`, parts[1]];
        }

        throw new Error(`Unable to determine version from "${name}"`);
    }
}

export function getPackageVersionFromPackageJson(folder: string): PackageVersion {
    const packageJsonPath = path.join(folder, `package.json`);

    try {
        const content = fs.readFileSync(packageJsonPath, "utf8");
        const pkg: INpmPackageVersion = JSON.parse(content);

        return [pkg.name, pkg.version];
    } catch (e) {
        throw new Error(`Couldn't find package.json in ${folder}`);
    }
}
