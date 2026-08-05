import {check} from '@augment-vir/assert';
import {
    collapseWhiteSpace,
    getObjectTypedEntries,
    logColors,
    mapObjectValues,
    type PartialWithUndefined,
    safeMatch,
} from '@augment-vir/common';
import {toPosixPath} from '@augment-vir/node';
import {
    type IndividualPluginCommand,
    virmatorFlags,
    type VirmatorPlugin,
    type VirmatorPluginCliCommands,
} from '@virmator/core';
import {type PluginDocEntry} from '@virmator/core/src/plugin/plugin-init.js';

/** Different syntaxes for each supported help message target environment. */
export enum HelpMessageSyntax {
    Cli = 'cli',
    Markdown = 'markdown',
}

function flattenCommands(
    cliCommands: ReadonlyArray<Readonly<VirmatorPluginCliCommands>>,
): VirmatorPluginCliCommands {
    return cliCommands.reduce((accum, commands) => {
        Object.assign(accum, commands);
        return accum;
    }, {});
}

/** Inputs for {@link generateHelpMessageFromPlugins}. */
export type GenerateHelpMessageFromPluginsParams = {
    plugins: ReadonlyArray<Readonly<Pick<VirmatorPlugin, 'cliCommands'>>>;
    syntax: HelpMessageSyntax;
} & PartialWithUndefined<{
    hideVirmatorExplanations: boolean;
    cliWrapIfMoreThanThisManyColumns: number;
}>;

/** Generate a help message from a list of `VirmatorPlugin` instances. */
export function generateHelpMessageFromPlugins({
    plugins,
    syntax,
    hideVirmatorExplanations = false,
    cliWrapIfMoreThanThisManyColumns = 100,
}: Readonly<GenerateHelpMessageFromPluginsParams>) {
    return generateHelpMessage({
        cliCommands: plugins.map((plugin) => plugin.cliCommands as VirmatorPluginCliCommands),
        syntax,
        hideVirmatorExplanations,
        cliWrapIfMoreThanThisManyColumns,
    });
}

/** Inputs for {@link generateHelpMessage}. */
export type GenerateHelpMessageParams = {
    cliCommands: ReadonlyArray<Readonly<VirmatorPluginCliCommands>>;
    syntax: HelpMessageSyntax;
} & PartialWithUndefined<{
    hideVirmatorExplanations: boolean;
    cliWrapIfMoreThanThisManyColumns: number;
}>;

/**
 * Generate a help message directly from `VirmatorPluginCliCommands`. Used by
 * {@link generateHelpMessageFromPlugins}.
 */
export function generateHelpMessage({
    cliCommands,
    syntax,
    hideVirmatorExplanations = false,
    cliWrapIfMoreThanThisManyColumns = 100,
}: Readonly<GenerateHelpMessageParams>) {
    const allCommands = flattenCommands(cliCommands);
    const format = createFormatter(syntax);

    const commandsMessage = getObjectTypedEntries(allCommands)
        .sort((a, b) => {
            return a[0].localeCompare(b[0]);
        })
        .map(
            ([
                commandName,
                command,
            ]) => {
                return commandToHelpString({
                    commandName,
                    command,
                    format,
                    indentCount: 0,
                });
            },
        )
        .join('\n\n');

    const commandsText =
        `${format.h2}Available commands${format.reset}\n\n${commandsMessage}`.trim();

    const helpMessage = hideVirmatorExplanations
        ? commandsText + '\n'
        : combineHelpMessage(commandsText, format).trim() + '\n';

    return syntax === HelpMessageSyntax.Cli
        ? wrapLines(helpMessage, cliWrapIfMoreThanThisManyColumns, format)
        : helpMessage;
}

