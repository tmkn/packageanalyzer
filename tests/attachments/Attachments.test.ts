import { Package } from "../../src/package/package.js";
import type { AttachmentData, IAttachment } from "../../src/attachments/Attachments.js";
import { createMockPackage } from "../mocks.js";

// tests to make sure that the types work
describe("Attachments Tests", () => {
    test(`single attachment`, () => {
        const p: Package<AttachmentData<IAttachment<"foo", boolean>>> = createMockPackage({});

        p.setAttachmentData("foo", true);
        const attachmentData: boolean = p.getAttachmentData("foo");
        expect(attachmentData).toBe(true);

        // @ts-expect-error, shouldn't accept any other key
        expect(() => p.getAttachmentData("bar")).toThrow(Error);
    });

    test(`multiple attachments`, () => {
        const p: Package<
            AttachmentData<
                [
                    IAttachment<"foo", boolean>,
                    IAttachment<"bar", string>,
                    IAttachment<"baz", number>
                ]
            >
        > = createMockPackage({});

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
});
