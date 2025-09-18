#!/usr/bin/env node

import { Cli } from "clipanion";

import { cli } from "./cli/cli.js";

cli.runExit(process.argv.slice(2), {
    ...Cli.defaultContext
});
