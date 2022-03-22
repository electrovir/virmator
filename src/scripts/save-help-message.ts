import {printShellCommandOutput, runShellCommand} from 'augment-vir/dist/node-only';
import {readFile, writeFile} from 'fs/promises';
import {Color} from '../cli/cli-util/cli-color';
import {generateHelpMessage} from '../cli/commands/all-cli-commands';
import {MessageSyntax} from '../cli/commands/description-printing';
import {virmatorReadme} from '../file-paths/virmator-test-file-paths';

const usageTrigger = '<!-- usage below -->';

async function main(args: string[]) {
    const check = args.join(' ').includes('check');
    const helpMessage = generateHelpMessage(MessageSyntax.Markdown);

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

    const formatCommand = `node dist/cli/cli.js format write ./README.md`;
    const formatOutput = await runShellCommand(formatCommand);

    printShellCommandOutput({
        stderr: formatOutput.stderr,
        stdout: formatOutput.stdout,
    });

    if (check) {
        const formattedReadme = (await readFile(virmatorReadme)).toString();

        const wasReadmeChanged = formattedReadme !== originalReadme;

        await writeFile(virmatorReadme, originalReadme);

        if (wasReadmeChanged) {
            throw new Error(
                `${Color.Bold}${Color.Fail}README usage message is not up to date.${Color.Reset}`,
            );
        }
    }
}

main(process.argv.slice(2)).catch((error) => {
    console.error(error);
    process.exit(1);
});
