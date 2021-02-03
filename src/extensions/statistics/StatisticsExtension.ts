import { Package } from "../../analyzers/package";
import { IFormatter } from "../../formatter";
import { ITreeFormatter, print } from "../../tree";

export function printDependencyTree(p: Package, formatter: IFormatter): void {
    const converter: ITreeFormatter<Package> = {
        getLabel: data => `${data.fullName} (${data.transitiveDependenciesCount} dependencies)`,
        getChildren: data => data.directDependencies
    };

    print<Package>(p, converter, formatter);
}

export class LoopsExtension {
    constructor(private _p: Package) {
        
    }
}