// todo add methods for mocking packages

import { Package } from "../src";
import { IBasePackageJson, INpmKeyValue, IPackageJson } from "../src/npm";
import { DependencyTypes } from "../src/reports/Validation";
import { createMockPackage } from "./common";

type MockBasePackageJson = Omit<Partial<IBasePackageJson>, "dependencies" | "devDependencies">;

interface IMockPackageJson extends MockBasePackageJson {
    dependencies?: IMockPackageJson[];
    devDependencies?: IMockPackageJson[];
    [key: string]: unknown;
}

export function createMockDependencyTree(
    mockData: IMockPackageJson,
    type: DependencyTypes = "dependencies"
): Package {
    const data = convertToPackageJson(mockData, type);
    const parent = createMockPackage(data);

    const dependencies = mockData[type] ?? [];

    for (const depMockData of dependencies) {
        parent.addDependency(createMockDependencyTree(depMockData, type));
    }

    return parent;
}

function convertToPackageJson(
    mockData: IMockPackageJson,
    type: DependencyTypes
): Partial<IPackageJson> {
    const packageJson: Partial<IPackageJson> = JSON.parse(JSON.stringify(mockData));
    const npmDependencies: INpmKeyValue = {};

    delete packageJson.dependencies;
    delete packageJson.devDependencies;

    const { dependencies = [] } = mockData;

    for (const dependency of dependencies) {
        npmDependencies[dependency.name ?? `pkga_no_name`] = dependency.version ?? `1.3.3.7`;
    }

    switch (type) {
        case "dependencies":
            packageJson.dependencies = npmDependencies;
            break;
        case "devDependencies":
            packageJson.devDependencies = npmDependencies;
            break;
        default:
            const unhandled: never = type;

            throw new Error(
                `Wrong type, expected "dependencies" or "devDependencies", got "${type}"`
            );
    }

    return packageJson;
}
