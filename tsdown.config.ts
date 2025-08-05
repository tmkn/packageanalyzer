import { defineConfig } from "tsdown";

export default defineConfig([
    {
        entry: ["./src/index.ts"]
        // platform: "browser"
    },
    {
        entry: ["./src/cli.ts"],
        platform: "browser"
    }
]);
