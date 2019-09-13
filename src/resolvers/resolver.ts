import { IPackageProvider } from "../providers/folder";
import { PackageAnalytics } from "../analyzers/package";
import { INpmKeyValue, INpmPackage } from "../npm";
import { ILogger } from "../logger";
import { OnlinePackageProvider } from "../providers/online";

export type EntryPackage = () => string | [string, string];

interface IResolverConstructor {
    new (entry: EntryPackage, provider: IPackageProvider, logger: ILogger): IPackageResolver;
}

interface IPackageResolver {
    resolve: () => Promise<PackageAnalytics>;
}

export const Resolver: IResolverConstructor = class Resolver implements IPackageResolver {
    private _depth: string[] = [];

    constructor(
        private _entry: EntryPackage,
        private _provider: IPackageProvider,
        private _logger: ILogger
    ) {}

    async resolve(): Promise<PackageAnalytics> {
        try {
            const entry = this._entry();
            const rootPkg = Array.isArray(entry)
                ? await this._provider.getPackageByVersion(entry[0], entry[1])
                : await this._provider.getPackageByVersion(entry);
            const root: PackageAnalytics = new PackageAnalytics(rootPkg);

            this._logger.start();
            this._logger.log("Fetching");

            await addPublished(root, this._provider);

            try {
                await this.walkDependencies(root, rootPkg.dependencies);
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

    private async walkDependencies(
        parent: PackageAnalytics,
        dependencies: INpmKeyValue | undefined
    ): Promise<void> {
        try {
            const dependencyList = typeof dependencies !== "undefined" ? dependencies : [];
            const libs = Object.entries(dependencyList);
            const packages: INpmPackage[] = [];

            for await (const subPackages of this._provider.getPackagesByVersion(libs)) {
                packages.push(...subPackages);
            }

            for (const p of packages) {
                const dependency = new PackageAnalytics(p);

                this._logger.log(`Fetched ${p.name}`);
                await addPublished(dependency, this._provider);
                parent.addDependency(dependency);

                if (this._depth.includes(dependency.fullName)) {
                    dependency.isLoop = true;
                } else {
                    this._depth.push(dependency.fullName);

                    await this.walkDependencies(dependency, p.dependencies);
                }
            }
            this._depth.pop();
        } catch (e) {
            this._depth.pop();

            throw e;
        }
    }
};

export async function addPublished(
    pa: PackageAnalytics,
    provider: IPackageProvider
): Promise<void> {
    if (!(provider instanceof OnlinePackageProvider)) {
        return;
    }

    const info = await provider.getPackageInfo(pa.name);

    if (!info) return;

    const time = info.time;
    const released = time[pa.version];

    if (!released) return;

    pa.published = new Date(released);
}
