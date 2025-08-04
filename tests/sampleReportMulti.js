const path = require("path");

const { TreeReport } = require("../build/src/reports/TreeReport");
const { DumpPackageProvider } = require("../build/src/providers/folder");

const report = new TreeReport({ package: `@webassemblyjs/ast@1.9.0`, type: `dependencies` });
report.provider = new DumpPackageProvider(path.join(process.cwd(), `tests`, `data`, `loops_data`));

module.exports = {
    reports: [report, report]
};
