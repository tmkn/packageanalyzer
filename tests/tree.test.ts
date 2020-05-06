import * as path from "path";
import { FileSystemPackageProvider } from "../src/providers/folder";
import { Visitor } from "../src/visitors/visitor";
import { getPackageJson } from "../src/visitors/folder";
import { OraLogger } from "../src/logger";
import { ITransformer, print } from "../src/tree";
import { PackageAnalytics } from "../src/analyzers/package";

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
`.split("\n").slice(1, -1);

describe(`Tree Tests`, () => {
    test(`Print tree`, async () => {
        const rootPath = path.join("tests", "data", "testproject1");
        const provider = new FileSystemPackageProvider(rootPath);
        const visitor = new Visitor(getPackageJson(rootPath), provider, new OraLogger());
        const pa = await visitor.visit();

        const converter: ITransformer<PackageAnalytics> = {
            getLabel: data => data.fullName,
            getChildren: data => data.directDependencies
        };

        const lines: string[] = [];
        const spy = jest.spyOn(console, "log").mockImplementation(line => lines.push(line));
        print<PackageAnalytics>(pa, converter);
        spy.mockRestore();

        expect(lines).toEqual(output);
    });
});
