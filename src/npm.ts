export interface INpmPackage {
    author: INpmUser;
    dependencies?: INpmKeyValue;
    description: string;
    devDependencies?: INpmKeyValue;
    directories: unknown;
    dist: INpmDist;
    homepage: string;
    keywords: string[];
    license?: string;
    licenses?: INpmRepository[]; //legacy
    maintainers: INpmUser[];
    name: string;
    readme: string;
    readmeFilename: string;
    repository: INpmRepository;
    scripts: INpmKeyValue;
    version: string;
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

export type PackageVersion = [string, string | undefined];
