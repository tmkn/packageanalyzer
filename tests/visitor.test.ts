import { describe, test, expect } from "vitest";

import { Visitor } from "../src/index.js";
import { MockLogger } from "./common.js";
import { type IMockPackageJson, MockProvider } from "./mocks.js";

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

        expect(mockLogger.logs[0]).toMatchSnapshot();
    });
});
