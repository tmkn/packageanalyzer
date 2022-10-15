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

const httpString = z.custom<`http://${string}`>(value => {
    if (typeof value === "string") return value.startsWith(`http://`);

    return false;
});

const httpsString = z.custom<`https://${string}`>(value => {
    if (typeof value === "string") return value.startsWith(`https://`);

    return false;
});

export const urlType = z.union([httpString, httpsString]);

export type Url = z.infer<typeof urlType>;

export function isValidDependencyType(type: unknown): type is DependencyTypes {
    return dependencyTypes.safeParse(type).success;
}
