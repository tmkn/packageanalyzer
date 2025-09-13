import { describe, test, expect } from "vitest";

import { NodeWriter, NodeHost } from "../../src/host/NodeHost.js";
import { npmOnline, OraLogger } from "../../src/index.js";
import { createMockContext } from "../common.js";

describe(`NodeAsyncWriter Tests`, () => {
    test(`writes out all data`, async () => {
        const { stdout } = createMockContext();
        const nodeWriter = new NodeWriter(stdout);

        nodeWriter.write(`line1\n`);
        nodeWriter.write(`line2\n`);

        await nodeWriter.flush();

        expect(stdout.lines).toMatchSnapshot();
    });
});

describe(`NodeHost Tests`, () => {
    test(`returns the same stdout writer`, () => {
        const { stdout, stderr } = createMockContext();
        const host = new NodeHost(stdout, stderr);

        const writer1 = host.getStdoutWriter();
        const writer2 = host.getStdoutWriter();

        expect(writer1).toBe(writer2);
    });

    test(`returns the same stderr writer`, () => {
        const { stdout, stderr } = createMockContext();
        const host = new NodeHost(stdout, stderr);

        const writer1 = host.getStderrWriter();
        const writer2 = host.getStderrWriter();

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
