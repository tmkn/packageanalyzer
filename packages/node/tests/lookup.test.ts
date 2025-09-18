import { describe, test, expect, beforeAll } from "vitest";
import * as path from "path";
import * as fs from "fs";
import * as os from "os";

import { type INpmDumpRow } from "../../shared/src/npm.js";
import { LookupFileCreator, type ILookupEntry, LookupFileWriter } from "../src/utils/lookup.js";

describe(`Lookup Creator Tests`, () => {
    const destination = path.join("packages", "node", "tests", "data", "npmdump");
    const file = path.join(destination, `test.json`);
    let lookups: readonly ILookupEntry[] = [];

    beforeAll(async () => {
        const creator = new LookupFileCreator(file);
        await creator.parse();
        lookups = creator.lookups;
    });

    test(`Correctly identified all packages`, async () => {
        expect(lookups.length).toBe(10);
    });

    test(`Correctly parsed the first package`, () => {
        const [{ name, length, offset }] = lookups;

        expect(name).toBe(`ux-com-paging-break`);
        expect(length).toBe(9865);
        expect(offset).toBe(48);
    });

    test(`Correctly parsed the last package`, () => {
        const { name, length, offset } = lookups[lookups.length - 1];

        expect(name).toBe(`ux-custom-ocean-compon`);
        expect(length).toBe(42999);
        expect(offset).toBe(617783);
    });

    test(`Correctly looks up a package`, async () => {
        const fd = fs.openSync(file, "r");
        const index = 5;
        const { name, offset, length } = lookups[index];
        const buffer = Buffer.alloc(length);
        let actualOffset = offset;

        if (os.platform() === "win32") {
            const lineOffset = index + 1; //+1 because of 0 based index

            actualOffset += lineOffset;
        }

        fs.readSync(fd, buffer, 0, length, actualOffset);
        fs.closeSync(fd);

        const { doc: pkg }: INpmDumpRow = JSON.parse(buffer.toString());

        expect(pkg.name).toBe(name);
    });
});

describe(`LookupFileWriter Tests`, () => {
    test(`Correctly formats lookup for lookup file`, () => {
        const lookup: ILookupEntry = {
            name: "foo",
            length: 1337,
            offset: 0,
            line: 1
        };
        const line = `${lookup.name} ${lookup.offset} ${lookup.length}\n`;

        expect(LookupFileWriter.getLine(lookup)).toBe(line);
    });
});
