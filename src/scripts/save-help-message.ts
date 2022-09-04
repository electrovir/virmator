import {printShellCommandOutput, runShellCommand} from 'augment-vir/dist/cjs/node-only';
import {readFile, writeFile} from 'fs/promises';
import {Color} from '../api/cli-color';
import {allCliCommandDefinitions} from '../cli-old/all-cli-command-definitions';
import {
    generateHelpMessage,
    MessageSyntax,
} from '../cli-old/cli-command/cli-command-to-help-message';
import {virmatorReadme} from '../file-paths/virmator-test-file-paths';

const usageTrigger = '<!-- usage below -->';

async function main(args: string[]) {
    const check = args.join(' ').includes('check');
    const helpMessage = generateHelpMessage(allCliCommandDefinitions, MessageSyntax.Markdown);

    const originalReadme = (await readFile(virmatorReadme)).toString();

    const triggerIndex = originalReadme.indexOf(usageTrigger);
    if (triggerIndex === -1) {
        throw new Error(
            `Could not find the trigger "${usageTrigger}" in the README file: ${virmatorReadme}`,
        );
    }

    const newReadme = `${originalReadme.slice(
        0,
        triggerIndex + usageTrigger.length,
    )}\n\n${helpMessage}`;

    await writeFile(virmatorReadme, newReadme);

    const formatCommand = `node dist/cli/cli.js format ./README.md`;
    const formatOutput = await runShellCommand(formatCommand);

    if (!check) {
        printShellCommandOutput(formatOutput);
    }

    if (check) {
        const formattedReadme = (await readFile(virmatorReadme)).toString();

        const wasReadmeChanged = formattedReadme !== originalReadme;

        await writeFile(virmatorReadme, originalReadme);

        if (wasReadmeChanged) {
            console.info(
                `${Color.Bold}${Color.Fail}README usage message is not up to date.${Color.Reset}\nRun ${Color.Info}npm run readme:update${Color.Reset} to update.\n`,
            );
            throw new Error(`README not up to date.`);
        }
    }
}

main(process.argv.slice(2)).catch((error) => {
    console.error(error);
    process.exit(1);
});
