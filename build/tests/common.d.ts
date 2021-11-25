/// <reference types="node" />
import { Writable } from "stream";
import { IDecorator } from "../src/extensions/decorators/Decorator";
import { Package } from "../src/package/package";
import { IPackageJsonProvider } from "../src/providers/provider";
import { AbstractReport, IReportContext } from "../src/reports/Report";
import { IFormatter } from "../src/utils/formatter";
import { DependencyTypes, PackageVersion } from "../src/visitors/visitor";
export declare class TestWritable extends Writable {
    private static _pattern;
    private static _regex;
    private _output;
    get lines(): string[];
    _write(chunk: any, encoding: BufferEncoding, callback: (error?: Error | null) => void): void;
}
interface ITestReport {
    pkg: PackageVersion;
    report: (pkg: Package, formatter: IFormatter) => Promise<void>;
    decorators?: IDecorator<any, any>[];
    provider?: IPackageJsonProvider;
    type?: DependencyTypes;
    depth?: number;
}
export declare class TestReport extends AbstractReport<ITestReport> {
    params: ITestReport;
    name: string;
    pkg: PackageVersion;
    constructor(params: ITestReport);
    report(pkg: Package, { stdoutFormatter }: IReportContext): Promise<void>;
}
export {};
//# sourceMappingURL=common.d.ts.map