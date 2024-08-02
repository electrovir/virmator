import {logColors} from '@augment-vir/node-js';
import {generateHelpMessageFromPlugins, HelpMessageSyntax} from '@virmator/help';
import {readFile, writeFile} from 'node:fs/promises';
import {join, resolve} from 'node:path';
import {defaultVirmatorPlugins} from 'virmator';

const monoRepoPath = resolve(import.meta.dirname, '..', '..', '..');
const virmatorPath = join(monoRepoPath, 'packages', 'virmator');

const virmatorReadme =
    `# @virmator\n\n` +
    'A package for centralizing and automating mind-numbingly repetitive repo tasks and checks. New commands can easily be added through a plugin system.\n\n' +
    generateHelpMessageFromPlugins(defaultVirmatorPlugins, HelpMessageSyntax.Markdown);

export async function checkVirmatorReadme() {
    const currentContents = (await readFile(join(virmatorPath, 'README.md'))).toString();
    if (currentContents !== virmatorReadme) {
        throw new Error(
            `README mismatch in virmator.\n${logColors.info}Run \`cd packages/scripts && npm start\` to update.${logColors.reset}`,
        );
    }
}

export async function writeVirmatorReadme() {
    await writeFile(join(virmatorPath, 'README.md'), virmatorReadme);
}
