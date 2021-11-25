"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const stream_1 = require("stream");
const formatter_1 = require("../src/utils/formatter");
describe(`Formatter Tests`, () => {
    //todo unify with TestWritable?
    class TestWriter extends stream_1.Writable {
        constructor() {
            super(...arguments);
            this.lines = [];
        }
        _write(chunk, encoding, callback) {
            this.lines.push(chunk.toString());
            callback();
        }
    }
    test(`Correctly sets padding`, () => {
        const writer = new TestWriter();
        const formatter = new formatter_1.Formatter(writer);
        const expectedFormat = [`key1: Test1\n`, `k:    Test2\n`];
        formatter.writeGroup([
            [`key1`, `Test1`],
            [`k`, `Test2`]
        ]);
        expect(expectedFormat).toEqual(writer.lines);
    });
    test(`Correctly sets padding with line`, () => {
        const writer = new TestWriter();
        const formatter = new formatter_1.Formatter(writer);
        const expectedFormat = [`key1: Test1\n`, `hello world\n`, `k:    Test2\n`];
        formatter.writeGroup([[`key1`, `Test1`], `hello world`, [`k`, `Test2`]]);
        expect(expectedFormat).toEqual(writer.lines);
    });
    test(`Correctly writes identation`, () => {
        const writer = new TestWriter();
        const formatter = new formatter_1.Formatter(writer);
        const expectedFormat = [`header\n`, `    test1\n`, `    test2\n`];
        formatter.writeIdentation([`header`, `test1`, `test2`], 4);
        expect(writer.lines).toEqual(expectedFormat);
    });
});
//# sourceMappingURL=formatter.test.js.map