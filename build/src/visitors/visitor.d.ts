import { Package } from "../package/package";
import { IDecorator } from "../extensions/decorators/Decorator";
import { IPackageJsonProvider } from "../providers/provider";
import { ILogger } from "../utils/ILogger";
export declare type PackageVersion = [name: string, version?: string];
interface IPackageVisitor {
    visit: (depType?: DependencyTypes) => Promise<Package>;
}
export declare type DependencyTypes = "dependencies" | "devDependencies";
export declare class Visitor implements IPackageVisitor {
    private readonly _entry;
    private readonly _provider;
    private readonly _logger;
    private readonly _decorators;
    private readonly _maxDepth;
    private _depthStack;
    private _depType;
    constructor(_entry: PackageVersion, _provider: IPackageJsonProvider, _logger: ILogger, _decorators?: IDecorator<any, any>[], _maxDepth?: number);
    visit(depType?: DependencyTypes): Promise<Package>;
    private visitDependencies;
    private _addDecorator;
}
export {};
//# sourceMappingURL=visitor.d.ts.map