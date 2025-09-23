import { z } from "zod";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration.js";
import relativeTime from "dayjs/plugin/relativeTime.js";

import { type ILintCheckWithAttachments } from "../LintRule.js";
import { type IPackage } from "../../../../../shared/src/package/package.js";
import { isUnpublished } from "../../../../../shared/src/npm.js";
import {
    createMetaFileAttachment,
    type MetaFileAttachmentFn
} from "../../../attachments/MetaFileAttachment.js";
import type { AttachmentData } from "../../../../../shared/src/attachments/Attachments.js";
import { npmOnline } from "../../../providers/online.js";

dayjs.extend(duration);
dayjs.extend(relativeTime);

const PackageAgeCheckParams = z.object({
    timespan: z.int()
});

export type IPackageMaturityCheckParams = z.infer<typeof PackageAgeCheckParams>;
type PackageWithMeta = IPackage<AttachmentData<{ metafile: MetaFileAttachmentFn }>>;

export class PackageMaturityCheck
    implements
        ILintCheckWithAttachments<IPackageMaturityCheckParams, { metafile: MetaFileAttachmentFn }>
{
    name = "package-maturity";

    check(pkg: PackageWithMeta, { timespan }: IPackageMaturityCheckParams) {
        const { metaFile } = pkg.getAttachmentData("metafile");

        if (isUnpublished(metaFile)) {
            return;
        }

        const publicationTime = metaFile.time[pkg.version];
        if (!publicationTime) {
            throw new Error(`Could not find publication time for version ${pkg.version}`);
        }

        const time = new Date().toISOString();
        const cutoff = dayjs(time).subtract(Number(timespan), "d");

        if (dayjs(publicationTime).isAfter(cutoff)) {
            const formatted = new Intl.DateTimeFormat("en-US", {
                dateStyle: "medium",
                timeStyle: "short"
            }).format(new Date(publicationTime));

            const ageDays = dayjs().diff(dayjs(publicationTime), "day");
            const missingDays = Number(timespan) - ageDays;

            return `${pkg.fullName} is ${ageDays} ${this._formatDays(ageDays)} old (published ${formatted}); ${missingDays} more ${this._formatDays(missingDays)} required to reach ${timespan}-day maturity`;
        }
    }

    private _formatDays(days: number): string {
        return days === 1 ? "day" : "days";
    }

    attachments = { metafile: createMetaFileAttachment(npmOnline) };

    checkParams() {
        return PackageAgeCheckParams;
    }
}
