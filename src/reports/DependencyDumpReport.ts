import * as path from "path";
import * as fs from "fs";

import { z } from "zod";

import { IPackage } from "../package/package";
import { OnlinePackageProvider } from "../providers/online";
import { getPackageVersionfromString, PackageVersion } from "../visitors/visitor";
import { AbstractReport, IReportContext } from "./Report";
import { urlType } from "./../reports/Validation";
import { MetaFileAttachment } from "../attachments/MetaFileAttachment";
import { AttachmentData } from "../attachments/Attachments";

const DependencyDumpParams = z.object({
    entries: z.array(z.string()),
    folder: z.string(),
    registry: urlType
});

type IDependencyDumpParams = z.infer<typeof DependencyDumpParams>;

export class DependencyDumpReport extends AbstractReport<IDependencyDumpParams> {
    name = `DependencyDump Report`;
    pkg: PackageVersion[] = [];

    constructor(params: IDependencyDumpParams) {
        super(params);

        this.pkg = params.entries.map(entry => getPackageVersionfromString(entry));

        const provider = new OnlinePackageProvider(this.params.registry);
        this.attachments = [new MetaFileAttachment(provider)];
        this.provider = provider;
    }

    async report(
        { stdoutFormatter }: IReportContext,
        ...pkgs: IPackage<AttachmentData<MetaFileAttachment>>[]
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

    override validate(): z.ZodTypeAny {
        return DependencyDumpParams;
    }
}
