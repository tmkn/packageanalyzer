import { NodeAsyncWriter, NodeHost } from "../../src/host/NodeHost.js";
import { npmOnline, OraLogger } from "../../src/index.js";
import { createMockContext } from "../common.js";

describe(`NodeAsyncWriter Tests`, () => {
    test(`writes out all data`, async () => {
        const { stdout } = createMockContext();
        const asyncWriter = new NodeAsyncWriter(stdout);

        asyncWriter.write(`line1\n`);
        asyncWriter.write(`line2\n`);

        await asyncWriter.flush();

        expect(stdout.lines).toMatchSnapshot();
    });
});

describe(`NodeHost Tests`, () => {
    test(`returns the same stdout writer`, () => {
        const { stdout, stderr } = createMockContext();
        const host = new NodeHost(stdout, stderr);

        const writer1 = host.getStdout();
        const writer2 = host.getStdout();

        expect(writer1).toBe(writer2);
    });

    test(`returns the same stderr writer`, () => {
        const { stdout, stderr } = createMockContext();
        const host = new NodeHost(stdout, stderr);

        const writer1 = host.getStderr();
        const writer2 = host.getStderr();

        expect(writer1).toBe(writer2);
    });

    test(`returns npmOnline as default provider`, () => {
        const { stdout, stderr } = createMockContext();
        const host = new NodeHost(stdout, stderr);

        const defaultProvider = host.getDefaultProvider();

        expect(defaultProvider).toBe(npmOnline);
    });

    test(`returns OraLogger as logger`, () => {
        const { stdout, stderr } = createMockContext();
        const host = new NodeHost(stdout, stderr);

        const logger = host.getLogger();

        expect(logger).toBeInstanceOf(OraLogger);
    });
});
