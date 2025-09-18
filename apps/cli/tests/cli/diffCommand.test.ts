import { describe, test, expect } from "vitest";

import { cli } from "../../src/cli/cli.js";
import { DiffCommand } from "../../src/cli/diffCommand.js";
import { createMockContext } from "../../../../packages/test-utils/src/common.js";
import { MockProvider, type IMockPackageJson } from "../../../../packages/test-utils/src/mocks.js";

describe(`Diff Command`, () => {
    const fromPkg: IMockPackageJson = {
        name: `medallo`,
        version: `1.0.0`,
        dependencies: [
            { name: `karolg`, version: `1.0.0` },
            { name: `bandejapaisa`, version: `1.0.0` },
            { name: `rumbear`, version: `1.0.0` },
            { name: `comidarápida`, version: `3.0.0` }
        ]
    };

    const toPkg: IMockPackageJson = {
        name: `barranquilla`,
        version: `1.0.0`,
        dependencies: [
            { name: `shakira`, version: `1.0.0` },
            { name: `desgranado`, version: `1.0.0` },
            { name: `rumbear`, version: `1.0.0` },
            { name: `comidarápida`, version: `4.0.0` }
        ]
    };

    test(`works correctly`, async () => {
        const provider = new MockProvider([fromPkg, toPkg]);
        const command = cli.process([
            `diff`,
            `--range`,
            `medallo@1.0.0`,
            `barranquilla@1.0.0`
        ]) as DiffCommand;
        const { mockContext, stdout, stderr } = createMockContext();

        expect.assertions(2);
        command.context = mockContext;
        command.beforeProcess = report => (report.provider = provider);

        await command.execute();

        expect(stdout.lines).toMatchSnapshot(`stdout`);
        expect(stderr.lines).toMatchSnapshot(`stderr`);
    });

    test(`handles invalid params`, async () => {
        const command = cli.process([
            `diff`,
            `--range`,
            `react@16.12.0`,
            `react@18.2.0`
        ]) as DiffCommand;
        const { mockContext, stdout, stderr } = createMockContext();

        expect.assertions(2);
        command.context = mockContext;

        command.range = [];

        await command.execute();

        expect(stdout.lines).toMatchSnapshot(`stdout`);
        expect(stderr.lines).toMatchSnapshot(`stderr`);
    });
});
