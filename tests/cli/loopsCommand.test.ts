import * as path from "path";

import { cli } from "../../src/cli/cli";
import { FileSystemPackageProvider } from "../../src/providers/folder";
import { createMockContext } from "../common";
import { LoopsCommand } from "../../src/cli/loopsCommand";

describe(`Loops Command`, () => {
    const { mockContext, stdout } = createMockContext();

    test(`--package --type`, async () => {
        const command = cli.process([
            `loops`,
            `--package`,
            `testproject2@1.0.0`,
            `--type`,
            `dependencies`
        ]) as LoopsCommand;

        const rootPath = path.join("tests", "data", "testproject2");
        const provider = new FileSystemPackageProvider(rootPath);

        expect.assertions(1);
        command.context = mockContext;
        command.beforeProcess = report => (report.provider = provider);

        await command.execute();

        expect(stdout.lines).toMatchSnapshot();
    });
});
