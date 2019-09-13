import * as assert from "assert";
import { CodeAnalyzer } from "../src/analyzers/code";

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
    it(`Analzye example code 1`, () => {
        const test = CodeAnalyzer.FromString(example1);

        assert.equal(test.statements, 45, `Wrong amount of statements`);
        assert.equal(test.exports, 1, `Wrong amount of exports`);
        assert.equal(test.imports, 0, `Wrong amount of imports`);
    });

    it(`Analzye example code 2`, () => {
        const test = CodeAnalyzer.FromString(example2);

        assert.equal(test.statements, 94, `Wrong amount of statements`);
        assert.equal(test.exports, 1, `Wrong amount of exports`);
        assert.equal(test.imports, 2, `Wrong amount of imports`);
    });
});
