import { createMockPackage } from "../mocks";
import { NonRegistryDependency } from "../../src/reports/lint/checks/NonRegistryDependency";

describe(`NonRegistryDependency`, () => {
    describe(`reports local dependency`, () => {
        test.each(["dependencies", "devDependencies"] as const)(
            `correctly reports a local dependency for (%s)`,
            dependencyType => {
                const pkg = createMockPackage(
                    {
                        dependencies: [
                            {
                                name: `local-dependency`,
                                version: `file:./local-dependency`
                            }
                        ]
                    },
                    dependencyType
                );

                // @ts-expect-error technically can be void but we ignore that for the test
                const [result] = NonRegistryDependency.check(pkg, undefined);

                expect(result).toContain(`dependency local-dependency is included via file:`);
            }
        );
    });

    describe(`reports git dependencies`, () => {
        const protocols = ["git:", "git+https:", "git+ssh:", "git+file:", "git+http:", "git+git:"];
        const dependencyTypes = ["dependencies", "devDependencies"] as const;
        const testArray = protocols.flatMap(protocol => {
            return dependencyTypes.map(dependencyType => [protocol, dependencyType] as const);
        });

        test.each(testArray)(
            `correctly reports a %s dependency for (%s)`,
            (protocol, dependencyType) => {
                const pkg = createMockPackage(
                    {
                        dependencies: [
                            {
                                name: `git-dependency`,
                                version: `${protocol}//github.com/git-dependency`
                            }
                        ]
                    },
                    dependencyType
                );

                // @ ts-expect-error technically can be void but we ignore that for the test
                const [result] = NonRegistryDependency.check(pkg, undefined);

                expect(result).toContain(`dependency git-dependency is included via ${protocol}`);
            }
        );
    });
});
