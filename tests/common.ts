/* istanbul ignore file */

import { z } from "zod";
import { type BaseContext } from "clipanion";
import nock from "nock";

import { Writable } from "stream";
import { type IPackage } from "../src/package/package.js";
import {
    AbstractReport,
    type IReportConfig,
    type IReportContext,
    type SingleReportMethodSignature
} from "../src/reports/Report.js";
import { type PackageVersion } from "../src/visitors/visitor.js";
import { DumpPackageProvider } from "../src/providers/folder.js";
import type { ILogger } from "../src/loggers/ILogger.js";
import { MockProvider, type IMockPackageJson } from "./mocks.js";
import { ReportService } from "../src/reports/ReportService.js";
import type { IPackageJsonProvider } from "../src/providers/provider.js";

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
        const cleaned: string = this._output.replace(TestWritable._regex, "");

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

export class TestReport extends AbstractReport<ITestReportParams, IReportConfig> {
    name = `Test Report`;
    configs: IReportConfig;

    constructor(params: ITestReportParams) {
        super(params);

        this.configs = {
            pkg: params.pkg
        };
    }

    async report(pkg: [IPackage], context: IReportContext): Promise<number | void> {
        return this.params.report(pkg, context);
    }

    override validate(): z.ZodType<ITestReportParams> {
        return TestReportParams;
    }
}

export interface ITestReportNoValidationParams {
    foo: string;
}

export class TestReportNoValidation extends AbstractReport<ITestReportNoValidationParams> {
    name = `Test Report No Validation`;
    configs: IReportConfig;

    constructor(params: ITestReportNoValidationParams) {
        super(params);

        this.configs = {
            pkg: [params.foo]
        };
    }

    async report([pkg]: [IPackage], context: IReportContext): Promise<void> {}
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

export class MockLogger implements ILogger {
    private _logs: string[] = [];

    get logs(): string[] {
        return this._logs;
    }

    start(): void {
        // no-op
    }

    stop(): void {
        // no-op
    }

    log(msg: string): void {
        this._logs.push(msg);
    }

    error(msg: string): void {
        this._logs.push(msg);
    }

    reset(): void {
        this._logs = [];
    }
}

export type ReportServiceContext<
    T extends AbstractReport<any> | readonly AbstractReport<any>[] = AbstractReport<any>[]
> = {
    reportService: ReportService;
    stdout: TestWritable;
    stderr: TestWritable;
    reports: T;
};

export function createReportServiceFactory<C extends new (...args: any[]) => AbstractReport<any>>(
    ctor: C,
    mockPkgsOrProvider: IMockPackageJson[] | IPackageJsonProvider
) {
    const provider = Array.isArray(mockPkgsOrProvider)
        ? new MockProvider(mockPkgsOrProvider)
        : mockPkgsOrProvider;

    type ReportConstructorArgs = ConstructorParameters<C>;
    type ReportInstance = InstanceType<C>;

    function factory<T extends ReportConstructorArgs[]>(
        ...args: T
    ): ReportServiceContext<{ [K in keyof T]: ReportInstance }>;
    function factory(...args: ReportConstructorArgs): ReportServiceContext<ReportInstance>;
    function factory(...args: unknown[]): unknown {
        const { stdout, stderr } = createMockContext();
        const isSingleArg = !(Array.isArray(args) && args.every(arg => Array.isArray(arg)));
        const reportConfigs = isSingleArg ? [args] : args;

        const reports = reportConfigs.map(config => {
            const report = new ctor(...config);
            report.provider = provider;
            return report;
        });

        const reportService = new ReportService(
            {
                reports
            },
            stdout,
            stderr
        );

        return {
            reportService,
            stdout,
            stderr,
            reports: isSingleArg ? reports[0] : reports
        };
    }

    return factory;
}
