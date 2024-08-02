import {awaitedForEach} from '@augment-vir/common';
import {logColors} from '@augment-vir/node-js';
import {generateHelpMessageFromPlugins, HelpMessageSyntax} from '@virmator/help';
import {readFile, writeFile} from 'node:fs/promises';
import {basename, join, relative, resolve} from 'node:path';
import {defaultVirmatorPlugins} from 'virmator';

const monoRepoPath = resolve(import.meta.dirname, '..', '..', '..');

const pluginReadmes = defaultVirmatorPlugins.reduce((accum: Record<string, string>, plugin) => {
    accum[relative(monoRepoPath, plugin.pluginPackageRootPath)] =
        `# @virmator/${basename(plugin.pluginPackageRootPath)}\n\n` +
        'A default plugin for [virmator](https://www.npmjs.com/package/virmator).\n\n' +
        generateHelpMessageFromPlugins([plugin], HelpMessageSyntax.Markdown, true);
    return accum;
}, {});

export async function checkPluginReadmes() {
    await awaitedForEach(
        Object.entries(pluginReadmes),
        async ([
            relativePath,
            content,
        ]) => {
            const currentContents = (
                await readFile(join(monoRepoPath, relativePath, 'README.md'))
            ).toString();
            if (currentContents !== content) {
                throw new Error(
                    `README mismatch in ${relativePath}.\n${logColors.info}Run \`cd packages/scripts && npm start\` to update.${logColors.reset}`,
                );
            }
        },
    );
}

export async function writePluginReadmes() {
    await awaitedForEach(
        Object.entries(pluginReadmes),
        async ([
            relativePath,
            content,
        ]) => {
            await writeFile(join(monoRepoPath, relativePath, 'README.md'), content);
        },
    );
}
