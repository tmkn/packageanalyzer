import { z } from "zod";
import type { ILintCheck } from "../LintRule.js";
import type { IPackage } from "../../../../../shared/src/package/package.js";
import type { INpmUser } from "../../../../../shared/src/npm.js";

interface IMaintainerCheck {
    // list of authors to check for
    authors: string[];
}

export class MaintainerCheck implements ILintCheck<IMaintainerCheck> {
    name = "maintainer-check";
    check(pkg: IPackage, { authors }: IMaintainerCheck) {
        const authorMessages: string[] = [];

        for (const author of authors) {
            const keysWithUserInfo = ["maintainers", "author", "contributors"] as const;

            for (const key of keysWithUserInfo) {
                const possibleUserInfoData = pkg.getData(key);
                const foundAuthors = this.#checkUserInfoData(possibleUserInfoData, author);

                for (const foundAuthor of foundAuthors) {
                    authorMessages.push(`found ${foundAuthor} in "${key}"`);
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

    // user info can be a standalone string or an object or wrapped in an array
    // convert to array for easier processing
    #toArray(data: unknown): unknown[] {
        return Array.isArray(data) ? data : [data];
    }

    #checkUserInfoData(possibleUserInfoData: unknown, author: string): string[] {
        const foundAuthors: string[] = [];

        for (const entry of this.#toArray(possibleUserInfoData)) {
            // check string
            if (typeof entry === "string") {
                const parts = entry.split(" ").map(part => part.trim());

                if (parts.includes(author)) {
                    foundAuthors.push(author);
                }
                // check for npm person object
            } else if (this.#isNpmAuthor(entry) && entry.name === author) {
                foundAuthors.push(author);
            }
        }

        return foundAuthors;
    }
}

const npmUserSchema = z.object({
    name: z.string(),
    email: z.string().optional(),
    url: z.string().optional()
});