/** All supported formats for help messages. */
export const formats = {
    h1: {
        [HelpMessageSyntax.Cli]: logColors.info,
        [HelpMessageSyntax.Markdown]: '# ',
    },
    h2: {
        [HelpMessageSyntax.Cli]: `${logColors.bold}${logColors.info}`,
        [HelpMessageSyntax.Markdown]: '## ',
    },
    bold: {
        [HelpMessageSyntax.Cli]: logColors.bold,
        [HelpMessageSyntax.Markdown]: '**',
    },
    unBold: {
        [HelpMessageSyntax.Cli]: logColors.normalWeight,
        [HelpMessageSyntax.Markdown]: '**',
    },
    code: {
        [HelpMessageSyntax.Cli]: logColors.info,
        [HelpMessageSyntax.Markdown]: '`',
    },
    unCode: {
        [HelpMessageSyntax.Cli]: logColors.reset,
        [HelpMessageSyntax.Markdown]: '`',
    },
    reset: {
        [HelpMessageSyntax.Cli]: logColors.reset,
        [HelpMessageSyntax.Markdown]: '',
    },
    indent: {
        [HelpMessageSyntax.Cli]: '    ',
        [HelpMessageSyntax.Markdown]: '    ',
    },
    bullet: {
        [HelpMessageSyntax.Cli]: '-   ',
        [HelpMessageSyntax.Markdown]: '-   ',
    },
    escape: {
        [HelpMessageSyntax.Cli]: '',
        [HelpMessageSyntax.Markdown]: '\\',
    },
} as const;

/** Help message formatter. */
export type Formatter = Record<keyof typeof formats, string>;

/** Create a help message formatter based on a specific syntax. */
export function createFormatter(syntax: HelpMessageSyntax): Formatter {
    return mapObjectValues(formats, (key, entry) => {
        return entry[syntax];
    });
}

function code(input: string, format: Formatter): string {
    return `${format.code}${input}${format.unCode}`;
}

function bold(input: string, format: Formatter): string {
    return `${format.bold}${input}${format.unBold}`;
}

function flagToHelpString({
    flagName,
    description,
    format,
}: Readonly<{flagName: string; description: string; format: Formatter}>): string {
    return `${format.bullet}${bold(flagName, format)}: ${collapseWhiteSpace(description)}`;
}

function flagsToHelpString(flags: Record<string, {doc: string}>, format: Formatter) {
    return getObjectTypedEntries(flags)
        .map(
            ([
                flagName,
                entry,
            ]) => {
                return flagToHelpString({
                    flagName,
                    description: entry.doc,
                    format,
                });
            },
        )
        .join('\n');
}

function commandToHelpString({
    commandName,
    command,
    format,
    indentCount,
}: Readonly<{
    commandName: string;
    command: IndividualPluginCommand;
    format: Formatter;
    indentCount: number;
}>): string {
    const title = `${indent(indentCount, format)}${format.bullet}${bold(commandName, format)}${format.reset}`;

    const description = commandDocToString(command, format, indentCount);
    const subCommands = getObjectTypedEntries(command.subCommands || {}).map(
        ([
            subCommandName,
            subCommand,
        ]) => {
            return commandToHelpString({
                commandName: subCommandName,
                command: subCommand,
                format,
                indentCount: indentCount + 2,
            });
        },
    );
    const subCommandsBlock = subCommands.length
        ? `\n${indent(indentCount + 1, format)}${format.bullet}Sub Commands\n\n${subCommands.join('\n\n')}`
        : '';

    return `${title}\n\n${description}${subCommandsBlock}`;
}

function indent(count: number, format: Formatter): string {
    return format.indent.repeat(count);
}

function docEntryToString({
    entry,
    indentCount,
    useBullets,
    format,
}: Readonly<{
    entry: PluginDocEntry;
    indentCount: number;
    useBullets: boolean;
    format: Formatter;
}>): string {
    const title = entry.title ? `${entry.title}: ` : '';
    const trimmedEntry = collapseWhiteSpace(entry.content);
    const content = useBullets ? code(trimmedEntry, format) : trimmedEntry;

    return `${indent(indentCount + 1, format)}${useBullets ? format.bullet : ''}${title}${content}`;
}

