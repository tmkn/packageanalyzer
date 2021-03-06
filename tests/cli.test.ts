import * as path from "path";
import { PassThrough } from "stream";

import { BaseContext } from "clipanion";

import { cli } from "../src/cli";
import { AnalyzeCommand } from "../src/cli/analyzeCommand";
import { DownloadCommand } from "../src/cli/downloadCommand";
import { LicenseCheckCommand } from "../src/cli/licenseCommand";
import { LoopsCommand } from "../src/cli/loopsCommand";
import { NpmDumpCommand } from "../src/cli/npmDumpCommand";
import { NpmDumpLookupCreatorCommand } from "../src/cli/npmLookupCreatorCommand";
import { TreeCommand } from "../src/cli/treeCommand";
import { UpdateInfoCommand } from "../src/cli/updateInfoCommand";
import { OnlinePackageProvider } from "../src/providers/online";
import { MockNpmServer } from "./server";
import { FileSystemPackageProvider } from "../src/providers/folder";
import { isValidDependencyType } from "../src/cli/common";

describe(`CLI Tests`, () => {
    const mockContext: BaseContext = {
        stdin: process.stdin,
        stdout: new PassThrough(),
        stderr: new PassThrough()
    };

    describe(`Analyze Command`, () => {
        let server: MockNpmServer;
        let provider: OnlinePackageProvider;

        beforeAll(() => {
            server = new MockNpmServer(3008);
            provider = new OnlinePackageProvider(`http://localhost:${server.port}`);
        });

        test(`--package --type --full`, async () => {
            const command = cli.process([
                `analyze`,
                `--package`,
                `react@16.8.1`,
                `--type`,
                `dependencies`,
                `--full`
            ]);

            expect.assertions(0);
            command.context = mockContext;
            AnalyzeCommand.OnlineProvider = provider;
            await command.execute();
        });

        test(`--package --type`, async () => {
            const command = cli.process([
                `analyze`,
                `--package`,
                `react@16.8.1`,
                `--type`,
                `dependencies`
            ]);

            expect.assertions(0);
            command.context = mockContext;
            AnalyzeCommand.OnlineProvider = provider;
            await command.execute();
        });

        test(`--folder --type --full`, async () => {
            const command = cli.process([
                `analyze`,
                `--folder`,
                path.join("tests", "data", "testproject1"),
                `--type`,
                `dependencies`,
                `--full`
            ]);

            expect.assertions(0);
            command.context = mockContext;

            await command.execute();
        });

        afterAll(() => {
            server.close();
        });
    });

    describe(`Update Info Command`, () => {
        let server: MockNpmServer;
        let provider: OnlinePackageProvider;

        beforeAll(() => {
            server = new MockNpmServer(3005);
            provider = new OnlinePackageProvider(`http://localhost:${server.port}`);
        });

        test(`--package`, async () => {
            const command = cli.process([`update`, `--package`, `react@16.8.1`]);

            expect.assertions(0);
            command.context = mockContext;
            UpdateInfoCommand.OnlineProvider = provider;

            await command.execute();
        });

        afterAll(() => {
            server.close();
        });
    });

    describe(`Download Command`, () => {
        let server: MockNpmServer;

        beforeAll(() => {
            server = new MockNpmServer(3006);
        });

        test(`--package`, async () => {
            const command = cli.process([`downloads`, `--package`, `_download`]);

            expect.assertions(0);
            command.context = mockContext;
            DownloadCommand.DownloadUrl = `http://localhost:${server.port}/`;

            await command.execute();
        });

        afterAll(() => {
            server.close();
        });
    });

    describe(`Loops Command`, () => {
        test(`--package --type`, async () => {
            const command = cli.process([
                `loops`,
                `--package`,
                `testproject2@1.0.0`,
                `--type`,
                `dependencies`
            ]);

            expect.assertions(0);
            command.context = mockContext;

            const rootPath = path.join("tests", "data", "testproject2");
            const provider = new FileSystemPackageProvider(rootPath);

            LoopsCommand.Provider = provider;
            await command.execute();
        });
    });

    describe(`Tree Command`, () => {
        let server: MockNpmServer;
        let provider: OnlinePackageProvider;

        beforeAll(() => {
            server = new MockNpmServer(3001);
            provider = new OnlinePackageProvider(`http://localhost:${server.port}`);
        });

        test(`--package --type`, async () => {
            const command = cli.process([
                `tree`,
                `--package`,
                `react@16.8.1`,
                `--type`,
                `dependencies`
            ]);

            expect.assertions(0);
            command.context = mockContext;
            TreeCommand.OnlineProvider = provider;
            await command.execute();
        });

        test(`--folder --type`, async () => {
            const command = cli.process([
                `tree`,
                `--folder`,
                path.join("tests", "data", "testproject1"),
                `--type`,
                `dependencies`
            ]);

            expect.assertions(0);
            command.context = mockContext;

            await command.execute();
        });

        afterAll(() => {
            server.close();
        });
    });

    describe(`License Check Command`, () => {
        let server: MockNpmServer;
        let provider: OnlinePackageProvider;

        beforeAll(() => {
            server = new MockNpmServer(3002);
            provider = new OnlinePackageProvider(`http://localhost:${server.port}`);
        });

        test(`--package`, async () => {
            const command = cli.process([`license`, `--package`, `react@16.8.1`]);

            expect.assertions(0);
            command.context = mockContext;
            LicenseCheckCommand.OnlineProvider = provider;
            await command.execute();
        });

        test(`--package --grouped`, async () => {
            const command = cli.process([`license`, `--package`, `react@16.8.1`, `--grouped`]);

            expect.assertions(0);
            command.context = mockContext;
            LicenseCheckCommand.OnlineProvider = provider;
            await command.execute();
        });

        test(`--package --type`, async () => {
            const command = cli.process([
                `license`,
                `--package`,
                `react@16.8.1`,
                `--type`,
                `devDependencies`
            ]);

            expect.assertions(0);
            command.context = mockContext;
            LicenseCheckCommand.OnlineProvider = provider;
            await command.execute();
        });

        test(`--package --allow`, async () => {
            const command = cli.process([
                `license`,
                `--package`,
                `react@16.8.1`,
                `--allow`,
                `foo1`,
                `--allow`,
                `foo2`
            ]);

            expect.assertions(0);
            command.context = mockContext;
            LicenseCheckCommand.OnlineProvider = provider;
            await command.execute();
        });

        test(`--folder`, async () => {
            const command = cli.process([
                `license`,
                `--folder`,
                path.join("tests", "data", "testproject1")
            ]);

            expect.assertions(0);
            command.context = mockContext;

            await command.execute();
        });

        afterAll(() => {
            server.close();
        });
    });

    describe(`Npmdump Command`, () => {
        test(`--npmfile --package`, async () => {
            const command = cli.process([`npmdump`, `--package`, `foo`, `--npmfile`, `foo`]);

            expect(command).toBeInstanceOf(NpmDumpCommand);
        });
    });

    describe(`Npmdump Lookup Creater`, () => {
        test(`--npmfile`, async () => {
            const command = cli.process([`lookupfile`, `--npmfile`, `foo`]);

            expect(command).toBeInstanceOf(NpmDumpLookupCreatorCommand);
        });
    });

    describe(`CLI Utility`, () => {
        test(`isValidDependencyType`, () => {
            expect(isValidDependencyType("dependencies")).toEqual(true);
            expect(isValidDependencyType("devDependencies")).toEqual(true);
            expect(isValidDependencyType("abc")).toEqual(false);
            expect(isValidDependencyType(3)).toEqual(false);
        });
    });
});
