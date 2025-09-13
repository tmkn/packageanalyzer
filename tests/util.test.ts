import { describe, test, expect, vi, afterEach } from "vitest";
import * as os from "os";

import { urlType } from "../src/reports/Validation.js";
import { numPadding } from "../src/visitors/visitor.js";
import { getVersion } from "../src/cli/common.js";

describe(`Num Padding Tests`, () => {
    test(`Correctly prefixes 1/1`, () => {
        const msg = numPadding(0, 1);

        expect(msg).toMatch(`1/1`);
    });

    test(`Correctly prefixes 34/1457`, () => {
        const msg = numPadding(33, 1457);

        expect(msg).toMatch(`  34/1457`);
    });
});

describe(`urlType Tests`, () => {
    test(`Correctly parses http url`, () => {
        const { success } = urlType.safeParse(`http://foo.com`);

        expect(success).toBeTruthy();
    });

    test(`Correctly parses https url`, () => {
        const { success } = urlType.safeParse(`https://foo.com`);

        expect(success).toBeTruthy();
    });

    test(`Fails to parse`, () => {
        const { success } = urlType.safeParse({});

        expect(success).toBeFalsy();
    });
});

describe(`getVersion Tests`, () => {
    test(`Correctly returns version`, () => {
        const version = getVersion();

        expect(typeof version).toBe("string");
        expect(version).toMatch(/^\d+\.\d+\.\d+$/);
    });

    test(`Correctly returns version from different cwd`, () => {
        const cwd = process.cwd();
        try {
            const tmpDir = os.tmpdir();
            process.chdir(tmpDir);

            const version = getVersion();
            expect(typeof version).toBe("string");
            expect(version).toMatch(/^\d+\.\d+\.\d+$/);
        } finally {
            process.chdir(cwd);
        }
    });

    test(`Correctly returns parse error`, () => {
        vi.spyOn(JSON, "parse").mockImplementation(() => {
            throw new Error("whoops");
        });

        const version = getVersion();
        expect(version).toBe("version parse error!");
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });
});