function commandDocToString(
    command: Readonly<IndividualPluginCommand>,
    format: Readonly<Formatter>,
    indentCount: number,
): string {
    const sections = command.doc.sections.map((section) => {
        return docEntryToString({
            entry: {
                content: section,
            },
            indentCount,
            useBullets: false,
            format,
        });
    });

    const examples = command.doc.examples.map((example) => {
        return docEntryToString({
            entry: example,
            indentCount: indentCount + 1,
            useBullets: true,
            format,
        });
    });

    const exampleBlock = examples.length
        ? `${indent(indentCount + 1, format)}${format.bullet}Examples\n${examples.join('\n')}`
        : '';

    const configs = Object.values(command.configFiles || {}).map((configFile) => {
        const escaped = toPosixPath(configFile.copyToPath).replaceAll(/(_)/g, `${format.escape}$1`);
        return `${indent(indentCount + 2, format)}${format.bullet}${escaped}`;
    });

    const configsBlock = configs.length
        ? `${indent(indentCount + 1, format)}${format.bullet}Configs\n${Array.from(new Set(configs)).join('\n')}`
        : '';

    const deps = Object.keys(command.npmDeps || {}).map((npmDepName) => {
        return `${indent(indentCount + 2, format)}${format.bullet}[${npmDepName}](https://npmjs.com/package/${npmDepName})`;
    });
    const depsBlock = deps.length
        ? `${indent(indentCount + 1, format)}${format.bullet}Deps\n${deps.join('\n')}`
        : '';

    const blocks = [
        sections.length ? sections.join('\n\n') + '\n' : '',
        exampleBlock,
        configsBlock,
        depsBlock,
    ].filter(check.isTruthy);

    return blocks.join('\n');
}

function combineHelpMessage(commandsText: string, format: Formatter): string {
    const flagsText = flagsToHelpString(virmatorFlags, format);
    return `${format.h1}virmator usage${format.reset}\n\n${code('[npx] virmator [--flags] command subCommand [...optional args]', format)}\n\n${format.bullet}${code(
        'npx',
        format,
    )} is needed when the command is run directly from the terminal (not called from within an npm script) unless virmator has been globally installed (which I recommend against).
${format.bullet}${code(
        '[--flags]',
        format,
    )} is any of the optional virmator flags. See Virmator Flags below.
${format.bullet}${code('command', format)}, ${code('subCommand', format)}, and ${code('[...optional args]', format)} depend on the specific command you're running. See Available Commands below.\n\n${commandsText}\n\n${format.h2}Virmator Flags${format.reset}\n\nAll virmator flags are optional and typically not needed.\n\n${flagsText}`;
}

function getIndent(line: string, format: Formatter): string {
    /** This is an edge case for type guarding. */
    /* node:coverage ignore next */
    const indent = safeMatch(line, /^(\s*)/)[0] || '';
    const startsWithBullet = line.trim().startsWith(format.bullet);
    return [
        indent,
        startsWithBullet ? ' '.repeat(format.bullet.length) : '',
    ].join('');
}

/** Wrap lines to within the specified limit. */
export function wrapLines(input: string, limit: number, format: Formatter): string {
    const lines = input.split('\n');

    // using a for loop because the length of the array will get modified while iterating through it
    for (let index = 0; index < lines.length; index++) {
        const line = lines[index];

        if (line && line.length > limit) {
            const replacementLine = line.slice(0, limit);
            lines[index] = replacementLine.trimEnd();
            let wrappedPart = line.slice(limit);

            // didn't wrap on a space, we need to shift a word down
            if (!replacementLine.endsWith(' ') && !wrappedPart.startsWith(' ')) {
                /** This is an edge case for type guarding. */
                /* node:coverage ignore next */
                const lastWord = safeMatch(replacementLine, /(\s\S+$)/)[0] || '';
                lines[index] = replacementLine.slice(0, -1 * lastWord.length).trimEnd();
                wrappedPart = `${lastWord}${wrappedPart.trim()}`;
            }

            const currentIndent = getIndent(line, format);

            lines.splice(index + 1, 0, `${currentIndent}${wrappedPart.trim()}`);
        }
    }

    return lines.join('\n').trimEnd();
}
