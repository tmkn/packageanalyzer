import { defineConfig, mergeConfig } from "tsdown";

import pkg from "./package.json" with { type: "json" };

// tsdown builds each package individually so we need to provide the version to each time
// though it's only referenced in the node package
const shared = defineConfig({
    define: {
        __APP_VERSION__: JSON.stringify(pkg.version.trim())
    },
    fixedExtension: false
});

export default defineConfig([
    mergeConfig(shared, {
        entry: { index: "./packages/node/src/index.ts" },
        dts: { build: true }
    }),
    mergeConfig(shared, {
        entry: { "index.web": "./packages/web/src/index.ts" },
        dts: { build: true },
        platform: "browser"
    }),
    mergeConfig(shared, {
        entry: "./apps/cli/src/cli.ts",
        dts: { build: true }
    }),
    mergeConfig(shared, {
        entry: ["./packages/node/src/mcp.ts"]
        // dts: { build: true }
    })
]);
