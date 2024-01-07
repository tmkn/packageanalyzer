import { ReleaseUtilities } from "../src/extensions/utilities/ReleaseUtilities";
import { createMockPackage } from "./mocks";

describe(`Release Utilities Tests`, () => {
    test(`returns oldest package`, () => {
        const root = createMockPackage({
            name: "root",
            version: "1.0.0",
            attachments: {
                releaseinfo: { published: `2020-01-01` }
            },
            dependencies: [
                {
                    name: "dep1",
                    version: "1.0.0",
                    attachments: {
                        releaseinfo: { published: `2019-01-01` }
                    },
                    dependencies: [
                        {
                            name: "dep2",
                            version: "1.0.0",
                            attachments: {
                                releaseinfo: { published: `2021-01-01` }
                            }
                        }
                    ]
                }
            ]
        });
        const { oldestPackage } = new ReleaseUtilities(root);

        expect(oldestPackage?.getAttachmentData()).toEqual({
            releaseinfo: { published: `2019-01-01` }
        });
    });

    test(`returns newest package`, () => {
        const root = createMockPackage({
            name: "root",
            version: "1.0.0",
            attachments: {
                releaseinfo: { published: `2019-01-01` }
            },
            dependencies: [
                {
                    name: "dep1",
                    version: "1.0.0",
                    attachments: {
                        releaseinfo: { published: `2021-01-01` }
                    },
                    dependencies: [
                        {
                            name: "dep2",
                            version: "1.0.0",
                            attachments: {
                                releaseinfo: { published: `2020-01-01` }
                            }
                        }
                    ]
                }
            ]
        });
        const { newestPackage } = new ReleaseUtilities(root);

        expect(newestPackage?.getAttachmentData()).toEqual({
            releaseinfo: { published: `2021-01-01` }
        });
    });

    test(`returns oldest package (when root has no publish date)`, () => {
        const root = createMockPackage({
            name: "root",
            version: "1.0.0",
            dependencies: [
                {
                    name: "dep1",
                    version: "1.0.0",
                    attachments: {
                        releaseinfo: { published: `2019-01-01` }
                    }
                }
            ]
        });
        const { oldestPackage } = new ReleaseUtilities(root);

        expect(oldestPackage?.getAttachmentData()).toEqual({
            releaseinfo: { published: `2019-01-01` }
        });
    });

    test(`returns newest package (when root has no publish date)`, () => {
        const root = createMockPackage({
            name: "root",
            version: "1.0.0",
            dependencies: [
                {
                    name: "dep1",
                    version: "1.0.0",
                    attachments: {
                        releaseinfo: { published: `2021-01-01` }
                    }
                }
            ]
        });
        const { newestPackage } = new ReleaseUtilities(root);

        expect(newestPackage?.getAttachmentData()).toEqual({
            releaseinfo: { published: `2021-01-01` }
        });
    });

    test(`returns undefined for oldest on missing release info`, () => {
        const root = createMockPackage({
            name: "root",
            version: "1.0.0",
            dependencies: [
                {
                    name: "dep1",
                    version: "1.0.0"
                }
            ]
        });
        const { oldestPackage } = new ReleaseUtilities(root);

        expect(oldestPackage).toBeUndefined();
    });

    test(`returns undefined for newest on missing release info`, () => {
        const root = createMockPackage({
            name: "root",
            version: "1.0.0",
            dependencies: [
                {
                    name: "dep1",
                    version: "1.0.0"
                }
            ]
        });
        const { newestPackage } = new ReleaseUtilities(root);

        expect(newestPackage).toBeUndefined();
    });
});
