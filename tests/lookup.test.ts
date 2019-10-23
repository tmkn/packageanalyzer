import * as path from "path";
import * as assert from "assert";
import * as fs from "fs";
import * as os from "os";

import { INpmDumpRow } from "../src/npm";
import { LookupFileCreator, ILookupEntry, LookupFileWriter } from "../src/lookup";

describe(`Lookup Creator Tests`, async () => {
    const destination = path.join("tests", "data", "npmdump");
    const file = path.join(destination, `test.json`);
    let lookups: readonly ILookupEntry[] = [];

    before(async () => {
        const creator = new LookupFileCreator(file);
        await creator.parse();
        lookups = creator.lookups;
    });

    it(`Correctly identified all packages`, async () => {
        assert.equal(lookups.length, 10);
    });

    it(`Correctly parsed the first package`, () => {
        const [{ name, length, offset }] = lookups;

        assert.equal(name, `ux-com-paging-break`, `Name didn't match`);
        assert.equal(length, 9865, `Length didn't match`);
        assert.equal(offset, 48, `Offset didn't match`);
    });

    it(`Correctly parsed the last package`, () => {
        const { name, length, offset } = lookups[lookups.length - 1];

        assert.equal(name, `ux-custom-ocean-compon`, `Name didn't match`);
        assert.equal(length, 42999, `Length didn't match`);
        assert.equal(offset, 617783, `Offset didn't match`);
    });

    it(`Correctly looks up a package`, async () => {
        const fd = fs.openSync(file, "r");
        const index = 5;
        let { name, offset, length } = lookups[index];
        const buffer = Buffer.alloc(length);

        if (os.platform() === "win32") {
            const lineOffset = index + 1; //+1 because of 0 based index

            offset += lineOffset;
        }

        fs.readSync(fd, buffer, 0, length, offset);
        fs.closeSync(fd);

        const { doc: pkg }: INpmDumpRow = JSON.parse(buffer.toString());

        assert.equal(pkg.name, name);
    });
});

describe(`LookupFileWriter Tests`, () => {
    it(`Correctly formats lookup for lookup file`, () => {
        const lookup: ILookupEntry = {
            name: "foo",
            length: 1337,
            offset: 0,
            line: 1
        };
        const line = `${lookup.name} ${lookup.offset} ${lookup.length}\n`;

        assert.equal(LookupFileWriter.getLine(lookup), line);
    });
});