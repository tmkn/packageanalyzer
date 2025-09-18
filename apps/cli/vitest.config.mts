import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        name: { label: "apps/cli", color: "magenta" },
        environment: "node",
        include: ["tests/**/*.test.ts"],
        coverage: {
            all: false,
            provider: "v8",
            include: ["src/**/*.ts"],
            exclude: ["/node_modules/", "build/"]
        }
    }
});
