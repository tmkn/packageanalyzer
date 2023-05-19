import { ILintCheck } from "../LintRule";

interface IMaintainerCheck {
    authors: string[];
}

export const MaintainerCheck: ILintCheck<IMaintainerCheck> = {
    name: "maintainer-check",
    check: (pkg, { authors }) => {
        const authorMessages: string[] = [];

        for (const author of authors) {
            // check maintainers entry
            const maintainers = pkg.getData("maintainers");

            if (Array.isArray(maintainers)) {
                const foundMaintainer = maintainers.find(maintainer => maintainer.name === author);

                if (foundMaintainer) {
                    authorMessages.push(`found ${author} as a maintainer`);
                }
            }

            // check author entry
            const pkgAuthor = pkg.getData("author");

            if (typeof pkgAuthor === "string" && pkgAuthor === author) {
                authorMessages.push(`found ${author} as an author`);
            }
        }

        return authorMessages;
    }
};
