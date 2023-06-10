/* istanbul ignore file */

import { z } from "zod";
import { BaseContext } from "clipanion";
import * as nock from "nock";

import { Writable } from "stream";
import { IPackage } from "../src/package/package";
import { AbstractReport, IReportContext, SingleReportMethodSignature } from "../src/reports/Report";
import { PackageVersion } from "../src/visitors/visitor";
import { DumpPackageProvider } from "../src/providers/folder";

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

const pkgType = z.custom<PackageVersion>(input => Array.isArray(input));

const reportSignature = z.custom<SingleReportMethodSignature>(input => true);

const TestReportParams = z.object({
    pkg: pkgType,
    report: reportSignature
});

type ITestReportParams = z.infer<typeof TestReportParams>;

export class TestReport extends AbstractReport<ITestReportParams, PackageVersion> {
    name = `Test Report`;
    pkg: PackageVersion;

    constructor(params: ITestReportParams) {
        super(params);

        this.pkg = params.pkg;
    }

    async report(context: IReportContext, pkg: IPackage): Promise<number | void> {
        return this.params.report(context, pkg);
    }

    override validate(): z.ZodTypeAny {
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

    async report(context: IReportContext, pkg: IPackage): Promise<void> {}
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

export function setupRegistryMocks(
    folder: string,
    registryUrl = `https://registry.npmjs.com`
): nock.Scope {
    const provider = new DumpPackageProvider(folder);
    const scope = nock(registryUrl)
        .persist()
        .get(new RegExp(`(.*?)`))
        .reply((uri, body, cb) => {
            const [name, version] = uri.split(`/`).filter(part => part !== ``);

            if (name && version) {
                provider.getPackageJson(name, version).then(data => cb(null, [200, data]));
            } else if (name && !version) {
                provider.getPackageMetadata(name).then(data => cb(null, [200, data!]));
            } else {
                cb(null, [500, `NO DATA AVAILABLE [Name: ${name} | Version: ${version}]`]);
            }
        });

    return scope;
}
