import {getObjectTypedKeys, safeMatch} from 'augment-vir';
import {Color} from '../cli-color';
import {CommandDescription, HelpSection} from './command-help';
import {CommandMapping} from './command-mapping';
import {CommandDefinition} from './define-command';

export enum HelpMessageSyntax {
    Cli = 'cli',
    Markdown = 'markdown',
}

export function generateHelpMessage(
    packageBinName: string,
    commandDefinitions: Readonly<CommandMapping>,
    syntax: HelpMessageSyntax,
    cliWrapIfMoreThanThisManyColumns = 100,
) {
    const commandsMessage = [...getObjectTypedKeys(commandDefinitions)]
        .sort()
        .map((commandName) => {
            const commandDefinition = commandDefinitions[commandName];
            if (!commandDefinition) {
                throw new Error(`Command definition was missing for key "${commandName}"`);
            }

            return commandToHelpString(packageBinName, commandDefinition, syntax);
        })
        .join('\n');

    const helpMessage = combineHelpMessage(packageBinName, commandsMessage, syntax);

    return syntax === HelpMessageSyntax.Cli
        ? wrapLines(helpMessage, cliWrapIfMoreThanThisManyColumns)
        : helpMessage;
}

const formatting = (<T extends Record<string, Record<HelpMessageSyntax, string>>>(input: T) =>
    input)({
    h1: {
        [HelpMessageSyntax.Cli]: `${Color.Info}`,
        [HelpMessageSyntax.Markdown]: '# ',
    },
    h2: {
        [HelpMessageSyntax.Cli]: `${Color.Bold}${Color.Info}`,
        [HelpMessageSyntax.Markdown]: '## ',
    },
    h3: {
        [HelpMessageSyntax.Cli]: ``,
        [HelpMessageSyntax.Markdown]: '### ',
    },
    reset: {
        [HelpMessageSyntax.Cli]: `${Color.Reset}`,
        [HelpMessageSyntax.Markdown]: '',
    },
    indent: {
        [HelpMessageSyntax.Cli]: `    `,
        [HelpMessageSyntax.Markdown]: '',
    },
    colon: {
        [HelpMessageSyntax.Cli]: `:`,
        [HelpMessageSyntax.Markdown]: '',
    },
    bullet: {
        [HelpMessageSyntax.Cli]: `- `,
        [HelpMessageSyntax.Markdown]: '  - ',
    },
} as const);

function formatWithSyntax(key: keyof typeof formatting, syntax: HelpMessageSyntax): string {
    return formatting[key][syntax];
}

function code(input: string, block: boolean, indent: string, syntax: HelpMessageSyntax): string {
    if (syntax === HelpMessageSyntax.Markdown) {
        if (block) {
            return `\n${indent}\`\`\`\n${indent}${input
                .split('\n')
                .join(`\n${indent}`)}\n${indent}\`\`\`\n`;
        } else {
            return `${indent}\`${input}\``;
        }
    } else {
        return input;
    }
}

export function flagToHelpString(
    flagName: string,
    description: string,
    syntax: HelpMessageSyntax,
): string {
    const format = (key: keyof typeof formatting) => formatWithSyntax(key, syntax);

    return `${indent(1, syntax)}${format('h2')}${code(flagName, false, '', syntax)}${format(
        'reset',
    )}${format('colon')}\n${indent(2, syntax)}${description.trim()}`;
}

export function commandToHelpString(
    packageBinName: string,
    commandDefinition: CommandDefinition,
    syntax: HelpMessageSyntax,
): string {
    const commandDescription = commandDefinition.createDescription({
        packageBinName,
        commandName: commandDefinition.commandName,
        subCommands: commandDefinition.subCommands,
        configFiles: commandDefinition.configFiles,
    });

    const format = (key: keyof typeof formatting) => formatWithSyntax(key, syntax);

    const title = `${indent(1, syntax)}${format('h2')}${commandDefinition.commandName}${format(
        'reset',
    )}${format('colon')}`;
    const description = commandDescriptionToMessage(commandDescription, syntax);
    const subCommandDescriptions = subCommandDescriptionsToMessage(
        commandDefinition.subCommandDescriptions,
        syntax,
    );

    return `${title}\n${description}\n${subCommandDescriptions}\n`;
}

