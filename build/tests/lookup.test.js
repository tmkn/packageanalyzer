"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const fs = require("fs");
const os = require("os");
const lookup_1 = require("../src/utils/lookup");
describe(`Lookup Creator Tests`, () => {
    const destination = path.join("tests", "data", "npmdump");
    const file = path.join(destination, `test.json`);
    let lookups = [];
    beforeAll(async () => {
        const creator = new lookup_1.LookupFileCreator(file);
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
        const { doc: pkg } = JSON.parse(buffer.toString());
        expect(pkg.name).toBe(name);
    });
});
describe(`LookupFileWriter Tests`, () => {
    test(`Correctly formats lookup for lookup file`, () => {
        const lookup = {
            name: "foo",
            length: 1337,
            offset: 0,
            line: 1
        };
        const line = `${lookup.name} ${lookup.offset} ${lookup.length}\n`;
        expect(lookup_1.LookupFileWriter.getLine(lookup)).toBe(line);
    });
});
//# sourceMappingURL=lookup.test.js.map