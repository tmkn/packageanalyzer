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
