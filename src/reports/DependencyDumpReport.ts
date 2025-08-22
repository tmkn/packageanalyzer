import * as path from "path";
import * as fs from "fs";

import { z } from "zod";

import { type IPackage } from "../package/package.js";
import { OnlinePackageProvider } from "../providers/online.js";
import { getPackageVersionfromString } from "../visitors/visitor.js";
import { AbstractReport, type IReportConfig, type IReportContext } from "./Report.js";
import { urlType } from "./../reports/Validation.js";
import {
    createMetaFileAttachment,
    type MetaFileAttachmentFn
} from "../attachments/MetaFileAttachment.js";
import { type AttachmentData } from "../attachments/Attachments.js";

const DependencyDumpParams = z.object({
    entries: z.array(z.string()),
    folder: z.string(),
    registry: urlType
});

type IDependencyDumpParams = z.infer<typeof DependencyDumpParams>;

export class DependencyDumpReport extends AbstractReport<IDependencyDumpParams> {
    name = `DependencyDump Report`;
    configs: IReportConfig[];

    constructor(params: IDependencyDumpParams) {
        super(params);

        const provider = new OnlinePackageProvider(this.params.registry);
        this.configs = params.entries.map(entry => ({
            pkg: getPackageVersionfromString(entry),
            attachments: { metafile: createMetaFileAttachment(provider) }
        }));
        this.provider = provider;
    }

    async report(
        pkgs: IPackage<AttachmentData<{ metafile: MetaFileAttachmentFn }>>[],
        { stdoutFormatter }: IReportContext
    ): Promise<void> {
        for (const pkg of pkgs) {
            stdoutFormatter.writeLine(`Writing meta files for ${pkg.fullName}`);

            pkg.visit(dep => {
                const { metaFile } = dep.getAttachmentData(`metafile`);
                const folder = path.join(this.params.folder, dep.name);
                const fullPath = path.join(folder, `metadata.json`);

                fs.mkdirSync(folder, { recursive: true });
                fs.writeFileSync(fullPath, JSON.stringify(metaFile));

                stdoutFormatter.writeLine(`Wrote ${dep.name}`);
            }, true);

            stdoutFormatter.writeLine(``);
        }

        stdoutFormatter.writeLine(`Done!`);
    }

    override validate(): z.ZodType<IDependencyDumpParams> {
        return DependencyDumpParams;
    }
}
