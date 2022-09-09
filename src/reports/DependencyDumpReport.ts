import * as path from "path";
import * as fs from "fs";

import * as t from "io-ts";
import { MetaFileDecorator } from "../extensions/decorators/MetaFileDecorator";

import { Package } from "../package/package";
import { OnlinePackageProvider } from "../providers/online";
import { getPackageVersionfromString, PackageVersion } from "../visitors/visitor";
import { AbstractReport, IReportContext } from "./Report";
import { Url, urlType } from "../utils/requests";

const DependencyDumpParams = t.type({
    entries: t.array(t.string),
    folder: t.string,
    registry: urlType
});

type IDependencyDumpParams = t.TypeOf<typeof DependencyDumpParams>;

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

    override validate(): t.Type<IDependencyDumpParams> {
        return DependencyDumpParams;
    }
}
