import { z } from "zod";

export const BasePackageParameter = z.object({
    package: z.string()
});

export const BaseFolderParameter = z.object({
    folder: z.string()
});

export const dependencyTypes = z.union([z.literal(`dependencies`), z.literal(`devDependencies`)], {
    invalid_type_error: `type must be "dependencies" or "devDependencies"`
});

export type DependencyTypes = z.infer<typeof dependencyTypes>;

export const TypeParameter = z.object({
    type: dependencyTypes
});
