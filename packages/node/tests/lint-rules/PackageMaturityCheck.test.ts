import { describe, test, expect, vi, beforeAll, afterAll } from "vitest";
import dayjs from "dayjs";

import {
    PackageMaturityCheck,
    type IPackageMaturityCheckParams
} from "../../src/reports/lint/checks/PackageMaturity.js";

import { createMockPackage } from "../../../test-utils/src/mocks.js";

describe(`PackageMaturityCheck`, () => {
    const now = dayjs(`2021-10-26`);

    beforeAll(() => {
        vi.setSystemTime(now.toDate());
    });

    afterAll(() => {
        vi.useRealTimers();
    });

    function scaffoldPackage(publicationTime: string) {
        return createMockPackage({
            name: "rolo",
            version: "1.0.0",
            attachments: {
                metafile: {
                    metaFile: {
                        time: {
                            "1.0.0": publicationTime
                        }
                    }
                }
            }
        });
    }

    test(`correctly returns message if package is younger than timespan`, () => {
        const now = dayjs();
        const publicationTime = now.subtract(1, "day");
        const pkg = scaffoldPackage(publicationTime.toISOString());

        const rule = new PackageMaturityCheck();
        const result = rule.check(pkg, { timespan: 2 });

        expect(result).toMatchSnapshot();
    });

    test(`should not return a message if package is mature (older than timespan)`, () => {
        const now = dayjs();
        const publicationTime = now.subtract(3, "day");
        const pkg = scaffoldPackage(publicationTime.toISOString());

        const rule = new PackageMaturityCheck();
        const result = rule.check(pkg, { timespan: 2 });

        expect(result).toBeUndefined();
    });

    test(`should not return a message if package is unpublished`, () => {
        const pkg = createMockPackage({
            name: "rolo",
            version: "1.0.0",
            attachments: {
                metafile: {
                    metaFile: {
                        time: {
                            unpublished: {}
                        }
                    }
                }
            }
        });

        const rule = new PackageMaturityCheck();
        const result = rule.check(pkg, { timespan: 2 });

        expect(result).toBeUndefined();
    });

    test(`should throw if version can't be found`, () => {
        const pkg = createMockPackage({
            name: "rolo",
            version: "1.0.0",
            attachments: {
                metafile: {
                    metaFile: {
                        time: {}
                    }
                }
            }
        });

        const rule = new PackageMaturityCheck();
        const check = () => rule.check(pkg, { timespan: 2 });

        expect(check).toThrowError(`Could not find publication time for version 1.0.0`);
    });

    describe(`checkParams`, () => {
        test(`correctly parses valid input`, () => {
            const rule = new PackageMaturityCheck();
            const schema = rule.checkParams();

            const validInput: IPackageMaturityCheckParams = { timespan: 5 };
            const validationResult = schema.safeParse(validInput);
            expect(validationResult.success).toBe(true);
        });

        test(`fails on invalid input`, () => {
            const rule = new PackageMaturityCheck();
            const schema = rule.checkParams();

            // @ts-expect-error testing invalid input
            const invalidInput: IPackageMaturityCheckParams = { timespan: "five" };
            const invalidResult = schema.safeParse(invalidInput);
            expect(invalidResult.success).toBe(false);
        });
    });

    describe(`pluralization`, () => {
        test(`correctly uses "days"`, () => {
            const now = dayjs();
            const publicationTime = now.subtract(2, "day");
            const pkg = scaffoldPackage(publicationTime.toISOString());

            const rule = new PackageMaturityCheck();
            const result = rule.check(pkg, { timespan: 4 });

            expect(result).toMatchSnapshot();
        });

        test(`correctly uses "day"`, () => {
            const now = dayjs();
            const publicationTime = now.subtract(1, "day");
            const pkg = scaffoldPackage(publicationTime.toISOString());

            const rule = new PackageMaturityCheck();
            const result = rule.check(pkg, { timespan: 2 });

            expect(result).toMatchSnapshot();
        });

        test(`correctly uses "day" & "days"`, () => {
            const now = dayjs();
            const publicationTime = now.subtract(1, "day");
            const pkg = scaffoldPackage(publicationTime.toISOString());

            const rule = new PackageMaturityCheck();
            const result = rule.check(pkg, { timespan: 3 });

            expect(result).toMatchSnapshot();
        });
    });
});
