import * as path from "path";

import {
    CodeAnalyzer,
    getImports,
    isNativeModule,
    analyzePermissions
} from "../src/analyzers/code";
import { FileSystemPackageProvider } from "../src/providers/folder";

const example1 = `
module.exports = typeof queueMicrotask === 'function'
  ? queueMicrotask
  : typeof Promise === 'function'
    ? cb => Promise.resolve().then(cb)
    : cb => setTimeout(cb, 0) // fallback for Node 10 and old browsers
`;

const example2 = `
'use strict';

const get = require('get-value');
const has = require('has-values');

module.exports = function(obj, path, options) {
  if (isObject(obj) && (typeof path === 'string' || Array.isArray(path))) {
    return has(get(obj, path, options));
  }
  return false;
};

function isObject(val) {
  return val != null && (typeof val === 'object' || typeof val === 'function' || Array.isArray(val));
}
`;

describe(`CodeAnalyzer Tests`, () => {
    test(`Analzye example code 1`, () => {
        const test = CodeAnalyzer.FromString(example1);

        expect(test.statements).toBe(45);
        expect(test.exports).toBe(1);
        expect(test.imports).toBe(0);
    });

    test(`Analzye example code 2`, () => {
        const test = CodeAnalyzer.FromString(example2);

        expect(test.statements).toBe(94);
        expect(test.exports).toBe(1);
        expect(test.imports).toBe(2);
    });
});

describe(`Find Import Statement Tests`, () => {
    test(`import defaultExport from "module-name";`, () => {
        const code = `import defaultExport from "module-name";`;
        const imports = getImports(code);

        expect(imports.has(`module-name`)).toEqual(true);
        expect(imports.size).toEqual(1);
    });

    test(`import * as name from "module-name";`, () => {
        const code = `import * as name from "module-name";`;
        const imports = getImports(code);

        expect(imports.has(`module-name`)).toEqual(true);
        expect(imports.size).toEqual(1);
    });

    test(`import { export1 } from "module-name";`, () => {
        const code = `import { export1 } from "module-name";`;
        const imports = getImports(code);

        expect(imports.has(`module-name`)).toEqual(true);
        expect(imports.size).toEqual(1);
    });

    test(`import { export1 as alias1 } from "module-name";`, () => {
        const code = `import { export1 as alias1 } from "module-name";`;
        const imports = getImports(code);

        expect(imports.has(`module-name`)).toEqual(true);
        expect(imports.size).toEqual(1);
    });

    test(`import { export1 , export2 } from "module-name";`, () => {
        const code = `import { export1 , export2 } from "module-name";`;
        const imports = getImports(code);

        expect(imports.has(`module-name`)).toEqual(true);
        expect(imports.size).toEqual(1);
    });

    test(`import { export1 , export2 as alias2 } from "module-name";`, () => {
        const code = `import { export1 , export2 as alias2 } from "module-name";`;
        const imports = getImports(code);

        expect(imports.has(`module-name`)).toEqual(true);
        expect(imports.size).toEqual(1);
    });

    test(`import defaultExport, { export1 } from "module-name";`, () => {
        const code = `import defaultExport, { export1 } from "module-name";`;
        const imports = getImports(code);

        expect(imports.has(`module-name`)).toEqual(true);
        expect(imports.size).toEqual(1);
    });

    test(`import defaultExport, * as name from "module-name";`, () => {
        const code = `import defaultExport, * as name from "module-name";`;
        const imports = getImports(code);

        expect(imports.has(`module-name`)).toEqual(true);
        expect(imports.size).toEqual(1);
    });

    test(`import "module-name";`, () => {
        const code = `import "module-name";`;
        const imports = getImports(code);

        expect(imports.has(`module-name`)).toEqual(true);
        expect(imports.size).toEqual(1);
    });

    test(`var promise = import("module-name");`, () => {
        const code = `var promise = import("module-name");`;
        const imports = getImports(code);

        expect(imports.has(`module-name`)).toEqual(true);
        expect(imports.size).toEqual(1);
    });

    test(`let module = await import('/modules/my-module.js');`, () => {
        const code = `let module = await import('/modules/my-module.js');`;
        const imports = getImports(code);

        expect(imports.has(`/modules/my-module.js`)).toEqual(true);
        expect(imports.size).toEqual(1);
    });

    test(`const crypto = require('crypto');`, () => {
        const code = `const crypto = require('crypto');`;
        const imports = getImports(code);

        expect(imports.has(`crypto`)).toEqual(true);
        expect(imports.size).toEqual(1);
    });
});

describe(`isNativeModule Tests`, () => {
    test(`finds native modules`, () => {
        expect(isNativeModule("fs")).toEqual(true);
        expect(isNativeModule("path")).toEqual(true);
    });

    test(`returns false for missing modules`, () => {
        expect(isNativeModule("./foo")).toEqual(false);
    });

    test(`returns false non native modules`, () => {
        expect(isNativeModule("typescript")).toEqual(false);
    });
});

describe(`Permission Analyzer Tests`, () => {
    //const destination = path.join("tests", "data", "testproject1", "node_modules");
    const destination = `/home/tom/Downloads/node_modules`;
    let provider: FileSystemPackageProvider;

    beforeAll(() => {
        provider = new FileSystemPackageProvider(destination);
    });

    test.only(`simple`, async () => {
        const result = await analyzePermissions(path.join(destination, "jest"), provider);

        console.log(result);
    });
});
