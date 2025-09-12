import { describe, test, expect } from "vitest";
import { createMockContext } from "./common.js";
import { Formatter } from "../src/utils/formatter.js";

describe(`Formatter Tests`, () => {
    test(`Correctly sets padding`, () => {
        const { stdout: writer } = createMockContext();
        const formatter = new Formatter(writer);
        const expectedFormat: string[] = [`key1: Test1`, `k:    Test2`, ``];

        formatter.writeGroup([
            [`key1`, `Test1`],
            [`k`, `Test2`]
        ]);

        expect(expectedFormat).toEqual(writer.lines);
    });

    test(`Correctly sets padding with line`, () => {
        const { stdout: writer } = createMockContext();
        const formatter = new Formatter(writer);
        const expectedFormat: string[] = [`key1: Test1`, `hello world`, `k:    Test2`, ``];

        formatter.writeGroup([[`key1`, `Test1`], `hello world`, [`k`, `Test2`]]);

        expect(expectedFormat).toEqual(writer.lines);
    });

    test(`Correctly writes identation`, () => {
        const { stdout: writer } = createMockContext();
        const formatter = new Formatter(writer);
        const expectedFormat: string[] = [`header`, `    test1`, `    test2`, ``];

        formatter.writeIdentation([`header`, `test1`, `test2`], 4);

        expect(writer.lines).toEqual(expectedFormat);
    });
});
