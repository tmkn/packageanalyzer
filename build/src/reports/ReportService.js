"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportService = void 0;
const chalk = require("chalk");
const online_1 = require("../providers/online");
const formatter_1 = require("../utils/formatter");
const logger_1 = require("../utils/logger");
const visitor_1 = require("../visitors/visitor");
class ReportService {
    constructor(_config, _stdout, _stderr) {
        this._config = _config;
        this._stdout = _stdout;
        this._stderr = _stderr;
        //todo validate _config
    }
    async process() {
        const { reports } = this._config;
        try {
            for (const report of reports) {
                const stdoutFormatter = new formatter_1.Formatter(this._stdout);
                const stderrFormatter = new formatter_1.Formatter(this._stderr);
                const visitor = new visitor_1.Visitor(report.pkg, report.provider ?? online_1.npmOnline, new logger_1.OraLogger(), report.decorators, report.depth);
                if (reports.length > 1)
                    stdoutFormatter.writeLine(chalk.underline.bgBlue(`Report: ${report.name}`));
                const p = await visitor.visit(report.type);
                await report.report(p, { stdoutFormatter, stderrFormatter });
                stdoutFormatter.writeLine(``);
            }
        }
        catch (e) {
            const stderrFormatter = new formatter_1.Formatter(this._stderr);
            stderrFormatter.writeLine(e?.toString());
        }
    }
}
exports.ReportService = ReportService;
//# sourceMappingURL=ReportService.js.map