import { isRight } from "fp-ts/lib/Either";
import * as t from "io-ts";

type _DependencyType = "dependencies" | "devDependencies";

export const dependencyType = new t.Type<_DependencyType>(
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

export const booleanType = new t.Type<boolean>(
    "boolean",
    (input: unknown): input is boolean => typeof input === "boolean",
    (input, context) => {
        return typeof input === "boolean"
            ? t.success(input)
            : t.failure(input, context, `Expected boolean but got "${input}"`);
    },
    t.identity
);

export const stringType = new t.Type<string>(
    "string",
    (input: unknown): input is string => typeof input === "string",
    (input, context) => {
        return typeof input === "string"
            ? t.success(input)
            : t.failure(input, context, `Expected string but got "${input}"`);
    },
    t.identity
);
