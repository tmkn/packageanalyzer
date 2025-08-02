import { z } from "zod";

import { Package, type IPackage } from "../package/package.js";
import { AliasName, type INpmKeyValue, type IPackageJson } from "../npm.js";
import { type IPackageJsonProvider } from "../providers/provider.js";
import { type ILogger } from "../loggers/ILogger.js";
import { type DependencyTypes } from "../reports/Validation.js";
import type { AttachmentData, Attachments } from "../attachments/Attachments.js";

export const PackageVersionSchema = z.union([
    z.tuple([z.string()]),
    z.tuple([z.string(), z.string().optional()])
]);

export type PackageVersion = z.infer<typeof PackageVersionSchema>;

interface IPackageVisitor<T extends Attachments> {
    visit: (depType?: DependencyTypes) => Promise<IPackage<AttachmentData<T>>>;
}

export class Visitor<T extends Attachments = Attachments> implements IPackageVisitor<T> {
    private _depthStack: string[] = [];
    private _depType: DependencyTypes = "dependencies";

    constructor(
        private readonly _entry: PackageVersion,
        private readonly _provider: IPackageJsonProvider,
        private readonly _logger: ILogger,
        private readonly _attachments: Attachments = {},
        private readonly _maxDepth: number = Infinity
    ) {}

    async visit(depType = this._depType): Promise<Package<AttachmentData<T>>> {
        try {
            const [name, version] = this._entry;
            const rootPkg = await this._provider.getPackageJson(name, version);
            const root = new Package<AttachmentData<T>>(rootPkg);

            this._logger.start();
            this._logger.log("Fetching");
            this._depType = depType;

            await this._addAttachment(root);

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
        parent: Package<AttachmentData<T>>,
        dependencies: INpmKeyValue | undefined
    ): Promise<void> {
        try {
            if (typeof dependencies === "undefined") return;

            const packages: IPackageJson[] = [];

            for (const [name, version] of Object.entries(dependencies)) {
                let resolvedName = name;
                let resolvedVersion: string | undefined = version;
                let isAlias = false;

                if (version.startsWith("npm:")) {
                    const actualDependency = version.slice(4);
                    const [actualName, actualVersion] =
                        getPackageVersionfromString(actualDependency);

                    isAlias = true;
                    resolvedName = actualName;
                    resolvedVersion = actualVersion;
                }

                const resolved = await this._provider.getPackageJson(resolvedName, resolvedVersion);

                if (isAlias) {
                    resolved[AliasName] = name;
                }

                packages.push(resolved);
            }

            for (const p of packages) {
                const dependency = new Package<AttachmentData<T>>(p);

                await this._addAttachment(dependency);

                this._logger.log(`Fetched ${dependency.fullName}`);
                parent.addDependency(dependency);

                if (this._depthStack.includes(dependency.fullName)) {
                    dependency.isLoop = true;
                } else if (this._depthStack.length < this._maxDepth) {
                    this._depthStack.push(dependency.fullName);
                    await this.visitDependencies(dependency, p[this._depType]);
                }
            }
        } finally {
            this._depthStack.pop();
        }
    }

    private async _addAttachment(p: Package<AttachmentData<T>>): Promise<void> {
        const totalAttachments = Object.keys(this._attachments).length;
        let i = 0;

        for (const [key, attachment] of Object.entries(this._attachments)) {
            try {
                const attachmentMsg = `[${p.fullName}][Attachment: ${numPadding(
                    i,
                    totalAttachments
                )} - ${key}]`;
                this._logger.log(attachmentMsg);

                const data = await attachment({
                    p,
                    logger: (msg: string) => this._logger.log(`${attachmentMsg} - ${msg}`)
                });

                p.setAttachmentData(key, data);
            } catch (e) {
                this._logger.log(`Failed to apply attachment: ${e}`);
            } finally {
                i++;
            }
        }
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
