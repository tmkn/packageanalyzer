import * as path from "path";

import { type IPackage } from "../src/package/package.js";
import { FileSystemPackageProvider } from "../src/providers/folder.js";
import { getPackageVersionfromString, Visitor } from "../src/visitors/visitor.js";
import { OraLogger } from "../src/loggers/OraLogger.js";
import { LoopUtilities } from "../src/extensions/utilities/LoopUtilities.js";
import { LicenseUtilities } from "../src/extensions/utilities/LicenseUtilities.js";
import { PathUtilities } from "../src/extensions/utilities/PathUtilities.js";
import { getPackageVersionFromPath } from "../src/visitors/util.node.js";
import { type IAttachment } from "../src/attachments/Attachments.js";

describe(`Package Tests`, () => {
    let p: IPackage;

    beforeAll(async () => {
        const rootPath = path.join("tests", "data", "testproject1");
        const provider = new FileSystemPackageProvider(rootPath);
        const visitor = new Visitor(getPackageVersionFromPath(rootPath), provider, new OraLogger());

        p = await visitor.visit();
    });

    test(`Check licenses`, () => {
        const licenses = new LicenseUtilities(p).licenses;

        const names: string[] = [
            "testproject1",
            "react",
            "loose-envify",
            "js-tokens",
            "object-assign",
            "prop-types",
            "react-is",
            "scheduler"
        ];
        const versions: string[] = [
            "1.0.0",
            "16.8.6",
            "1.4.0",
            "4.0.0",
            "4.1.1",
            "15.7.2",
            "16.8.6",
            "0.13.6"
        ];

        expect(licenses.size).toBe(8);

        for (const [name, [[version, license]]] of licenses) {
            expect(names).toContain(name);
            expect(versions).toContain(version);

            expect(["ISC", "MIT"]).toContain(license);
        }
    });

    test(`Checks path string`, () => {
        const react = p.getPackageByName("react");

        expect.assertions(1);
        if (react) {
            const path = new PathUtilities(react).pathString;

            expect(path).toBe(`testproject1@1.0.0 → react@16.8.6`);
        }
    });

    test(`Check path for root`, () => {
        const path = new PathUtilities(p).path;
        const [[name, version]] = path;

        expect(path.length).toBe(1);
        expect(name).toBe("testproject1");
        expect(version).toBe("1.0.0");
    });

    test(`Check path for specific package`, () => {
        const pa2 = p.getPackageByName("loose-envify", "1.4.0");

        expect.assertions(7);

        if (pa2) {
            const path = new PathUtilities(pa2).path;
            const [[name1, version1], [name2, version2], [name3, version3]] = path;

            expect(path.length).toBe(3);

            expect(name1).toBe("testproject1");
            expect(version1).toBe("1.0.0");

            expect(name2).toBe("react");
            expect(version2).toBe("16.8.6");

            expect(name3).toBe("loose-envify");
            expect(version3).toBe("1.4.0");
        }
    });

    test(`Check loops`, () => {
        expect(new LoopUtilities(p).loops.length).toBe(0);
    });

    test(`Deprecation flag`, () => {
        const { deprecated, message } = p.deprecatedInfo;

        expect(deprecated).toBe(false);
        expect(typeof message).toBe("string");
    });
});

