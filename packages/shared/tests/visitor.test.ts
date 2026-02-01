import { describe, test, expect } from "vitest";

import { Visitor } from "../src/visitors/visitor.js";
import { MockLogger } from "../../test-utils/src/common.js";
import { MockProvider, type IMockPackageJson } from "../../test-utils/src/mocks.js";

describe(`Visitor Tests`, () => {
    test(`checks attachment log`, async () => {
        const dep1: IMockPackageJson = {
            name: `dep1`,
            version: `1.0.0`
        };
        const provider = new MockProvider([dep1]);
        const mockLogger = new MockLogger();
        const visitor = new Visitor(["dep1", "1.0.0"], provider, mockLogger, {
            attachmentName: async ({ logger }) => {
                mockLogger.reset();
                logger(`hello from attachment`);
            }
        });

        await visitor.visit();

        const attachmenLogMessage = mockLogger.logs.some(str =>
            str.includes("hello from attachment")
        );

        expect(attachmenLogMessage).toBe(true);
    });
});
