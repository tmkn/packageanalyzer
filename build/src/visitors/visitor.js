"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Visitor = void 0;
const package_1 = require("../package/package");
const logger_1 = require("../utils/logger");
class Visitor {
    constructor(_entry, _provider, _logger, _decorators = [], _maxDepth = Infinity) {
        this._entry = _entry;
        this._provider = _provider;
        this._logger = _logger;
        this._decorators = _decorators;
        this._maxDepth = _maxDepth;
        this._depthStack = [];
        this._depType = "dependencies";
    }
    async visit(depType = this._depType) {
        try {
            const [name, version] = this._entry;
            const rootPkg = await this._provider.getPackageJson(name, version);
            const root = new package_1.Package(rootPkg);
            this._logger.start();
            this._logger.log("Fetching");
            this._depType = depType;
            await this._addDecorator(root);
            this._depthStack.push(root.fullName);
            this._logger.log(`Fetched ${root.fullName}`);
            try {
                if (this._depthStack.length <= this._maxDepth)
                    await this.visitDependencies(root, rootPkg[depType]);
            }
            catch (e) {
                this._logger.error("Error evaluating dependencies");
                throw e;
            }
            return root;
        }
        finally {
            this._logger.stop();
        }
    }
    async visitDependencies(parent, dependencies) {
        try {
            const dependencyField = typeof dependencies !== "undefined" ? dependencies : {};
            const dependencyArray = Object.entries(dependencyField);
            const packages = [];
            for await (const resolvedDependencies of this._provider.getPackageJsons(dependencyArray)) {
                packages.push(resolvedDependencies);
            }
            for (const p of packages) {
                const dependency = new package_1.Package(p);
                await this._addDecorator(dependency);
                this._logger.log(`Fetched ${dependency.fullName}`);
                parent.addDependency(dependency);
                if (this._depthStack.includes(dependency.fullName)) {
                    dependency.isLoop = true;
                }
                else {
                    if (this._depthStack.length < this._maxDepth) {
                        this._depthStack.push(dependency.fullName);
                        await this.visitDependencies(dependency, p[this._depType]);
                    }
                }
            }
        }
        finally {
            this._depthStack.pop();
        }
    }
    async _addDecorator(p) {
        const totalDecorators = this._decorators.length;
        for (const [i, decorator] of this._decorators.entries()) {
            try {
                const decoratorMsg = `[${p.fullName}][Decorator: ${(0, logger_1.numPadding)(i, totalDecorators)} - ${decorator.name}]`;
                this._logger.log(decoratorMsg);
                const data = await decorator.apply({
                    p,
                    logger: (msg) => this._logger.log(`${decoratorMsg} - ${msg}`)
                });
                p.setDecoratorData(decorator.key, data);
            }
            catch {
                this._logger.log(`Failed to apply decorator: ${decorator.name}`);
            }
        }
    }
}
exports.Visitor = Visitor;
//# sourceMappingURL=visitor.js.map