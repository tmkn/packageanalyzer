import { IAttachment } from "../index.web";
import { PackageVersion } from "../visitors/visitor";
import { AbstractReport, Args, IReportContext, ReportMethodSignature } from "./Report";

interface IMultiReportParams<T extends PackageVersion[]> {
    entries: T;
    callback: ReportMethodSignature<T>;
}

export class MultiReport<T extends PackageVersion[]> extends AbstractReport<
    IMultiReportParams<T>,
    T
> {
    name = `Multi Report`;
    pkg: T;

    constructor(params: IMultiReportParams<T>) {
        super(params);

        this.pkg = params.entries;
    }

    async report(
        ctx: IReportContext,
        ...pkgs: Args<T, IAttachment<string, unknown>[]>
    ): Promise<void> {
        await this.params.callback(ctx, ...pkgs);
    }
}