describe(`Attachment Tests`, () => {
    let rootPath: string;
    let provider: FileSystemPackageProvider;

    beforeAll(() => {
        rootPath = path.join("tests", "data", "testproject1");
        provider = new FileSystemPackageProvider(rootPath);
    });

    test(`correctly gets attachment data by key`, async () => {
        const testAttachment: IAttachment<"key", boolean> = {
            key: "key",
            name: "test attachment",
            apply: async () => true
        };

        const visitor = new Visitor(
            getPackageVersionFromPath(rootPath),
            provider,
            new OraLogger(),
            [testAttachment]
        );

        const p = await visitor.visit();

        const attachmentData = p.getAttachmentData("key");

        expect(attachmentData).toBe(true);
    });

    test(`correctly throws on missing attachment key lookup`, async () => {
        const visitor = new Visitor(getPackageVersionFromPath(rootPath), provider, new OraLogger());

        const p = await visitor.visit();

        expect(() => p.getAttachmentData("invalidKey")).toThrow();
    });

    test(`correctly returns whole attachment data`, async () => {
        const testAttachment: IAttachment<"key", boolean> = {
            key: "key",
            name: "test attachment",
            apply: async () => true
        };

        const testAttachment2: IAttachment<"hello", "world"> = {
            key: "hello",
            name: "test attachment 2",
            apply: async () => "world"
        };

        const visitor = new Visitor(
            getPackageVersionFromPath(rootPath),
            provider,
            new OraLogger(),
            [testAttachment, testAttachment2]
        );

        const p = await visitor.visit();

        const attachmentData = p.getAttachmentData();

        expect(attachmentData).toEqual({
            key: true,
            hello: "world"
        });
    });

    test(`correctly returns partial attachment data`, async () => {
        const testAttachment: IAttachment<"key", boolean> = {
            key: "key",
            name: "test attachment",
            apply: async () => true
        };

        const testAttachment2: IAttachment<"hello", "world"> = {
            key: "hello",
            name: "test attachment 2",
            apply: async () => {
                throw new Error(`Whoops!`);
            }
        };

        const visitor = new Visitor(
            getPackageVersionFromPath(rootPath),
            provider,
            new OraLogger(),
            [testAttachment, testAttachment2]
        );

        const p = await visitor.visit();

        const attachmentData = p.getAttachmentData();

        expect(attachmentData).toEqual({
            key: true
        });
    });

    test(`correctly returns empty object when no attachments have been used`, async () => {
        const visitor = new Visitor(getPackageVersionFromPath(rootPath), provider, new OraLogger());

        const p = await visitor.visit();

        const attachmentData = p.getAttachmentData();

        expect(attachmentData).toEqual({});
    });
});

describe(`Deprecated Package Tests`, () => {
    test(`Deprecation flag`, async () => {
        const rootPath = path.join("tests", "data", "deprecated");
        const provider = new FileSystemPackageProvider(rootPath);
        const visitor = new Visitor(getPackageVersionFromPath(rootPath), provider, new OraLogger());
        const p = await visitor.visit();
        const extnode = p.getPackageByName("extnode");

        if (extnode) {
            const { deprecated, message } = extnode.deprecatedInfo;

            expect(deprecated).toBe(true);
            expect(typeof message).toBe("string");
        } else {
            throw new Error(`Couldn't find package "extnode"`);
        }
    });
});

describe(`Checks Name and Version extraction`, () => {
    test(`Finds name and version`, () => {
        const [name, version] = getPackageVersionfromString(`foo@1.2.3`);

        expect(name).toBe("foo");
        expect(version).toBe("1.2.3");
    });

    test(`Finds name and version for local package`, () => {
        const [name, version] = getPackageVersionfromString(`@foo@1.2.3`);

        expect(name).toBe("@foo");
        expect(version).toBe("1.2.3");
    });

    test(`Finds only name`, () => {
        const [name, version] = getPackageVersionfromString(`foo`);

        expect(name).toBe("foo");
        expect(version).toBe(undefined);
    });

    test(`Finds only name for local package`, () => {
        const [name, version] = getPackageVersionfromString(`@foo`);

        expect(name).toBe("@foo");
        expect(version).toBe(undefined);
    });

    test(`Fails to parse, throws local package 1`, () => {
        expect(() => getPackageVersionfromString(`@foo@`)).toThrow();
    });

    test(`Fails to parse, throws for local package 2`, () => {
        expect(() => getPackageVersionfromString(`@foo@@ bla`)).toThrow();
    });

    test(`Fails to parse, throws for local package 3`, () => {
        expect(() => getPackageVersionfromString(`@@foo@@ bla`)).toThrow();
    });

    test(`Fails to parse, throws for package 1 `, () => {
        expect(() => getPackageVersionfromString(`foo@`)).toThrow();
    });

    test(`Fails to parse, throws for package 2`, () => {
        expect(() => getPackageVersionfromString(`foo@2@ bla`)).toThrow();
    });

    test(`Fails to parse, throws for foo@`, () => {
        expect(() => getPackageVersionfromString(`foo@`)).toThrow();
    });
});
