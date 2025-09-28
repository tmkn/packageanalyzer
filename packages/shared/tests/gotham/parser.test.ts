import { describe, test, expect } from "vitest";

import { findEvals, findImports } from "../../src/gotham/parser.js";

describe(`code parser`, () => {
    describe(`esm imports`, () => {
        test(`finds esm default import`, () => {
            const code = `import foo from "fs"`;

            const findings = findImports("file.js", code, ["fs"]);

            expect(findings).toEqual(new Set(["fs"]));
        });

        test(`finds esm namespace import`, () => {
            const code = `import * as foo from "fs"`;

            const findings = findImports("file.js", code, ["fs"]);

            expect(findings).toEqual(new Set(["fs"]));
        });

        test(`finds esm dynamic import`, () => {
            const code = `const foo = await import("fs")`;

            const findings = findImports("file.js", code, ["fs"]);

            expect(findings).toEqual(new Set(["fs"]));
        });

        test(`finds aliased esm dynamic import`, () => {
            const code = `const abc = "fs"; const foo = await import(abc)`;

            const findings = findImports("file.js", code, ["fs"]);

            expect(findings).toEqual(new Set(["fs"]));
        });
    });

    describe(`cjs imports`, () => {
        test(`finds cjs require`, () => {
            const code = `const foo = require("fs")`;

            const findings = findImports("file.js", code, ["fs"]);

            expect(findings).toEqual(new Set(["fs"]));
        });

        test(`finds aliased cjs require`, () => {
            const code = `const abc = "fs"; const foo = require(abc)`;

            const findings = findImports("file.js", code, ["fs"]);

            expect(findings).toEqual(new Set(["fs"]));
        });
    });

    describe(`eval`, () => {
        test(`finds eval`, () => {
            const code = `eval("console.log('test')")`;

            const findings = findEvals("file.js", code);

            expect(findings).toBe(true);
        });

        test(`finds aliased eval`, () => {
            const code = `const abc = eval; abc("console.log('test')")`;

            const findings = findEvals("file.js", code);

            expect(findings).toBe(true);
        });
    });
});
