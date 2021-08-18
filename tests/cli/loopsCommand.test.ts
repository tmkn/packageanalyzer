import * as path from "path";
import { PassThrough } from "stream";

import { BaseContext } from "clipanion";

import { cli } from "../../src/cli/cli";
import { FileSystemPackageProvider } from "../../src/providers/folder";

describe(`Loops Command`, () => {
    const mockContext: BaseContext = {
        stdin: process.stdin,
        stdout: new PassThrough(),
        stderr: new PassThrough()
    };

    test(`--package --type`, async () => {
        const command = cli.process([
            `loops`,
            `--package`,
            `testproject2@1.0.0`,
            `--type`,
            `dependencies`
        ]);

        expect.assertions(0);
        command.context = mockContext;

        const rootPath = path.join("tests", "data", "testproject2");
        const provider = new FileSystemPackageProvider(rootPath);

        await command.execute();
    });
});
