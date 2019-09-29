export interface INpmPackage {
    author: INpmUser;
    dependencies?: INpmKeyValue;
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

export interface IUnpublishedNpmPackage {
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
    email: string;
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

export interface INpmPackageInfo {
    author: INpmUser;
    description: string;
    "dist-tags": INpmKeyValue[] & { latest: string };
    homepage: string;
    keywords: string[];
    license: string;
    maintainers: INpmUser[];
    name: string;
    readme: string;
    readmeFilename: string;
    repository: INpmRepository;
    time: INpmKeyValue;
    users: { [index: string]: boolean };
    versions: { [index: string]: INpmPackage };
}

interface INpmBaseStatistic {
    end: string;
    start: string;
    package: string;
}

export interface INpmSingleStatistic extends INpmBaseStatistic {
    downloads: number;
}

export interface INpmRangeStatistic extends INpmBaseStatistic {
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
    doc: INpmPackageInfo;
    id: string;
    key: string;
}

export type PackageVersion = [string, string?];

export function isUnpublished(
    data: IUnpublishedNpmPackage | INpmPackageInfo
): data is IUnpublishedNpmPackage {
    if (typeof data === "object" && data !== null) {
        if ("time" in data) {
            if ("unpublished" in data.time) return true;
        }
    }

    return false;
}

export function getNameAndVersion(name: string): [string, string?] {
    if (name.startsWith(`@`)) {
        const parts = name.slice(1).split("@");

        if (parts.length === 1) {
            return [`@${parts[0]}`, undefined];
        } else if (parts.length === 2) {
            if (parts[1].trim() !== "") return [`@${parts[0]}`, parts[1]];
        }

        throw `Unable to determine version from "${name}"`;
    } else {
        const parts = name.split("@");

        if (parts.length === 1) {
            return [`${parts[0]}`, undefined];
        } else if (parts.length === 2) {
            if (parts[1].trim() !== "") return [`${parts[0]}`, parts[1]];
        }

        throw `Unable to determine version from "${name}"`;
    }
}

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
