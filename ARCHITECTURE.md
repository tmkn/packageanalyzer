# Package Analyzer Architecture
## The Basics
The package analyzer is written in TypeScript with the `strict` setting.
Unit Tests are orchestrated with Jest.
Furthermore the repository is configured in a way that PR's will automatically build the project on Windows, Linux and Mac.
Additionally a SonarCube analysis is run on every PR

## The Code
### The Package class
The main working model of the package analyzer is the `Package` class.
If you analyze a package and its dependencies you will get a single `Package` which is the top most package in the hierarchy.

The `Package` class contains references to its immediate dependencies which itself are classes of `Package`.
The `Package` class also contains a `parent` member to access the parent, allowing you to navigate the dependency tree in either direction.

Apart from `name`, `version` members, it also offers utility methods to easily traverse the dependency tree:
```typescript
    visit: (callback: (dependency: T) => void, includeSelf: boolean, start: T) => void;
    getPackagesBy: (filter: (pkg: T) => boolean) => T[];
    getPackagesByName: (name: string, version?: string) => T[];
    getPackageByName: (name: string, version?: string) => T | null;
```
#### Adding custom data via decorators
You may want to add custom data to each package in the dependency tree.
This could be the actual source code or download stats or number of open issues in the GitHub repository, short, anything else that cannot be found in the `package.json`.
To add that kind of data you use a `Decorator`.
```typescript
export interface IDecorator<T> {
    readonly key: Symbol;
    readonly name: string;
    apply: (p: Package) => Promise<T>;
}
```
During the traversal of the dependency tree, the `apply` method will be called for every dependency.

To access the data on the `Package` class you use the `getDecoratorData` method, like:
```typescript
const { published } = p.getDecoratorData(ReleaseDecorator);
```

### Providers
todo

### Dependency Tree Traversal
At the heart of the dependency tree traversal is the `Visitor`.
```typescript
interface IVisitorConstructor {
    new (
        entry: PackageVersion,
        provider: IPackageVersionProvider,
        logger: ILogger,
        decorators?: IDecorator<any>[]
    ): IPackageVisitor;
}
```
`entry` specifies the starting point of the dependency tree

`provider` the visitor will ask the `provider` for information about the packages

`logger` any output will be delegated to the `logger`

`decorators` optionally specify decorators that you want to use during the tree traversal

The `Visitor` also contains a method `visit`:
```typescript
export interface IPackageVisitor {
    visit: (depType?: DependencyTypes) => Promise<Package>;
}
```
Calling this method will start the dependency tree traversal

Example
```typescript
        const visitor = new Visitor(["react"], provider, new OraLogger());
        const p = await visitor.visit();
        const p = await visitor.visit("dependencies");
        const p = await visitor.visit("devDependencies");
```