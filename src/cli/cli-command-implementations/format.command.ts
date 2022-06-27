import {getNpmBinPath} from '../../file-paths/virmator-package-paths';
import {packageName} from '../../package-name';
import {CliCommandExecutorOutput, defineCliCommand} from '../cli-command/define-cli-command';
import {runVirmatorShellCommand} from '../cli-command/run-shell-command';
import {configFiles} from '../config/config-files';

const defaultFormatExtensions = [
    'css',
    'html',
    'js',
    'json',
    'jsx',
    'md',
    'toml',
    'ts',
    'tsx',
    'yaml',
    'yml',
];

const filesMarkerArg = '--file-types' as const;

export const formatCommandDefinition = defineCliCommand(
    {
        commandName: 'format',
        subCommandDescriptions: {
            check: 'check formatting without overwriting files.',
        },
        requiredConfigFiles: [
            configFiles.prettier,
            configFiles.prettierIgnore,
        ],
    } as const,
    ({commandName, subCommands}) => {
        return {
            sections: [
                {
                    title: '',
                    content: 'Formats source files with Prettier.',
                },
                {
                    title: 'file extensions',
                    content: `If only specific file extensions should be formatted, add the "${filesMarkerArg}" argument to this command. All following arguments will be treated as file extensions to be formatted. For example, the following command will format files only if they have the extension ".md" or ".json": ${packageName} ${commandName} ${filesMarkerArg} md json`,
                },
                {
                    title: 'Prettier flags',
                    content: `Any other arguments encountered between the operation command (if provided) and the "${filesMarkerArg}" marker are treated as extra arguments to Prettier and will be passed along.`,
                },
            ],
            examples: [
                {
                    title: 'checks formatting for files',
                    content: `${packageName} ${commandName} ${subCommands.check}`,
                },
                {
                    title: 'checks formatting only for .md files',
                    content: `${packageName} ${commandName} ${subCommands.check} ${filesMarkerArg} md`,
                },
                {
                    title: 'checks formatting only for .md and .json files',
                    content: `${packageName} ${commandName} ${subCommands.check} ${filesMarkerArg} md json`,
                },
                {
                    title: 'fixes formatting for files',
                    content: `${packageName} ${commandName}
    ${packageName} ${commandName}`,
                },
                {
                    title: `examples with extra Prettier flags`,
                    content: `${packageName} ${commandName} --ignore-path .prettierignore
    ${packageName} ${commandName} --ignore-path .prettierignore
    ${packageName} ${commandName} --ignore-path .prettierignore ${filesMarkerArg} md json`,
                },
            ],
        };
    },
    async (inputs): Promise<CliCommandExecutorOutput> => {
        const formatArgs = extractFormatArgs(inputs.filteredInputArgs);

        const shouldCheckOnly =
            inputs.inputSubCommands.includes(inputs.subCommands.check) ||
            formatArgs.prettierFlags.includes('--check');
        const operationString = shouldCheckOnly ? '--check ' : '--write';

        const fileExtensions = formatArgs.fileExtensions.length
            ? formatArgs.fileExtensions
            : defaultFormatExtensions;
        const fileExtensionsString = `\"./**/*.+(${fileExtensions.join('|')})\"`;

        const extraPrettierFlags = formatArgs.prettierFlags.length
            ? `${formatArgs.prettierFlags.join(' ')} `
            : '';

        const prettier = getNpmBinPath('prettier');

        const formatCommand = `${prettier} --color ${extraPrettierFlags}${fileExtensionsString} ${operationString}`;
        const results = await runVirmatorShellCommand(formatCommand, {
            ...inputs,
            logTransforms: {
                stdout: (stdout) =>
                    stdout
                        // only relevant when running the check command
                        .replace('Checking formatting...\n', '')
                        // only relevant when running the check command
                        .replace('All matched files use Prettier code style!\n', ''),
            },
        });

        return {
            fullExecutedCommand: formatCommand,
            success: !results.exitCode,
        };
    },
);

type FormatArgs = {
    prettierFlags: string[];
    fileExtensions: string[];
};

function extractFormatArgs(args: string[]): FormatArgs {
    let foundFileTypesFlag = false;
    const formatArgs: FormatArgs = {
        prettierFlags: [],
        fileExtensions: [],
    };
    args.forEach((arg) => {
        if (foundFileTypesFlag) {
            formatArgs.fileExtensions.push(arg);
        } else if (arg === filesMarkerArg) {
            foundFileTypesFlag = true;
        } else {
            formatArgs.prettierFlags.push(arg);
        }
    });

    return formatArgs;
}
