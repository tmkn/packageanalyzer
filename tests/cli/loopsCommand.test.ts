import * as path from "path";
import { PassThrough } from "stream";

import { BaseContext } from "clipanion";

import { cli } from "../../src/cli/cli";
import { FileSystemPackageProvider } from "../../src/providers/folder";
import { TestWritable } from "../common";

describe(`Loops Command`, () => {
    const stdout = new TestWritable();
    const mockContext: BaseContext = {
        stdin: process.stdin,
        stdout,
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

        //todo use provider
        const rootPath = path.join("tests", "data", "testproject2");
        const provider = new FileSystemPackageProvider(rootPath);

        expect.assertions(1);
        command.context = mockContext;

        await command.execute();

        expect(stdout.lines).toMatchSnapshot();
    });
});
