import { Writable } from "stream";
import { IDecorator } from "../src/extensions/decorators/Decorator";
import { Package } from "../src/package/package";
import { IPackageVersionProvider } from "../src/providers/provider";
import { IReport } from "../src/reports/Report";
import { IFormatter } from "../src/utils/formatter";
import { DependencyTypes, PackageVersion } from "../src/visitors/visitor";

export class TestWritable extends Writable {
    public lines: string[] = [];

    override _write(
        chunk: any,
        encoding: BufferEncoding,
        callback: (error?: Error | null) => void
    ): void {
        const data: string = chunk.toString();

        this.lines.push(data.trimEnd());

        callback();
    }
}

interface ITestReport {
    pkg: PackageVersion;
    report: (pkg: Package, formatter: IFormatter) => Promise<void>;

    decorators?: IDecorator<any, any>[];
    provider?: IPackageVersionProvider;
    type?: DependencyTypes;
    depth?: number;
}

export class TestReport implements IReport<ITestReport> {
    name = `Test Report`;
    pkg: PackageVersion;

    decorators?: IDecorator<any, any>[];
    provider?: IPackageVersionProvider;
    type?: DependencyTypes;
    depth?: number;

    constructor(public params: ITestReport) {
        this.pkg = params.pkg;

        this.decorators = params.decorators;
        this.provider = params.provider;
        this.type = params.type;
        this.depth = params.depth;
    }

    async report(pkg: Package, formatter: IFormatter): Promise<void> {
        return this.params.report(pkg, formatter);
    }
}
