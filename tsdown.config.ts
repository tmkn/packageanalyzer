import { defineConfig } from "tsdown";

export default defineConfig([
    {
        entry: ["./src/index.ts"],
        dts: { build: true }
    },
    {
        entry: ["./src/index.web.ts"],
        dts: { build: true },
        platform: "browser"
    },
    {
        entry: ["./src/cli.ts"],
        dts: { build: true }
    }
]);
