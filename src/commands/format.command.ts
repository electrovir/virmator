import {join} from 'path';
import {CommandLogTransforms} from '../api/command/command-logging';
import {defineCommand} from '../api/command/define-command';
import {getNpmBinPath, virmatorConfigsDir} from '../file-paths/package-paths';

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

export const formatCommandDefinition = defineCommand(
    {
        commandName: 'format',
        subCommandDescriptions: {
            check: 'check formatting without overwriting files.',
        },
        configFiles: {
            prettierrc: {
                copyFromInternalPath: join(virmatorConfigsDir, '.prettierrc.js'),
                required: true,
            },
            prettierIgnore: {
                copyFromInternalPath: join(virmatorConfigsDir, '.prettierignore'),
                required: true,
            },
        },
        npmDeps: [
            'prettier',
            'prettier-plugin-jsdoc',
            'prettier-plugin-multiline-arrays',
            'prettier-plugin-organize-imports',
            'prettier-plugin-packagejson',
            'prettier-plugin-sort-json',
            'prettier-plugin-toml',
        ],
    } as const,
    ({commandName, subCommands, packageBinName}) => {
        return {
            sections: [
                {
                    title: '',
                    content: 'Formats source files with Prettier.',
                },
                {
                    title: 'file extensions',
                    content: `If only specific file extensions should be formatted, add the "${filesMarkerArg}" argument to this command. All following arguments will be treated as file extensions to be formatted. For example, the following command will format files only if they have the extension ".md" or ".json": ${packageBinName} ${commandName} ${filesMarkerArg} md json`,
                },
                {
                    title: 'Prettier flags',
                    content: `Any other arguments encountered between the operation command (if provided) and the "${filesMarkerArg}" marker are treated as extra arguments to Prettier and will be passed along.`,
                },
            ],
            examples: [
                {
                    title: 'checks formatting for files',
                    content: `${packageBinName} ${commandName} ${subCommands.check}`,
                },
                {
                    title: 'checks formatting only for .md files',
                    content: `${packageBinName} ${commandName} ${subCommands.check} ${filesMarkerArg} md`,
                },
                {
                    title: 'checks formatting only for .md and .json files',
                    content: `${packageBinName} ${commandName} ${subCommands.check} ${filesMarkerArg} md json`,
                },
                {
                    title: 'fixes formatting for files',
                    content: `${packageBinName} ${commandName}
    ${packageBinName} ${commandName}`,
                },
                {
                    title: `examples with extra Prettier flags`,
                    content: `${packageBinName} ${commandName} --ignore-path .prettierignore
    ${packageBinName} ${commandName} --ignore-path .prettierignore
    ${packageBinName} ${commandName} --ignore-path .prettierignore ${filesMarkerArg} md json`,
                },
            ],
        };
    },
    (inputs) => {
        const formatArgs = extractFormatArgs(inputs.filteredInputArgs);

        const shouldCheckOnly =
            inputs.inputSubCommands.includes(inputs.subCommands.check) ||
            formatArgs.prettierFlags.includes('--check');
        const operationString = shouldCheckOnly ? '--check ' : '--write';

        const fileExtensions = formatArgs.fileExtensions.length
            ? formatArgs.fileExtensions
            : defaultFormatExtensions;
        const fileExtensionsString = `\"./**/*.+(${fileExtensions.join('|')})\"`;

        const extraPrettierFlags = formatArgs.prettierFlags.length ? formatArgs.prettierFlags : '';

        const logTransforms: CommandLogTransforms = {
            stdout: (stdout) =>
                stdout
                    // only relevant when running the check command
                    .replace('Checking formatting...\n', '')
                    // only relevant when running the check command
                    .replace('All matched files use Prettier code style!\n', ''),
        };

        return {
            mainCommand: getNpmBinPath('prettier'),
            args: [
                '--color',
                ...extraPrettierFlags,
                fileExtensionsString,
                operationString,
            ],
            logTransforms,
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
