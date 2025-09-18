import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";

export default [
    { ignores: ["**/*.js", "**/*.json", "**/*.txt"] },
    { files: ["**/*.{js,mjs,cjs,ts}"] },
    { languageOptions: { globals: globals.browser } },
    // pluginJs.configs.recommended,
    // ...tseslint.configs.recommendedTypeChecked,
    {
        languageOptions: {
            parser: tseslint.parser,
            parserOptions: {
                projectService: true,
                tsconfigRootDir: import.meta.dirname
            }
        },
        plugins: {
            "@typescript-eslint": tseslint.plugin
        },
        rules: {
            "@typescript-eslint/prefer-readonly": "error"
        }
    },
    {
        files: ["packages/*/tests/**/*.ts", "apps/*/tests/**/*.ts"],
        rules: {
            "@typescript-eslint/no-unused-vars": "off",
            "@typescript-eslint/no-explicit-any": "off",
            "no-case-declarations": "off",
            "@typescript-eslint/prefer-readonly": "off"
        }
    }
];
