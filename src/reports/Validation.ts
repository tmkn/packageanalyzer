import * as t from "io-ts";

import { DependencyTypes } from "../visitors/visitor";

const dependencyType = new t.Type<DependencyTypes>(
    "dependencyType",
    (input: unknown): input is DependencyTypes =>
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

type DependencyType = t.TypeOf<typeof dependencyType>;
