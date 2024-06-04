import { Package, IPackage } from "../package/package";
import { IPackageJson } from "../npm";
import { IPackageJsonProvider } from "../providers/provider";
import { ILogger } from "../loggers/ILogger";
import { DependencyTypes } from "../reports/Validation";
import { AttachmentData, Attachments, IAttachment } from "../attachments/Attachments";

export type PackageVersion = [name: string, version?: string];

// nested structure of resolved dependencies and their package.json
export interface IDependencyTreeNode {
    // a version including caret, tilde, etc.
    // undefined means it uses the latest available version
    rawVersion: string | undefined;
    resolvedVersion: string;
    pkgJson: IPackageJson;
    dependencies: IDependencyTreeNode[];
    isLoop: boolean;
}

interface IPackageVisitor<T extends Attachments> {
    visit: (depType?: DependencyTypes) => Promise<IPackage<AttachmentData<T>>>;
}

export class Visitor<T extends Attachments = IAttachment<string, any>>
    implements IPackageVisitor<T>
{
    private _dependencyTree: IDependencyTreeNode | undefined = undefined;
    private _depthStack: string[] = [];
    private _depType: DependencyTypes = "dependencies";

    constructor(
        private readonly _entry: PackageVersion,
        private readonly _provider: IPackageJsonProvider,
        private readonly _logger: ILogger,
        private readonly _attachments: Array<IAttachment<string, any>> = [],
        private readonly _maxDepth: number = Infinity
    ) {}

    async visit(depType = this._depType): Promise<Package<AttachmentData<T>>> {
        try {
            this._logger.start();
            this._logger.log("Fetching");
            this._depType = depType;

            try {
                if (!this._dependencyTree) {
                    this._depthStack = []; // reset stack

                    this._dependencyTree = await this._resolveDependencies(
                        this._entry,
                        this._depType,
                        this._provider
                    );
                }

                // add attachments
                const root = await this._createPackageTree(this._dependencyTree, this._attachments);

                return root;
            } catch (e) {
                this._logger.error("Error evaluating dependencies");

                throw e;
            }
        } finally {
            this._logger.stop();
        }
    }

    private async _resolveDependencies(
        entry: PackageVersion,
        type: DependencyTypes,
        provider: IPackageJsonProvider
    ): Promise<IDependencyTreeNode> {
        try {
            const [name, version] = entry;

            const dependency = await this._createDependencyTreeNode(name, version);
            const fullName = this._getFullName(dependency);

            this._logger.log(`Fetched ${fullName}`);
            this._depthStack.push(fullName);

            if (this._depthStack.length <= this._maxDepth) {
                const dependencies = dependency.pkgJson[type] ?? {};

                for (const [depName, rawDepVersion] of Object.entries(dependencies)) {
                    const directDependency = await this._createDependencyTreeNode(
                        depName,
                        rawDepVersion
                    );
                    const directDependencyFullName = this._getFullName(directDependency);

                    // look for loops in the dependency tree
                    // if loop, set flag and empty dependencies, return
                    if (this._depthStack.includes(directDependencyFullName)) {
                        directDependency.isLoop = true;

                        dependency.dependencies.push(directDependency);
                    }
                    // if not loop, resolve dependencies
                    else {
                        const dep = await this._resolveDependencies(
                            [depName, rawDepVersion],
                            type,
                            provider
                        );

                        dependency.dependencies.push(dep);
                    }
                }
            }

            Object.freeze(dependency.dependencies);

            return Object.freeze(dependency);
        } finally {
            this._depthStack.pop();
        }
    }

    private _getFullName(pkg: IDependencyTreeNode): string {
        return `${pkg.pkgJson.name}@${pkg.pkgJson.version}`;
    }

    private async _createPackageTree(
        resolvedDependency: IDependencyTreeNode,
        attachments: Array<IAttachment<string, any>> = []
    ): Promise<Package<AttachmentData<T>>> {
        const pkg = new Package<AttachmentData<T>>(resolvedDependency.pkgJson);

        pkg.isLoop = resolvedDependency.isLoop;
        await this._addAttachment(pkg);

        for (const dependency of resolvedDependency.dependencies) {
            const child = await this._createPackageTree(dependency, attachments);

            pkg.addDependency(child);
        }

        return pkg;
    }

    private async _addAttachment(p: Package<AttachmentData<T>>): Promise<void> {
        const totalAttachments = this._attachments.length;

        for (const [i, attachment] of this._attachments.entries()) {
            try {
                const attachmentMsg = `[${p.fullName}][Attachment: ${numPadding(
                    i,
                    totalAttachments
                )} - ${attachment.name}]`;
                this._logger.log(attachmentMsg);

                const data = await attachment.apply({
                    p,
                    logger: (msg: string) => this._logger.log(`${attachmentMsg} - ${msg}`)
                });

                p.setAttachmentData(attachment.key, data);
            } catch {
                this._logger.log(`Failed to apply attachment: ${attachment.name}`);
            }
        }
    }

    private async _createDependencyTreeNode(
        name: string,
        version: string | undefined
    ): Promise<IDependencyTreeNode> {
        const pkgJson = await this._provider.getPackageJson(name, version);

        return {
            rawVersion: version,
            resolvedVersion: pkgJson.version,
            pkgJson,
            dependencies: [],
            isLoop: false
        };
    }
}

export function getPackageVersionfromString(name: string): PackageVersion {
    const isScoped: boolean = name.startsWith(`@`);
    const [part1, part2, ...rest] = isScoped ? name.slice(1).split("@") : name.split("@");

    if (rest.length > 0) throw new Error(`Too many split tokens`);

    if (part1) {
        if (part2?.trim()?.length === 0)
            throw new Error(`Unable to determine version from "${name}"`);

        return isScoped ? [`@${part1}`, part2] : [part1, part2];
    }

    throw new Error(`Couldn't parse fullName token`);
}

export function numPadding(i: number, total: number): string {
    const digits = total.toString().length;
    const iPadding = `${i + 1}`.padStart(digits);

    return `${iPadding}/${total}`;
}
