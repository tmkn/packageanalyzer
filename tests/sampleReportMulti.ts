import path from "path";

import { TreeReport } from "../src/reports/TreeReport.js";
import { DumpPackageProvider } from "../src/providers/folder.js";

const report = new TreeReport({ package: `@webassemblyjs/ast@1.9.0`, type: `dependencies` });
report.provider = new DumpPackageProvider(path.join(process.cwd(), `tests`, `data`, `loops_data`));

module.exports = {
    reports: [report, report]
};
