import { INpmPackage, INpmKeyValue } from "../npm";
import { PackageAnalytics } from "../analyzer";
import { logLastLine } from "../logger";
import { IPackageProvider } from "../providers/folderProvider";
import { OnlinePackageProvider } from "../providers/onlineProvider";

//resolves dependencies based on the package name
//will load latest, if no version is specified
export async function resolveFromName(
    args: string | [string, string],
    provider: IPackageProvider
): Promise<PackageAnalytics> {
    try {
        let name: string;
        let version: string | undefined = undefined;
        let depth: string[] = [];

        Array.isArray(args) ? ([name, version] = args) : (name = args);

        let rootPkg: INpmPackage = await provider.getPackageByVersion(name, version);
        let root: PackageAnalytics = new PackageAnalytics(rootPkg);

        await addPublished(root, provider);

        try {
            console.log(`Resolving dependencies for ${root.fullName}`);
            await walkDependencies(provider, root, rootPkg.dependencies, depth);
        } catch (e) {
            console.log(`Error evaluating dependencies`);
            throw e;
        }

        console.log(`Done\n`);

        return root;
    } catch (e) {
        throw e;
    }
}

export async function walkDependencies(
    npm: IPackageProvider,
    parent: PackageAnalytics,
    dependencies: INpmKeyValue | undefined,
    depth: string[]
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

            await addPublished(dependency, npm);
            parent.addDependency(dependency);

            if (depth.includes(dependency.fullName)) {
                logLastLine(`loop detected: ${dependency.fullName}`);

                dependency.isLoop = true;
            } else {
                depth.push(dependency.fullName);

                await walkDependencies(npm, dependency, p.dependencies, depth);
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
