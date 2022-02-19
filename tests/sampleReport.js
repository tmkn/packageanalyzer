const path = require("path");

const { TreeReport } = require("../build/src/reports/TreeReport");
const { DependencyDumperProvider } = require("../build/src/utils/dumper");

const report = new TreeReport({ package: `@webassemblyjs/ast@1.9.0`, type: `dependencies` });
report.provider = new DependencyDumperProvider(
    path.join(process.cwd(), `tests`, `data`, `loopsdata`)
);

module.exports = {
    reports: [report, report]
};
