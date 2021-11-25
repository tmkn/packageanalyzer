"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TreeReport = void 0;
const common_1 = require("../cli/common");
const LoopUtilities_1 = require("../extensions/utilities/LoopUtilities");
const folder_1 = require("../providers/folder");
const online_1 = require("../providers/online");
const utils_1 = require("../visitors/utils");
const Report_1 = require("./Report");
class TreeReport extends Report_1.AbstractReport {
    constructor(params) {
        super();
        this.params = params;
        this.name = `Tree Report`;
        this.type = params.type ?? common_1.defaultDependencyType;
        if (params.package) {
            this.pkg = (0, utils_1.getPackageVersionfromString)(params.package);
            this.provider = online_1.npmOnline;
        }
        else if (params.folder) {
            this.pkg = (0, utils_1.getPackageVersionFromPackageJson)(params.folder);
            this.provider = new folder_1.FileSystemPackageProvider(params.folder);
        }
        else {
            throw new Error(`Needs at least "package" or "folder" option`);
        }
    }
    async report(pkg, { stdoutFormatter }) {
        (0, LoopUtilities_1.printDependencyTree)(pkg, stdoutFormatter);
    }
}
exports.TreeReport = TreeReport;
//# sourceMappingURL=TreeReport.js.map