import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        projects: ["./packages/*/vitest.config.mts", "./apps/*/vitest.config.mts"],
        coverage: {
            all: false,
            provider: "v8"
        }
    }
});
