import * as t from "io-ts";
import { z } from "zod";

type _DependencyType = "dependencies" | "devDependencies";

export const dependencyType = new t.Type<_DependencyType>(
    "dependencyType",
    (input: unknown): input is _DependencyType =>
        input === "dependencies" || input === "devDependencies",
    (input, context) => {
        if (input === "dependencies" || input === "devDependencies") {
            return t.success(input);
        }

        return t.failure(
            input,
            context,
            `Expected "dependencies" or "devDependencies" but got "${input}"`
        );
    },
    t.identity
);

export const TypeParameter = t.type({
    type: dependencyType
});

export const BasePackageParameter = t.type({
    package: t.string
});

export const BaseFolderParameter = t.type({
    folder: t.string
});

export const ZBasePackageParameter = z.object({
    package: z.string()
});

export const ZBaseFolderParameter = z.object({
    folder: z.string()
});

const dependencyTypes = z.union([z.literal(`dependencies`), z.literal(`devDependencies`)])

export type DependencyTypes = z.infer<typeof dependencyTypes>;

export const ZTypeParameter = z.object({
    type: dependencyTypes
});
