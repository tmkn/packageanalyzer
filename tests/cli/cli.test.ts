import { CliCommand } from "../../src/cli/common.js";
import { AbstractReport } from "../../src/reports/Report.js";
import { isValidDependencyType } from "../../src/reports/Validation.js";
import { createMockContext } from "../common.js";

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
            getReport(): AbstractReport<any> {
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
