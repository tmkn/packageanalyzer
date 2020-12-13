import * as path from "path";
import { FileSystemPackageProvider } from "../src/providers/folder";
import { Visitor } from "../src/visitors/visitor";
import { getPackageJson } from "../src/visitors/folder";
import { OraLogger } from "../src/logger";
import { ITreeFormatter, print } from "../src/tree";
import { PackageAnalytics } from "../src/analyzers/package";
import { Writable } from "stream";
import { TestWritable } from "./analyzer.test";

const output = `
testproject1@1.0.0
└── react@16.8.6
    ├── loose-envify@1.4.0
    │   └── js-tokens@4.0.0
    ├── object-assign@4.1.1
    ├── prop-types@15.7.2
    │   ├── loose-envify@1.4.0
    │   │   └── js-tokens@4.0.0
    │   ├── object-assign@4.1.1
    │   └── react-is@16.8.6
    └── scheduler@0.13.6
        ├── loose-envify@1.4.0
        │   └── js-tokens@4.0.0
        └── object-assign@4.1.1
`
    .split("\n")
    .slice(1, -1);

const multilineOutput = `
testproject1@1.0.0 (13 dependencies)
License: ISC
└── react@16.8.6 (12 dependencies)
    License: MIT
    ├── loose-envify@1.4.0 (1 dependencies)
    │   License: MIT
    │   └── js-tokens@4.0.0 (0 dependencies)
    │       License: MIT
    ├── object-assign@4.1.1 (0 dependencies)
    │   License: MIT
    ├── prop-types@15.7.2 (4 dependencies)
    │   License: MIT
    │   ├── loose-envify@1.4.0 (1 dependencies)
    │   │   License: MIT
    │   │   └── js-tokens@4.0.0 (0 dependencies)
    │   │       License: MIT
    │   ├── object-assign@4.1.1 (0 dependencies)
    │   │   License: MIT
    │   └── react-is@16.8.6 (0 dependencies)
    │       License: MIT
    └── scheduler@0.13.6 (3 dependencies)
        License: MIT
        ├── loose-envify@1.4.0 (1 dependencies)
        │   License: MIT
        │   └── js-tokens@4.0.0 (0 dependencies)
        │       License: MIT
        └── object-assign@4.1.1 (0 dependencies)
            License: MIT
`
    .split("\n")
    .slice(1, -1);

describe(`Tree Tests`, () => {
    test(`Print tree`, async () => {
        const rootPath = path.join("tests", "data", "testproject1");
        const provider = new FileSystemPackageProvider(rootPath);
        const visitor = new Visitor(getPackageJson(rootPath), provider, new OraLogger());
        const pa = await visitor.visit();

        const converter: ITreeFormatter<PackageAnalytics> = {
            getLabel: data => data.fullName,
            getChildren: data => data.directDependencies
        };

        const stdout = new TestWritable();

        print<PackageAnalytics>(pa, converter, stdout);

        expect(stdout.lines).toEqual(output);
    });

    test(`Print tree with multi lines`, async () => {
        const rootPath = path.join("tests", "data", "testproject1");
        const provider = new FileSystemPackageProvider(rootPath);
        const visitor = new Visitor(getPackageJson(rootPath), provider, new OraLogger());
        const pa = await visitor.visit();

        const converter: ITreeFormatter<PackageAnalytics> = {
            getLabel: data => [
                `${data.fullName} (${data.transitiveDependenciesCount} dependencies)`,
                `License: ${data.license}`
            ],
            getChildren: data => data.directDependencies
        };

        const stdout = new TestWritable();

        print<PackageAnalytics>(pa, converter, stdout);

        expect(stdout.lines).toEqual(multilineOutput);
    });
});
