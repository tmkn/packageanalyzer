import * as ora from "ora";

import { INpmPackage, INpmKeyValue } from "../npm";
import { PackageAnalytics } from "../analyzer";
import { IPackageProvider } from "../providers/folderProvider";
import { OnlinePackageProvider } from "../providers/onlineProvider";

//resolves dependencies based on the package name
//will load latest, if no version is specified
export async function resolveFromName(
    args: string | [string, string],
    provider: IPackageProvider
): Promise<PackageAnalytics> {
    const logger = ora("Fetching").start();

    try {
        let name: string;
        let version: string | undefined = undefined;
        let depth: string[] = [];

        Array.isArray(args) ? ([name, version] = args) : (name = args);

        let rootPkg: INpmPackage = await provider.getPackageByVersion(name, version);
        let root: PackageAnalytics = new PackageAnalytics(rootPkg);

        await addPublished(root, provider);

        try {
            await walkDependencies(provider, root, rootPkg.dependencies, depth, logger);
        } catch (e) {
            logger.stopAndPersist({
                symbol: "❌ ",
                text: "Error evaluating dependencies"
            });

            throw e;
        }

        logger.stop();

        return root;
    } catch (e) {
        logger.stop();

        throw e;
    }
}

export async function walkDependencies(
    npm: IPackageProvider,
    parent: PackageAnalytics,
    dependencies: INpmKeyValue | undefined,
    depth: string[],
    logger: ora.Ora
): Promise<void> {
    try {
        let dependencyList = typeof dependencies !== "undefined" ? dependencies : [];
        let libs = Object.entries(dependencyList);
        let packages: INpmPackage[] = [];

        for await (const subPackages of npm.getPackagesByVersion(libs)) {
            packages.push(...subPackages);
        }

        for (const p of packages) {
            let dependency = new PackageAnalytics(p);

            logger.text = `Fetched ${p.name}`;
            await addPublished(dependency, npm);
            parent.addDependency(dependency);

            if (depth.includes(dependency.fullName)) {
                dependency.isLoop = true;
            } else {
                depth.push(dependency.fullName);

                await walkDependencies(npm, dependency, p.dependencies, depth, logger);
            }
        }
        depth.pop();
    } catch (e) {
        depth.pop();
        throw e;
    }
}

async function addPublished(pa: PackageAnalytics, provider: IPackageProvider): Promise<void> {
    if (!(provider instanceof OnlinePackageProvider)) {
        return;
    }

    let info = await provider.getPackageInfo(pa.name);

    if (!info) return;

    let time = info.time;
    let released = time[pa.version];

    if (!released) return;

    pa.published = new Date(released);
}
