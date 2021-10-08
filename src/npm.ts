import { downloadJson, Url } from "./utils/requests";

export interface IPackageJson {
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

    [key: string]: unknown;
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

export interface IPackageMetadata {
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

export async function getDownloadsLastWeek(
    name: string,
    url: Url = `https://api.npmjs.org/downloads/point/last-week/`
): Promise<INpmDownloadStatistic> {
    const json = await downloadJson<INpmDownloadStatistic>(`${url}${encodeURIComponent(name)}`);

    if (json !== null) return json;

    throw new Error(`Couldn't get download numbers for ${name}`);
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
