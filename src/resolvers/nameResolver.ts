import { INpmPackage, INpmKeyValue } from "../npm";
import { PackageAnalytics } from "../analyzer";
import { logLastLine } from "../logger";
import { IPackageProvider } from "../providers/folderProvider";

//resolves dependencies based on the package name
//will load latest, if no version is specified
export async function resolveFromName(
    args: string | [string, string],
    provider: IPackageProvider
): Promise<PackageAnalytics> {
    let root: PackageAnalytics;
    let name: string;
    let version: string | undefined = undefined;
    let depth: string[] = [];

    Array.isArray(args) ? ([name, version] = args) : (name = args);

    let rootPkg: INpmPackage = await provider.getPackageByVersion(name, version);

    if (typeof rootPkg === "undefined") throw `Couldn't find root package ${name}@${version}`;

    root = new PackageAnalytics(rootPkg);

    try {
        console.log(`Resolving dependencies for ${root.fullName}`);
        await walkDependencies(provider, root, rootPkg.dependencies, depth);
    } catch (e) {
        console.log(`Error evaluating dependencies`);
        console.log(e);
    }

    console.log(`Done\n`);

    return root;
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
