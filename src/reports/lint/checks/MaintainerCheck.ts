import { z } from "zod";
import type { ILintCheck } from "../LintRule";
import type { IPackage } from "../../../package/package";
import type { INpmUser } from "../../../npm";

interface IMaintainerCheck {
    authors: string[];
}

export class MaintainerCheck implements ILintCheck<IMaintainerCheck> {
    name = "maintainer-check";
    check(pkg: IPackage, { authors }: IMaintainerCheck) {
        const authorMessages: string[] = [];

        for (const author of authors) {
            const keys = ["maintainers", "author", "contributors"] as const;

            for (const key of keys) {
                const data = pkg.getData(key);
                const toArray = Array.isArray(data) ? data : [data];

                for (const entry of toArray) {
                    // check string
                    if (typeof entry === "string") {
                        const parts = entry.split(" ").map(part => part.trim());

                        if (parts.includes(author)) {
                            authorMessages.push(`found ${author} in "${key}"`);
                        }
                        // check for npm person object
                    } else if (this.#isNpmAuthor(entry) && entry.name === author) {
                        authorMessages.push(`found ${author} in "${key}"`);
                    }
                    // todo: report on malformed data?
                }
            }
        }

        return authorMessages;
    }

    checkParams() {
        return z.object({
            authors: z.array(z.string())
        });
    }

    #isNpmAuthor(data: unknown): data is INpmUser {
        return npmUserSchema.safeParse(data).success;
    }
}

const npmUserSchema = z.object({
    name: z.string(),
    email: z.string().optional(),
    url: z.string().optional()
});
