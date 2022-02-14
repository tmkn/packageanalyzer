import { BaseContext } from "clipanion";

import { Writable } from "stream";
import { IDecorator } from "../src/extensions/decorators/Decorator";
import { Package } from "../src/package/package";
import { IPackageJsonProvider } from "../src/providers/provider";
import { AbstractReport, IReportContext } from "../src/reports/Report";
import { IFormatter } from "../src/utils/formatter";
import { DependencyTypes, PackageVersion } from "../src/visitors/visitor";

export class TestWritable extends Writable {
    private static _pattern = [
        "[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)",
        "(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-ntqry=><~]))"
    ].join("|");

    private static _regex = new RegExp(this._pattern, "g");

    private _output: string = "";

    public get lines(): string[] {
        if (this._output === "") return [];

        //remove ansi escape codes, azure doesn't like them
        let cleaned: string = this._output.replace(TestWritable._regex, "");

        return cleaned.split("\n");
    }

    override _write(
        chunk: any,
        encoding: BufferEncoding,
        callback: (error?: Error | null) => void
    ): void {
        const data: string = chunk.toString();

        this._output += data.toString();

        callback();
    }
}

interface ITestReport {
    pkg: PackageVersion;
    report: (pkg: Package, formatter: IFormatter) => Promise<void>;

    decorators?: IDecorator<any, any>[];
    provider?: IPackageJsonProvider;
    type?: DependencyTypes;
    depth?: number;
}

export class TestReport extends AbstractReport<ITestReport> {
    name = `Test Report`;
    pkg: PackageVersion;

    constructor(public params: ITestReport) {
        super();

        this.pkg = params.pkg;

        this.decorators = params.decorators;
        this.provider = params.provider;
        this.type = params.type;
        this.depth = params.depth;
    }

    async report(pkg: Package, { stdoutFormatter }: IReportContext): Promise<void> {
        return this.params.report(pkg, stdoutFormatter);
    }
}

interface IMockContext {
    mockContext: BaseContext;
    stdout: TestWritable;
    stderr: TestWritable;
}

export function createMockContext(): IMockContext {
    const stdout = new TestWritable();
    const stderr = new TestWritable();
    const mockContext: BaseContext = {
        stdin: process.stdin,
        stdout,
        stderr,
        colorDepth: 8,
        env: {}
    };

    return {
        mockContext,
        stdout,
        stderr
    };
}
