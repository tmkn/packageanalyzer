import { Writable } from "stream";
import { Formatter } from "../src/formatter";

describe(`Formatter Tests`, () => {
    class TestWriter extends Writable {
        lines: string[] = [];

        _write(chunk: any, encoding: BufferEncoding, callback: (error?: Error | null) => void) {
            this.lines.push(chunk.toString());
            callback();
        }
    }

    test(`Correctly sets padding`, () => {
        const writer = new TestWriter();
        const formatter = new Formatter(writer);
        const expectedFormat: string[] = [`key1: Test1\n`, `k:    Test2\n`];

        formatter.writeGroup([
            [`key1`, `Test1`],
            [`k`, `Test2`]
        ]);

        expect(expectedFormat).toEqual(writer.lines);
    });

    test(`Correctly sets padding with line`, () => {
        const writer = new TestWriter();
        const formatter = new Formatter(writer);
        const expectedFormat: string[] = [`key1: Test1\n`, `hello world\n`, `k:    Test2\n`];

        formatter.writeGroup([[`key1`, `Test1`], `hello world`, [`k`, `Test2`]]);

        expect(expectedFormat).toEqual(writer.lines);
    });

    test(`Correctly writes identation`, () => {
        const writer = new TestWriter();
        const formatter = new Formatter(writer);
        const expectedFormat: string[] = [`header\n`, `    test1\n`, `    test2\n`];

        formatter.writeIdentation([`header`, `test1`, `test2`], 4);

        expect(writer.lines).toEqual(expectedFormat);
    });
});
