import { defineConfig } from "oxlint";

export default defineConfig({
    categories: {
        correctness: "off",
        nursery: "off",
        pedantic: "off",
        perf: "off",
        restriction: "off",
        style: "off",
        suspicious: "off"
    },
    plugins: ["typescript"],
    rules: {
        "typescript/explicit-function-return-type": "error"
    },
    options: {
        typeAware: true
    },
    overrides: [
        {
            files: [
                "packages/*/tests/**/*.ts",
                "packages/*/tests/**/*.tsx",
                "packages/*/tests/**/*.mts",
                "apps/*/tests/**/*.ts",
                "apps/*/tests/**/*.tsx",
                "apps/*/tests/**/*.mts"
            ],
            rules: {
                "typescript/explicit-function-return-type": "off"
            }
        }
    ]
});
