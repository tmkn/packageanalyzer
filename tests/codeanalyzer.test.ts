import { describe, test, expect } from "vitest";

import { CodeAnalyzer } from "../src/utils/code.js";

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
