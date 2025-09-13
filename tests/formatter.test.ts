import { describe, test, expect } from "vitest";
import { createMockContext } from "./common.js";
import { Formatter } from "../src/utils/formatter.js";
import { NodeWriter } from "../src/host/NodeHost.js";

describe(`Formatter Tests`, () => {
    test(`Correctly sets padding`, async () => {
        const { stdout: writer } = createMockContext();
        const nodeWriter = new NodeWriter(writer);
        const formatter = new Formatter(nodeWriter);
        const expectedFormat: string[] = [`key1: Test1`, `k:    Test2`, ``];

        formatter.writeGroup([
            [`key1`, `Test1`],
            [`k`, `Test2`]
        ]);
        await nodeWriter.flush();

        expect(expectedFormat).toEqual(writer.lines);
    });

    test(`Correctly sets padding with line`, async () => {
        const { stdout: writer } = createMockContext();
        const nodeWriter = new NodeWriter(writer);
        const formatter = new Formatter(nodeWriter);
        const expectedFormat: string[] = [`key1: Test1`, `hello world`, `k:    Test2`, ``];

        formatter.writeGroup([[`key1`, `Test1`], `hello world`, [`k`, `Test2`]]);
        await nodeWriter.flush();

        expect(expectedFormat).toEqual(writer.lines);
    });

    test(`Correctly writes identation`, async () => {
        const { stdout: writer } = createMockContext();
        const nodeWriter = new NodeWriter(writer);
        const formatter = new Formatter(nodeWriter);
        const expectedFormat: string[] = [`header`, `    test1`, `    test2`, ``];

        formatter.writeIdentation([`header`, `test1`, `test2`], 4);
        await nodeWriter.flush();

        expect(writer.lines).toEqual(expectedFormat);
    });
});
