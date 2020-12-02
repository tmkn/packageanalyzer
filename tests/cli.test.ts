import { cli } from "../src/cli";
import { AnalyzeCommand } from "../src/cli/analyzeCommand";
import { DownloadCommand } from "../src/cli/downloadCommand";
import { LicenseCheckCommand } from "../src/cli/licenseCommand";
import { LoopsCommand } from "../src/cli/loopsCommand";
import { NpmDumpCommand } from "../src/cli/npmDumpCommand";
import { NpmDumpLookupCreatorCommand } from "../src/cli/npmLookupCreatorCommand";
import { TreeCommand } from "../src/cli/treeCommand";
import { UpdateInfoCommand } from "../src/cli/updateInfoCommand";

describe(`CLI Tests`, () => {
    describe(`Analyze Command`, () => {
        test(`--package --type --full`, async () => {
            const command = cli.process([
                `analyze`,
                `--package`,
                `foobar`,
                `--type`,
                `devDependencies`,
                `--full`
            ]);

            expect(command).toBeInstanceOf(AnalyzeCommand);
        });

        test(`--folder --type --full`, async () => {
            const command = cli.process([
                `analyze`,
                `--folder`,
                `foobar`,
                `--type`,
                `devDependencies`,
                `--full`
            ]);

            expect(command).toBeInstanceOf(AnalyzeCommand);
        });
    });

    describe(`Update Info Command`, () => {
        test(`--package`, async () => {
            const command = cli.process([`update`, `--package`, `foobar`]);

            expect(command).toBeInstanceOf(UpdateInfoCommand);
        });
    });

    describe(`Download Command`, () => {
        test(`--package`, async () => {
            const command = cli.process([`downloads`, `--package`, `foobar`]);

            expect(command).toBeInstanceOf(DownloadCommand);
        });
    });

    describe(`Loops Command`, () => {
        test(`--package --type`, async () => {
            const command = cli.process([
                `loops`,
                `--package`,
                `foobar`,
                `--type`,
                `devDependencies`
            ]);

            expect(command).toBeInstanceOf(LoopsCommand);
        });
    });

    describe(`Tree Command`, () => {
        test(`--package --type`, async () => {
            const command = cli.process([
                `tree`,
                `--package`,
                `foobar`,
                `--type`,
                `devDependencies`
            ]);

            expect(command).toBeInstanceOf(TreeCommand);
        });

        test(`--folder --type`, async () => {
            const command = cli.process([
                `tree`,
                `--folder`,
                `foobar`,
                `--type`,
                `devDependencies`
            ]);

            expect(command).toBeInstanceOf(TreeCommand);
        });
    });

    describe(`License Check Command`, () => {
        test(`--package`, async () => {
            const command = cli.process([`license`, `--package`, `foo`]);

            expect(command).toBeInstanceOf(LicenseCheckCommand);
        });

        test(`--package --grouped`, async () => {
            const command = cli.process([`license`, `--package`, `foo`, `--grouped`]);

            expect(command).toBeInstanceOf(LicenseCheckCommand);
        });

        test(`--package --type`, async () => {
            const command = cli.process([
                `license`,
                `--package`,
                `foo`,
                `--type`,
                `devDependencies`
            ]);

            expect(command).toBeInstanceOf(LicenseCheckCommand);
        });

        test(`--package --allow`, async () => {
            const command = cli.process([
                `license`,
                `--package`,
                `foo`,
                `--allow`,
                `foo1`,
                `--allow`,
                `foo2`
            ]);

            expect(command).toBeInstanceOf(LicenseCheckCommand);
        });

        test(`--folder`, async () => {
            const command = cli.process([`license`, `--folder`, `foo`]);

            expect(command).toBeInstanceOf(LicenseCheckCommand);
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
});

