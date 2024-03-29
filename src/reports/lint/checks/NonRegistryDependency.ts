import { IPackage } from "../../../package/package";
import { ILintCheck } from "../LintRule";

export const NonRegistryDependency: ILintCheck = {
    name: "non-registry-dependency",
    check: (pkg: IPackage) => {
        const gitProtocols = [
            "git:",
            "git+https:",
            "git+ssh:",
            "git+file:",
            "git+http:",
            "git+git:"
        ];
        const dependencyTypes = [
            "dependencies",
            "devDependencies",
            "peerDependencies",
            "optionalDependencies"
        ];
        const results: string[] = [];

        for (const dependencyType of dependencyTypes) {
            const dependencies = pkg.getData(dependencyType);

            if (typeof dependencies !== "object" || dependencies === null) {
                return;
            }

            for (const [name, target] of Object.entries(dependencies)) {
                if (target.startsWith("file:")) {
                    results.push(`detected a local dependency (${name})`);
                }

                const match = gitProtocols.find(protocol => target.startsWith(protocol));
                if (match) {
                    results.push(`detected a git dependency (${name})`);
                }
            }
        }

        if (results.length > 0) {
            return results;
        }
    }
};
