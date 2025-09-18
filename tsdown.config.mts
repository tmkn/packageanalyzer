import { defineConfig } from "tsdown";

export default defineConfig([
    {
        entry: { index: "./packages/node/src/index.ts" },
        dts: { build: true }
    },
    {
        entry: { "index.web": "./packages/web/src/index.ts" },
        dts: { build: true },
        platform: "browser"
    },
    {
        entry: "./apps/cli/src/cli.ts",
        dts: { build: true }
    }
]);
