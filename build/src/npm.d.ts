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
    licenses?: INpmRepository[];
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
export interface IMalformedLicenseField {
    type: string;
    url: string;
}
export interface IPackageMetadata {
    author: INpmUser;
    description: string;
    "dist-tags": INpmKeyValue[] & {
        latest: string;
    };
    homepage: string;
    keywords: string[];
    license: string;
    maintainers: INpmUser[];
    name: string;
    readme: string;
    readmeFilename: string;
    repository: INpmRepository;
    time: INpmKeyValue;
    users: {
        [index: string]: boolean;
    };
    versions: {
        [index: string]: IPackageJson;
    };
}
interface INpmDownloadBaseStatistic {
    end: string;
    start: string;
    package: string;
}
export interface INpmDownloadStatistic extends INpmDownloadBaseStatistic {
    downloads: number;
}
export interface INpmDownloadRangeStatistic extends INpmDownloadBaseStatistic {
    downloads: Array<{
        downloads: number;
        day: string;
    }>;
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
export declare function isUnpublished(data: IUnpublishedPackageMetadata | IPackageMetadata): data is IUnpublishedPackageMetadata;
export {};
//# sourceMappingURL=npm.d.ts.map