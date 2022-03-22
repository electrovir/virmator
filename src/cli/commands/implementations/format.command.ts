import {DeepWriteable, isEnumValue} from 'augment-vir';
import {getNpmBinPath} from '../../../file-paths/virmator-repo-paths';
import {packageName} from '../../../package-name';
import {CliCommandName} from '../../cli-util/cli-command-name';
import {CliFlagName} from '../../cli-util/cli-flags';
import {runVirmatorShellCommand} from '../../cli-util/shell-command-wrapper';
import {ConfigKey} from '../../config/config-key';
import {CliCommandImplementation, CliCommandResult, CommandFunctionInput} from '../cli-command';

export enum FormatOperation {
    Check = 'check',
    Write = 'write',
}

type FormatArgs = Required<
    Readonly<{
        operation: FormatOperation;
        fileExtensions: Readonly<string[]>;
        prettierFlags: Readonly<string[]>;
    }>
>;

export const defaultFormatArgs: FormatArgs = {
    operation: FormatOperation.Write,
    prettierFlags: [],
    fileExtensions: [
        'ts',
        'tsx',
        'json',
        'html',
        'css',
        'md',
        'js',
        'yml',
        'yaml',
    ],
} as const;

export const filesMarkerArg = '--format-files' as const;

export const formatImplementation: CliCommandImplementation = {
    commandName: CliCommandName.Format,
    description: {
        sections: [
            {
                title: '',
                content: 'Formats source files with Prettier.',
            },
            {
                title: 'operation commands',
                content: `This is optional but if provided it must come first. ${FormatOperation.Write} is the default.
    ${FormatOperation.Write}: overwrites files to fix formatting.
    ${FormatOperation.Check}: checks the formatting, does not write to files`,
            },
            {
                title: 'file extensions',
                content: `If only specific file extensions should be formatted, add the "${filesMarkerArg}" argument to this command. All following arguments will be treated as file extensions to be formatted. For example, the following command will overwrite files (because ${FormatOperation.Write} is the default operation) only if they have the extension ".md" or ".json": ${packageName} ${CliCommandName.Format} ${filesMarkerArg} md json`,
            },
            {
                title: 'Prettier flags',
                content: `Any other arguments encountered between the operation command (if provided) and the "${filesMarkerArg}" marker are treated as extra arguments to Prettier and will be passed along.`,
            },
        ],
        examples: [
            {
                title: 'checks formatting for files',
                content: `${packageName} ${CliCommandName.Format} ${FormatOperation.Check}`,
            },
            {
                title: 'checks formatting only for .md files',
                content: `${packageName} ${CliCommandName.Format} ${FormatOperation.Check} ${filesMarkerArg} md`,
            },
            {
                title: 'checks formatting only for .md and .json files',
                content: `${packageName} ${CliCommandName.Format} ${FormatOperation.Check} ${filesMarkerArg} md json`,
            },
            {
                title: 'fixes formatting for files',
                content: `${packageName} ${CliCommandName.Format}
${packageName} ${CliCommandName.Format} ${FormatOperation.Write}`,
            },
            {
                title: `examples with extra Prettier flags`,
                content: `${packageName} ${CliCommandName.Format} --ignore-path .prettierignore
${packageName} ${CliCommandName.Format} ${FormatOperation.Write}  --ignore-path .prettierignore
${packageName} ${CliCommandName.Format} ${FormatOperation.Write}  --ignore-path .prettierignore ${filesMarkerArg} md json`,
            },
        ],
    },
    configKeys: [
        ConfigKey.Prettier,
        ConfigKey.PrettierIgnore,
    ],
    implementation: runFormatCommand,
    configFlagSupport: {
        [CliFlagName.NoWriteConfig]: true,
    },
};

const prettierPath = getNpmBinPath('prettier');

export async function runFormatCommand(inputs: CommandFunctionInput): Promise<CliCommandResult> {
    const args = extractFormatArgs(inputs.rawArgs);

    const operationFlag = args.operation === FormatOperation.Check ? '--check' : '--write';

    const fileExtensions = `\"./**/*.+(${args.fileExtensions.join('|')})\"`;

    const hasNonFlags = args.prettierFlags.some((flag) => !flag.startsWith('-'));

    const prettierCommand = `${prettierPath} --color ${args.prettierFlags.join(' ')} ${
        hasNonFlags ? '' : fileExtensions
    } ${operationFlag}`;

    const results = await runVirmatorShellCommand(prettierCommand, inputs, {
        stdoutFilter: (stdout) =>
            stdout
                // only relevant when running the check command
                .replace('Checking formatting...\n', '')
                // only relevant when running the check command
                .replace('All matched files use Prettier code style!\n', ''),
    });

    return {
        command: prettierCommand,
        success: !results.error,
    };
}

export function extractFormatArgs(rawArgs: string[]): FormatArgs {
    let addingFileExtensions = false;
    const operation: FormatOperation = isEnumValue(rawArgs[0], FormatOperation)
        ? rawArgs[0]
        : FormatOperation.Write;
    const extractedArgs: Partial<DeepWriteable<FormatArgs>> = rawArgs.reduce(
        (accum, currentRawArg, index) => {
            if (index === 0 && isEnumValue(rawArgs[index], FormatOperation)) {
                return accum;
            } else if (currentRawArg === filesMarkerArg) {
                addingFileExtensions = true;
            } else if (addingFileExtensions) {
                if (!accum.fileExtensions) {
                    accum.fileExtensions = [];
                }
                accum.fileExtensions.push(currentRawArg);
            } else {
                if (!accum.prettierFlags) {
                    accum.prettierFlags = [];
                }
                accum.prettierFlags.push(currentRawArg);
            }

            return accum;
        },
        {prettierFlags: [...defaultFormatArgs.prettierFlags]} as Partial<DeepWriteable<FormatArgs>>,
    );

    const finalArgs: FormatArgs = {
        ...defaultFormatArgs,
        ...extractedArgs,
        operation,
    };

    return finalArgs;
}
