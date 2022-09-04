import * as t from "io-ts";

import { defaultDependencyType } from "../cli/common";
import { DependencyUtilities } from "../extensions/utilities/DependencyUtilities";
import { Package } from "../package/package";
import { getPackageVersionfromString, PackageVersion } from "../visitors/visitor";
import { AbstractReport, IReportContext } from "./Report";
import { BasePackageParameter, TypeParameter } from "./Validation";

const FromParamenter = t.type({
    from: t.string
});

const ToParamenter = t.type({
    to: t.string
});

const DiffParams = t.intersection([FromParamenter, ToParamenter, TypeParameter]);

export type IDiffReportParams = t.TypeOf<typeof DiffParams>;

export class DiffReport extends AbstractReport<
    IDiffReportParams,
    [PackageVersion, PackageVersion]
> {
    name = `Diff Report`;
    pkg: [PackageVersion, PackageVersion];

    constructor(params: IDiffReportParams) {
        super(params);

        this.type = params.type ?? defaultDependencyType;

        if (DiffParams.is(params)) {
            this.pkg = [
                getPackageVersionfromString(params.from),
                getPackageVersionfromString(params.to)
            ];
        } else throw new Error();
    }

    async report(
        { stdoutFormatter }: IReportContext,
        fromPkg: Package,
        toPkg: Package
    ): Promise<void> {
        const { transitiveCount: fromTransitiveCount } = new DependencyUtilities(fromPkg);
        const { transitiveCount: toTransitiveCount } = new DependencyUtilities(toPkg);
        const difference = fromTransitiveCount - toTransitiveCount;
        const info: string = `${fromTransitiveCount}(${fromPkg.fullName}) -> ${toTransitiveCount}(${toPkg.fullName})`;
        let msg: string = ``;

        if (difference === 0) msg = `Dependency count stayed the same: ${info}`;
        else if (difference > 0) msg = `Dependency count decreased: ${info}`;
        else msg = `Dependency count increased: ${info}`;

        stdoutFormatter.writeIdentation([`Dependency Diff`, msg], 4);
    }

    override validate(): t.Type<IDiffReportParams> {
        return DiffParams;
    }
}
