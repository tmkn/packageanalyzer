import { IPackageVersionProvider } from "../providers/folder";
import { PackageAnalytics } from "../analyzers/package";
import { INpmKeyValue, INpmPackageVersion, PackageVersion } from "../npm";
import { ILogger } from "../logger";
import { PackageProvider } from "../providers/online";

interface IVisitorConstructor {
    new (
        entry: PackageVersion,
        provider: IPackageVersionProvider,
        logger: ILogger
    ): IPackageVisitor;
}

interface IPackageVisitor {
    visit: () => Promise<PackageAnalytics>;
}

export const Visitor: IVisitorConstructor = class Visitor implements IPackageVisitor {
    private _depthStack: string[] = [];

    constructor(
        private readonly _entry: PackageVersion,
        private _provider: IPackageVersionProvider,
        private _logger: ILogger
    ) {}

    async visit(): Promise<PackageAnalytics> {
        try {
            const [name, version] = this._entry;
            const rootPkg = await this._provider.getPackageByVersion(name, version);
            const root: PackageAnalytics = new PackageAnalytics(rootPkg);

            this._logger.start();
            this._logger.log("Fetching");

            await addPublished(root, this._provider);

            try {
                await this.visitDependencies(root, rootPkg.dependencies);
            } catch (e) {
                this._logger.error("Error evaluating dependencies");

                throw e;
            }

            this._logger.stop();

            return root;
        } catch (e) {
            this._logger.stop();

            throw e;
        }
    }

    private async visitDependencies(
        parent: PackageAnalytics,
        dependencies: INpmKeyValue | undefined
    ): Promise<void> {
        try {
            const dependencyList = typeof dependencies !== "undefined" ? dependencies : {};
            const libs = Object.entries(dependencyList);
            const packages: INpmPackageVersion[] = [];

            for await (const subPackages of this._provider.getPackagesByVersion(libs)) {
                packages.push(subPackages);
            }

            for (const p of packages) {
                const dependency = new PackageAnalytics(p);

                this._logger.log(`Fetched ${p.name}`);
                await addPublished(dependency, this._provider);
                parent.addDependency(dependency);

                if (this._depthStack.includes(dependency.fullName)) {
                    dependency.isLoop = true;
                } else {
                    this._depthStack.push(dependency.fullName);

                    await this.visitDependencies(dependency, p.dependencies);
                }
            }
            this._depthStack.pop();
        } catch (e) {
            this._depthStack.pop();

            throw e;
        }
    }
};

export async function addPublished(
    pa: PackageAnalytics,
    provider: IPackageVersionProvider
): Promise<void> {
    if (!(provider instanceof PackageProvider)) {
        return;
    }

    const info = await provider.getPackageInfo(pa.name);

    if (!info) return;

    const time = info.time;
    const released = time[pa.version];

    if (!released) return;

    pa.published = new Date(released);
}
