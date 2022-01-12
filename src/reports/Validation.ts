import { isRight } from "fp-ts/lib/Either";
import * as t from "io-ts";

type _DependencyType = "dependencies" | "devDependencies";

const dependencyType = new t.Type<_DependencyType>(
    "dependencyType",
    (input: unknown): input is _DependencyType =>
        input === "dependencies" || input === "devDependencies",
    (input, context) => {
        if (input === "dependencies" || input === "devDependencies") {
            return t.success(input);
        }

        return t.failure(
            input,
            context,
            `Expected "dependencies" or "devDependencies" but got "${input}"`
        );
    },
    t.identity
);

export type DependencyTypes = t.TypeOf<typeof dependencyType>;

interface A {
    a: string;
}

interface B {
    b: number;
}

const foo = new t.Type<A | B>(
    "asdf",
    (input): input is A | B => true,
    (input, context) => t.success({ a: `` }),
    t.identity
);

const f = {};

if (foo.is(f)) {
    if ("a" in f) {
        f.a;
    }
}

const result = foo.decode({});

if (isRight(result)) {
    const foo = result.right;
}

const C = t.type({
    dependency: dependencyType
});

const D = t.union([C, dependencyType]);

const testD = D.decode({});

if (isRight(testD)) {
    const foo = testD.right;
}

function abc(arg: t.Type<{ dependency: DependencyTypes } | DependencyTypes>): void {
    const foo = arg.decode({});

    if (isRight(foo)) {
        const d = foo.right;
    }
}

abc(D);
