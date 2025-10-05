import { createPatch, diffLines, type ChangeObject } from "diff";
import * as prettier from "prettier";

import type { IPackage } from "../package/package.js";

interface VersionDiff {
    packageName: string;
    oldVersion: string;
    newVersion: string;
    added: FileEntryAdded[];
    removed: FileEntryRemoved[];
    changed: FileEntryChanged[];
    unchanged: FileEntryUnchanged[];
}

interface FileEntry {
    filename: string;
    content: string;
    formattedContent: string;
}

interface FileEntryAdded extends FileEntry {
    type: `added`;
}

interface FileEntryRemoved extends FileEntry {
    type: `removed`;
}

interface FileEntryChanged extends FileEntry {
    type: `changed`;
    oldContent: string;
    formattedOldContent: string;
    diffLines: ChangeObject<string>[];
}

interface FileEntryUnchanged extends FileEntry {
    type: `unchanged`;
}

type FileEntryDiff = FileEntryAdded | FileEntryRemoved | FileEntryChanged | FileEntryUnchanged;

// todo use the one from the TarAttachment file
// it's currently in the node package, as the tar dependency needs nodejs
interface ITarData {
    files: Map<string, string>;
}

export async function createVersionDiff(
    from: IPackage<{ tar: ITarData }>,
    to: IPackage<{ tar: ITarData }>
): Promise<VersionDiff> {
    if (from.name !== to.name) {
        throw new Error(`Packages don't match: ${from.name} vs ${to.name}`);
    }

    const { files: filesFrom } = from.getAttachmentData(`tar`);
    const { files: filesTo } = to.getAttachmentData(`tar`);

    const removedFiles: FileEntryRemoved[] = [...filesFrom]
        .filter(([fileName]) => !filesTo.has(fileName))
        .map(([fileName, fileContent]) => ({
            ...createFileEntry(fileName, fileContent),
            type: `removed`
        }));
    const addedFiles: FileEntryAdded[] = [...filesTo]
        .filter(([fileName]) => !filesFrom.has(fileName))
        .map(([fileName, fileContent]) => ({
            ...createFileEntry(fileName, fileContent),
            type: `added`
        }));

    const sharedFiles: string[] = [...filesFrom]
        .filter(([fileName]) => filesTo.has(fileName))
        .map(([fileName]) => fileName);
    const changedFiles: FileEntryChanged[] = [];
    const unchangedFiles: FileEntryUnchanged[] = [];

    for (const sharedFile of sharedFiles) {
        const oldContent = filesFrom.get(sharedFile)!;
        const newContent = filesTo.get(sharedFile)!;

        if (!isSameFileContent(oldContent, newContent)) {
            changedFiles.push({
                ...createFileEntry(sharedFile, newContent),
                type: `changed`,
                oldContent,
                formattedOldContent: oldContent,
                diffLines: []
            });
        } else {
            unchangedFiles.push({
                ...createFileEntry(sharedFile, newContent),
                type: `unchanged`
            });
        }
    }

    // format new and changed files with prettier
    for (const file of [...addedFiles, ...changedFiles]) {
        if (file.type === `changed`) {
            file.formattedOldContent = await formatFileContent(file.filename, file.oldContent);

            file.diffLines = diffLines(file.formattedOldContent, file.formattedContent);
        } else if (file.type === `added`) {
            file.formattedContent = await formatFileContent(file.filename, file.content);
        }
    }

    return {
        packageName: from.name,
        oldVersion: from.version,
        newVersion: to.version,
        added: addedFiles,
        removed: removedFiles,
        changed: changedFiles,
        unchanged: unchangedFiles
    };
}

function createFileEntry(filename: string, content: string): FileEntry {
    // todo use prettier to format content
    return { filename, content, formattedContent: content };
}

function isSameFileContent(a: string, b: string): boolean {
    return a === b;
}

async function formatFileContent(filename: string, content: string): Promise<string> {
    const sourceFileEndings: string[] = [`.js`, `.cjs`, `.mjs`];

    if (sourceFileEndings.some(ending => filename.endsWith(ending))) {
        return prettier.format(content, { parser: `typescript` });
    } else if (filename.endsWith(`.json`)) {
        return prettier.format(content, { parser: `json` });
    }

    return content;
}
