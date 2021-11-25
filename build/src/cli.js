#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const clipanion_1 = require("clipanion");
const cli_1 = require("./cli/cli");
if (require.main === module) {
    cli_1.cli.runExit(process.argv.slice(2), {
        ...clipanion_1.Cli.defaultContext
    });
}
//# sourceMappingURL=cli.js.map