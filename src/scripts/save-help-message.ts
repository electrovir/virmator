import {readFile, writeFile} from 'fs/promises';
import {virmator} from '..';
import {Color} from '../api/cli-color';
import {generateHelpMessage, HelpMessageSyntax} from '../api/command/command-to-help-message';
import {formatCode} from '../augments/prettier';
import {virmatorReadme} from '../test/virmator-test-file-paths';

const usageTrigger = '<!-- usage below -->';

async function main(args: string[]) {
    const check = args.join(' ').includes('check');
    const helpMessage = generateHelpMessage(
        virmator.packageBinName,
        virmator.commandMapping,
        HelpMessageSyntax.Markdown,
    );

    const originalReadme = (await readFile(virmatorReadme)).toString();

    const triggerIndex = originalReadme.indexOf(usageTrigger);
    if (triggerIndex === -1) {
        throw new Error(
            `Could not find the trigger "${usageTrigger}" in the README file: ${virmatorReadme}`,
        );
    }

    const newReadme = await formatCode(
        `${originalReadme.slice(0, triggerIndex + usageTrigger.length)}\n\n${helpMessage}`,
        'README.md',
    );

    await writeFile(virmatorReadme, newReadme);

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
