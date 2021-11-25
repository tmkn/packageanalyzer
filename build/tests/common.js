"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestReport = exports.TestWritable = void 0;
const stream_1 = require("stream");
const Report_1 = require("../src/reports/Report");
class TestWritable extends stream_1.Writable {
    constructor() {
        super(...arguments);
        this._output = "";
    }
    get lines() {
        if (this._output === "")
            return [];
        //remove ansi escape codes, azure doesn't like them
        let cleaned = this._output.replace(TestWritable._regex, "");
        return cleaned.split("\n");
    }
    _write(chunk, encoding, callback) {
        const data = chunk.toString();
        this._output += data.toString();
        callback();
    }
}
exports.TestWritable = TestWritable;
_a = TestWritable;
TestWritable._pattern = [
    "[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)",
    "(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-ntqry=><~]))"
].join("|");
TestWritable._regex = new RegExp(_a._pattern, "g");
class TestReport extends Report_1.AbstractReport {
    constructor(params) {
        super();
        this.params = params;
        this.name = `Test Report`;
        this.pkg = params.pkg;
        this.decorators = params.decorators;
        this.provider = params.provider;
        this.type = params.type;
        this.depth = params.depth;
    }
    async report(pkg, { stdoutFormatter }) {
        return this.params.report(pkg, stdoutFormatter);
    }
}
exports.TestReport = TestReport;
//# sourceMappingURL=common.js.map