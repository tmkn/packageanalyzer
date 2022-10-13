import * as path from "path";
import * as fs from "fs";

import { z } from "zod";
import { MetaFileDecorator } from "../extensions/decorators/MetaFileDecorator";

import { Package } from "../package/package";
import { OnlinePackageProvider } from "../providers/online";
import { getPackageVersionfromString, PackageVersion } from "../visitors/visitor";
import { AbstractReport, IReportContext } from "./Report";
import { urlType } from "../utils/requests";

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
        this.decorators = [new MetaFileDecorator(new OnlinePackageProvider(this.params.registry))];
    }

    async report({ stdoutFormatter }: IReportContext, ...pkgs: Package[]): Promise<void> {
        for (const pkg of pkgs) {
            stdoutFormatter.writeLine(`Writing meta files for ${pkg.fullName}`);

            pkg.visit(dep => {
                const { metaFile } = dep.getDecoratorData<MetaFileDecorator>(`metafile`);
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
