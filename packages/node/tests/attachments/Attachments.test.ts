import { describe, test, expect } from "vitest";

import { Package } from "../../../shared/src/package/package.js";
import {
    classToAttachmentFn,
    type AttachmentData,
    type AttachmentFn,
    type IClassAttachment
} from "../../../shared/src/attachments/Attachments.js";
import { createMockPackage } from "../../../test-utils/src/mocks.js";

// tests to make sure that the types work
describe("Attachments Tests", () => {
    test(`single attachment`, () => {
        type AttachmentsSingle = {
            foo: AttachmentFn<boolean>;
        };
        const p: Package<AttachmentData<AttachmentsSingle>> = createMockPackage({});

        p.setAttachmentData("foo", true);
        const attachmentData: boolean = p.getAttachmentData("foo");
        expect(attachmentData).toBe(true);

        // @ts-expect-error, shouldn't accept any other key
        expect(() => p.getAttachmentData("bar")).toThrow(Error);
    });

    test(`multiple attachments`, () => {
        type AttachmentsMultiple = {
            foo: AttachmentFn<boolean>;
            bar: AttachmentFn<string>;
            baz: AttachmentFn<number>;
        };
        const p: Package<AttachmentData<AttachmentsMultiple>> = createMockPackage({});

        p.setAttachmentData("foo", true);
        p.setAttachmentData("bar", "hello");
        p.setAttachmentData("baz", 123);

        const foo: boolean = p.getAttachmentData("foo");
        const bar: string = p.getAttachmentData("bar");
        const baz: number = p.getAttachmentData("baz");

        expect(foo).toBe(true);
        expect(bar).toBe("hello");
        expect(baz).toBe(123);

        // @ts-expect-error, shouldn't accept any other key
        expect(() => p.getAttachmentData("qux")).toThrow(Error);
    });

    describe(`classToAttachmentFn`, () => {
        test(`correctly applys this`, async () => {
            class TestAttachment implements IClassAttachment<string> {
                constructor(private _data: string) {}

                async apply(): Promise<string> {
                    expect(this).toBeInstanceOf(TestAttachment);

                    return Promise.resolve(`${this._data}`);
                }
            }

            const attachmentFn = classToAttachmentFn(TestAttachment);

            expect.assertions(2);
            const result = await attachmentFn("huevon")();

            expect(result).toBe("huevon");
        });
    });
});
