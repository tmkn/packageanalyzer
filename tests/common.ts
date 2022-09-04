/* istanbul ignore file */

import * as t from "io-ts";
import { BaseContext } from "clipanion";

import { Writable } from "stream";
import { Package } from "../src/package/package";
import { AbstractReport, IReportContext, SingleReportMethodSignature } from "../src/reports/Report";
import { PackageVersion } from "../src/visitors/visitor";
import { IPackageJson } from "../src/npm";

class TestWritable extends Writable {
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

const pkgType = new t.Type<PackageVersion>(
    "pkgType",
    (input: unknown): input is PackageVersion => Array.isArray(input),
    (input, context) => {
        return t.success(input as PackageVersion);
    },
    t.identity
);

const reportSignature = new t.Type<SingleReportMethodSignature>(
    "reportType",
    (input: unknown): input is SingleReportMethodSignature => true,
    (input, context) => {
        return t.success(input as SingleReportMethodSignature);
    },
    t.identity
);

const TestReportParams = t.type({
    pkg: pkgType,
    report: reportSignature
});

type ITestReportParams = t.TypeOf<typeof TestReportParams>;

export class TestReport extends AbstractReport<ITestReportParams, PackageVersion> {
    name = `Test Report`;
    pkg: PackageVersion;

    constructor(params: ITestReportParams) {
        super(params);

        this.pkg = params.pkg;
    }

    async report(context: IReportContext, pkg: Package): Promise<void> {
        return this.params.report(context, pkg);
    }

    override validate(): t.Type<ITestReportParams> {
        return TestReportParams;
    }
}

export interface ITestReportNoValidationParams {
    foo: string;
}

export class TestReportNoValidation extends AbstractReport<ITestReportNoValidationParams> {
    name = `Test Report No Validation`;
    pkg: PackageVersion;

    constructor(params: ITestReportNoValidationParams) {
        super(params);

        this.pkg = [params.foo];
    }

    async report(context: IReportContext, pkg: Package): Promise<void> {}
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

export function createMockPackage(data?: Partial<IPackageJson>): Package {
    // @ts-expect-error
    const pkgJson: IPackageJson = {
        ...{
            name: `mockPackage`,
            version: `1.2.3`
        },
        ...data
    };

    return new Package(pkgJson);
}
