import { describe, test, expect } from "vitest";
import * as path from "path";

import { cli } from "../../src/cli/cli.js";
import { FileSystemPackageProvider } from "../../src/providers/folder.js";
import { createMockContext } from "../common.js";
import { LoopsCommand } from "../../src/cli/loopsCommand.js";

describe(`Loops Command`, () => {
    test(`--package --type`, async () => {
        const { mockContext, stdout, stderr } = createMockContext();
        const command = cli.process([
            `loops`,
            `--package`,
            `testproject2@1.0.0`,
            `--type`,
            `dependencies`
        ]) as LoopsCommand;

        const rootPath = path.join("tests", "data", "testproject2");
        const provider = new FileSystemPackageProvider(rootPath);

        expect.assertions(2);
        command.context = mockContext;
        command.beforeProcess = report => (report.provider = provider);

        await command.execute();

        expect(stdout.lines).toMatchSnapshot(`stdout`);
        expect(stderr.lines).toMatchSnapshot(`stderr`);
    });
});
