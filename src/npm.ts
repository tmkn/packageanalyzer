export interface IBasePackageJson {
    author: INpmUser;
    dependencies?: INpmKeyValue;
    deprecated?: string;
    description: string;
    devDependencies?: INpmKeyValue;
    directories: unknown;
    dist: INpmDist;
    homepage: string;
    keywords: string[];
    license?: unknown;
    licenses?: INpmRepository[]; //legacy
    maintainers: INpmUser[];
    name: string;
    readme: string;
    readmeFilename: string;
    repository: INpmRepository;
    scripts: INpmKeyValue;
    version: string;
}

export const AliasName = Symbol("aliasName");

export interface IPackageJson extends IBasePackageJson {
    [key: string | symbol]: unknown;
}

export interface IUnpublishedPackageMetadata {
    name: string;
    time: INpmKeyValue & IUnpublishedInfo;
}

interface IUnpublishedInfo {
    maintainers: INpmUser[];
    name: string;
    time: string;
    versions: string[];
}

export interface INpmUser {
    name: string;
    email?: string;
    url?: string;
}

export interface INpmKeyValue {
    [index: string]: string;
}

interface INpmDist {
    fileCount?: number;
    integrity?: string;
    "npm-signature"?: string;
    shasum: string;
    tarball: string;
    unpackedSize?: number;
}

interface INpmRepository {
    type: string;
    url: string;
}

//deep-is uses this format
export interface IMalformedLicenseField {
    type: string;
    url: string;
}

export interface IPackageMetadata {
    author: INpmUser | string;
    contributors: Array<INpmUser | string>;
    description: string;
    "dist-tags": INpmKeyValue[] & { latest: string };
    homepage: string;
    keywords: string[];
    license: string;
    maintainers: Array<INpmUser | string>;
    name: string;
    readme: string;
    readmeFilename: string;
    repository: INpmRepository;
    time: INpmKeyValue;
    users: { [index: string]: boolean };
    versions: { [index: string]: IPackageJson };
}

//https://github.com/npm/registry/blob/master/docs/download-counts.md
interface INpmDownloadBaseStatistic {
    end: string;
    start: string;
    package: string;
}

export interface INpmDownloadStatistic extends INpmDownloadBaseStatistic {
    downloads: number;
}

export interface INpmDownloadRangeStatistic extends INpmDownloadBaseStatistic {
    downloads: Array<{ downloads: number; day: string }>;
}

export interface INpmAllPackagesResponse {
    total_rows: number;
    offset: number;
    rows: INpmPackageRow[];
}

interface INpmPackageRow {
    id: string;
    key: string;
    value: {
        rev: string;
    };
}

export interface INpmDumpRow {
    doc: IPackageMetadata;
    id: string;
    key: string;
}

export function isUnpublished(
    data: IUnpublishedPackageMetadata | IPackageMetadata
): data is IUnpublishedPackageMetadata {
    if (typeof data === "object" && data !== null) {
        if ("time" in data) {
            if ("unpublished" in data.time) return true;
        }
    }

    return false;
}

/* eslint-disable-next-line @typescript-eslint/no-unused-vars */
interface INpmLockFile {
    name: string;
    version: string;
    lockfileVersion: number;
    requires: boolean;
    dependencies?: Record<string, INpmLockFileDependency>;
}

interface INpmLockFileDependency {
    version: string;
    resolved: string;
    integrity: string;
    dev: boolean;
    requires?: Record<string, string>;
    dependencies?: Record<string, INpmLockFileDependency>;
}
