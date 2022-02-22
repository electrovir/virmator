import {safeMatch} from 'augment-vir';
import {packageName} from '../../package-name';
import {Color} from '../cli-util/cli-color';
import {CliCommandImplementation, CliHelpDescription, CliHelpSection} from './cli-command';

export enum MessageSyntax {
    Bash = 'bash',
    Markdown = 'markdown',
}

const formatting = (<T extends Record<string, Record<MessageSyntax, string>>>(input: T) => input)({
    h2: {
        [MessageSyntax.Bash]: `${Color.Info}`,
        [MessageSyntax.Markdown]: '## ',
    },
    h3: {
        [MessageSyntax.Bash]: `${Color.Bold}${Color.Info}`,
        [MessageSyntax.Markdown]: '### ',
    },
    h4: {
        [MessageSyntax.Bash]: ``,
        [MessageSyntax.Markdown]: '#### ',
    },
    reset: {
        [MessageSyntax.Bash]: `${Color.Reset}`,
        [MessageSyntax.Markdown]: '',
    },
    indent: {
        [MessageSyntax.Bash]: `    `,
        [MessageSyntax.Markdown]: '',
    },
    colon: {
        [MessageSyntax.Bash]: `:`,
        [MessageSyntax.Markdown]: '',
    },
    bullet: {
        [MessageSyntax.Bash]: `- `,
        [MessageSyntax.Markdown]: '  - ',
    },
} as const);

function formatWithSyntax(key: keyof typeof formatting, syntax: MessageSyntax): string {
    return formatting[key][syntax];
}

function code(input: string, block: boolean, indent: string, syntax: MessageSyntax): string {
    if (syntax === MessageSyntax.Markdown) {
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
    syntax: MessageSyntax,
): string {
    const format = (key: keyof typeof formatting) => formatWithSyntax(key, syntax);

    return `${indent(1, syntax)}${format('h3')}${code(flagName, false, '', syntax)}${format(
        'reset',
    )}${format('colon')}\n${indent(2, syntax)}${description.trim()}`;
}

export function commandToHelpString(
    command: CliCommandImplementation,
    syntax: MessageSyntax,
): string {
    const format = (key: keyof typeof formatting) => formatWithSyntax(key, syntax);

    const title = `${indent(1, syntax)}${format('h3')}${command.commandName}${format(
        'reset',
    )}${format('colon')}`;
    const description = commandDescriptionToMessage(command.description, syntax);

    return `${title}\n${description}\n`;
}

function indent(input: number, syntax: MessageSyntax): string {
    return formatWithSyntax('indent', syntax).repeat(input);
}

function sectionToString(
    section: CliHelpSection,
    extraIndent: number,
    syntax: MessageSyntax,
    bullets: boolean,
): string {
    const format = (key: keyof typeof formatting) => formatWithSyntax(key, syntax);

    const sectionIndent = indent(2 + extraIndent, syntax);
    const separator = syntax === MessageSyntax.Bash || !bullets ? `:\n` : ': ';
    const header = bullets ? '' : format('h4');

    const title = section.title ? `${sectionIndent}${header}${section.title}${separator}` : '';
    if (bullets && syntax === MessageSyntax.Markdown) {
        return `${format('bullet')}${title}${code(
            section.content,
            section.content.includes('\n'),
            syntax === MessageSyntax.Markdown && section.content.includes('\n') ? '    ' : '',
            syntax,
        )}`;
    } else {
        const contentIndent = section.title ? indent(3 + extraIndent, syntax) : sectionIndent;
        return `${title}${contentIndent}${section.content.split('\n').join(`\n${contentIndent}`)}`;
    }
}

function commandDescriptionToMessage(
    description: CliHelpDescription,
    syntax: MessageSyntax,
): string {
    const format = (key: keyof typeof formatting) => formatWithSyntax(key, syntax);

    const sections = description.sections
        .map((section) => sectionToString(section, 0, syntax, false))
        .join('\n\n');

    const examples = description.examples
        .map((example) => sectionToString(example, 1, syntax, true))
        .join('\n');
    const examplesTitle = description.examples.length
        ? `\n\n${indent(2, syntax)}${format('h4')}Examples${format('reset')}${format('colon')}\n`
        : '';

    return `${sections}${examplesTitle}${examples}`;
}

export function combineHelpMessage(
    flagsText: string,
    commandsText: string,
    syntax: MessageSyntax,
): string {
    const format = (key: keyof typeof formatting) => formatWithSyntax(key, syntax);

    return `${formatting.h2[syntax]}${packageName} usage${format('colon')}${format('reset')}
${format('indent')}${code(`[npx] ${packageName} [--flags] command subCommand`, true, '', syntax)}

${format('indent')}${code(
        'npx',
        false,
        '',
        syntax,
    )} is needed when the command is run directly from the terminal (not scoped within an npm script) unless the package has been globally installed (which will work just fine but I wouldn't recommend, simply because I prefer explicit dependencies).
    
${format('h2')}available flags${format('colon')}${format('reset')}
${flagsText}

${format('h2')}available commands${format('colon')}${format('reset')}
${commandsText}`;
}

export function getIndent(line: string): string {
    return safeMatch(line, /^(\s*)/)[0] ?? '';
}

export function wrapLines(input: string, limit: number): string {
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
