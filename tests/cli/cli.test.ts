import { CliCommand, isValidDependencyType } from "../../src/cli/common";
import { AbstractReport } from "../../src/reports/Report";
import { createMockContext } from "../common";

describe(`CLI Utility`, () => {
    test(`isValidDependencyType`, () => {
        expect(isValidDependencyType("dependencies")).toEqual(true);
        expect(isValidDependencyType("devDependencies")).toEqual(true);
        expect(isValidDependencyType("abc")).toEqual(false);
        expect(isValidDependencyType(3)).toEqual(false);
    });
});

describe(`CliCommand Tests`, () => {
    test(`Correctly writes to stderr on exception`, async () => {
        class ThrowCliCommand extends CliCommand<AbstractReport<any>> {
            createReport(): AbstractReport<any> {
                throw new Error(`Whoops`);
            }
        }

        const command = new ThrowCliCommand();
        const { mockContext, stdout, stderr } = createMockContext();
        command.context = mockContext;

        await command.execute();

        expect(stdout.lines).toMatchSnapshot(`stdout`);
        expect(stderr.lines).toMatchSnapshot(`stderr`);
    });
});
