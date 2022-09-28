import { IPackageJsonProvider, Package } from "../src";
import { IBasePackageJson, INpmKeyValue, IPackageJson } from "../src/npm";
import { DependencyTypes } from "../src/reports/Validation";

type MockBasePackageJson = Omit<Partial<IBasePackageJson>, "dependencies" | "devDependencies">;

export interface IMockPackageJson extends MockBasePackageJson {
    dependencies?: IMockPackageJson[];
    devDependencies?: IMockPackageJson[];
    [key: string]: unknown;
}

export function createMockPackage(
    mockData: IMockPackageJson,
    type: DependencyTypes = "dependencies"
): Package {
    const data = convertToPackageJson(mockData, type);
    // @ts-expect-error
    const pkgJson: IPackageJson = {
        ...{
            name: `mockPackage`,
            version: `1.2.3`
        },
        ...data
    };
    const parent = new Package(pkgJson);

    const dependencies = mockData[type] ?? [];

    for (const depMockData of dependencies) {
        parent.addDependency(createMockPackage(depMockData, type));
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

export class MockProvider implements IPackageJsonProvider {
    constructor(private readonly mockData: IMockPackageJson[]) {}

    async getPackageJson(): Promise<IPackageJson> {
        throw new Error(`getPackageByVersion not implemented`);
        //eturn convertToPackageJson(this.mockData, "dependencies") as IPackageJson;
    }
}
