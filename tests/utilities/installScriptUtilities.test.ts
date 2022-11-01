import { Package } from "../../src";
import { InstallScriptUtilities } from "../../src/extensions/utilities/InstallScriptsUtilities";
import { createMockPackage, IMockPackageJson } from "../mocks";

describe("InstallScriptUtilities", () => {
    const mockData: IMockPackageJson = {
        name: `dep1`,
        version: `1.0.0`,
        dependencies: [
            {
                name: `dep2`,
                version: `1.0.0`,
                dependencies: [
                    {
                        name: `duplicate`,
                        version: `2.0.0`,
                        scripts: {
                            postinstall: "postinstall command",
                            preinstall: "preinstall command"
                        }
                    }
                ]
            },
            {
                name: `dep3`,
                version: `1.0.0`,
                dependencies: [
                    {
                        name: `dep4`,
                        version: `1.0.0`,
                        dependencies: [
                            {
                                name: `duplicate`,
                                version: `2.0.0`,
                                scripts: {
                                    postinstall: "postinstall command",
                                    preinstall: "preinstall command"
                                }
                            }
                        ]
                    }
                ]
            },
            {
                name: `dep5`,
                version: `1.0.0`,
                scripts: {
                    postinstall: "postinstall command"
                }
            },
            { name: `dep6`, version: `2.0.0` }
        ]
    };

    const testPkg: Package = createMockPackage(mockData);

    test(`find postinstall scripts`, () => {
        const { postinstallScripts } = new InstallScriptUtilities(testPkg);

        expect(postinstallScripts.size).toEqual(2);
    });

    test(`find preinstall scripts`, () => {
        const { preinstallScripts } = new InstallScriptUtilities(testPkg);

        expect(preinstallScripts.size).toEqual(1);
    });

    test(`correctly returns empty map when no scripts are found`, () => {
        const { postinstallScripts, preinstallScripts } = new InstallScriptUtilities(
            createMockPackage({
                name: "no-scripts",
                version: "1.0.0",
                dependencies: [{ name: "no-scripts-dependency1", version: "1.0.0" }]
            })
        );

        expect(postinstallScripts.size).toBe(0);
        expect(preinstallScripts.size).toBe(0);
    });
});