function subCommandDescriptionsToMessage(
    subCommandDescriptions: Record<string, string>,
    syntax: HelpMessageSyntax,
): string {
    return getObjectTypedKeys(subCommandDescriptions).reduce((accum, currentKey, index) => {
        const keyDescription = subCommandDescriptions[currentKey];
        const leadingLine = index > 0 ? '\n\n' : '';
        const fullDescription = `${leadingLine}${formatWithSyntax(
            'h3',
            syntax,
        )}${currentKey}${formatWithSyntax('colon', syntax)}\n${indent(2, syntax)}${keyDescription}`;
        return accum + fullDescription;
    }, '');
}

function indent(input: number, syntax: HelpMessageSyntax): string {
    return formatWithSyntax('indent', syntax).repeat(input);
}

function sectionToString(
    section: HelpSection,
    extraIndent: number,
    syntax: HelpMessageSyntax,
    bullets: boolean,
): string {
    const format = (key: keyof typeof formatting) => formatWithSyntax(key, syntax);

    const sectionIndent = indent(2 + extraIndent, syntax);
    const separator = syntax === HelpMessageSyntax.Cli || !bullets ? `:\n` : ': ';
    const header = bullets ? '' : format('h3');

    const title = section.title ? `${sectionIndent}${header}${section.title}${separator}` : '';
    if (bullets && syntax === HelpMessageSyntax.Markdown) {
        return `${format('bullet')}${title}${code(
            section.content,
            section.content.includes('\n'),
            syntax === HelpMessageSyntax.Markdown && section.content.includes('\n') ? '    ' : '',
            syntax,
        )}`;
    } else {
        const contentIndent = section.title ? indent(3 + extraIndent, syntax) : sectionIndent;
        return `${title}${contentIndent}${section.content.split('\n').join(`\n${contentIndent}`)}`;
    }
}

function commandDescriptionToMessage(
    description: CommandDescription,
    syntax: HelpMessageSyntax,
): string {
    const format = (key: keyof typeof formatting) => formatWithSyntax(key, syntax);

    const sections = description.sections
        .map((section) => sectionToString(section, 0, syntax, false))
        .join('\n\n');

    const examples = description.examples
        .map((example) => sectionToString(example, 1, syntax, true))
        .join('\n');
    const examplesTitle = description.examples.length
        ? `\n\n${indent(2, syntax)}${format('h3')}Examples${format('reset')}${format('colon')}\n`
        : '';

    return `${sections}${examplesTitle}${examples}`;
}

function combineHelpMessage(
    packageBinName: string,
    commandsText: string,
    syntax: HelpMessageSyntax,
): string {
    const format = (key: keyof typeof formatting) => formatWithSyntax(key, syntax);

    return `${formatting.h1[syntax]}${packageBinName} usage${format('colon')}${format('reset')}
${format('indent')}${code(`[npx] ${packageBinName} [--flags] command subCommand`, true, '', syntax)}

${format('indent')}${code(
        'npx',
        false,
        '',
        syntax,
    )} is needed when the command is run directly from the terminal (not scoped within an npm script) unless the package has been globally installed (which will work just fine but I wouldn't recommend, simply because I prefer explicit dependencies).

${format('h1')}Available commands${format('colon')}${format('reset')}
${commandsText}`;
}

function getIndent(line: string): string {
    return safeMatch(line, /^(\s*)/)[0] ?? '';
}

function wrapLines(input: string, limit: number): string {
    const lines = input.split('\n');

    // using a for loop because the length of the array will get modified while iterating through it
    for (let index = 0; index < lines.length; index++) {
        const line = lines[index];

        if (line && line.length > limit) {
            const nextIndex = index + 1;
            const nextLine: string = lines[nextIndex] ?? '';

            const newLine = line.slice(0, limit);
            lines[index] = newLine.trimEnd();
            let wrappedPart = line.slice(limit);

            // didn't wrap on a space, we need to shift a word down
            if (!newLine.endsWith(' ') && !wrappedPart.startsWith(' ')) {
                const lastWord = safeMatch(newLine, /(\s\S+$)/)[0] ?? '';
                lines[index] = newLine.slice(0, -1 * lastWord.length).trimEnd();
                wrappedPart = `${lastWord}${wrappedPart.trim()}`;
            }

            const currentIndent = getIndent(line);
            const nextIndent = getIndent(nextLine);
            if (currentIndent === nextIndent) {
                lines[nextIndex] = `${currentIndent}${wrappedPart.trim()} ${nextLine.trim()}`;
            } else {
                lines.splice(nextIndex, 0, `${currentIndent}${wrappedPart.trim()}`);
            }
        }
    }

    return lines.join('\n').trimEnd();
}
