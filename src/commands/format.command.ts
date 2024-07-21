import {join} from 'path';
import {CommandLogTransforms} from '../api/command/command-logging';
import {defineCommand} from '../api/command/define-command';
import {NpmDepTypeEnum} from '../api/command/define-command-inputs';
import {getNpmBinPath, virmatorConfigsDir} from '../file-paths/package-paths';
import {combineTextConfig} from './extra-configs/combine-text-config';

const defaultFormatExtensions = [
    'cjs',
    'css',
    'graphql',
    'html',
    'js',
    'json',
    'jsx',
    'less',
    'md',
    'mjs',
    'scss',
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
            prettier: {
                copyFromInternalPath: join(virmatorConfigsDir, 'prettier.config.mjs'),
                copyToPathRelativeToRepoDir: 'prettier.config.mjs',
            },
            prettierIgnore: {
                copyFromInternalPath: join(virmatorConfigsDir, '.prettierignore'),
                copyToPathRelativeToRepoDir: '.prettierignore',
                updateExistingConfigFileCallback: combineTextConfig,
            },
        },
        npmDeps: [
            {name: 'prettier', type: NpmDepTypeEnum.Dev},
            {name: 'prettier-plugin-jsdoc', type: NpmDepTypeEnum.Dev},
            {name: 'prettier-plugin-multiline-arrays', type: NpmDepTypeEnum.Dev},
            {name: 'prettier-plugin-organize-imports', type: NpmDepTypeEnum.Dev},
            {name: 'prettier-plugin-packagejson', type: NpmDepTypeEnum.Dev},
            {name: 'prettier-plugin-sort-json', type: NpmDepTypeEnum.Dev},
            {name: 'prettier-plugin-toml', type: NpmDepTypeEnum.Dev},
            {name: 'prettier-plugin-interpolated-html-tags', type: NpmDepTypeEnum.Dev},
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
    async (inputs) => {
        const formatArgs = extractFormatArgs(inputs.filteredInputArgs);

        const shouldCheckOnly =
            inputs.inputSubCommands.includes(inputs.subCommands.check) ||
            formatArgs.prettierFlags.includes('--check');
        const operationString = shouldCheckOnly ? '--check ' : '--write';

        const fileExtensions = formatArgs.fileExtensions.length
            ? formatArgs.fileExtensions
            : defaultFormatExtensions;
        const filesToFormat = formatArgs.specificFilesToFormat.length
            ? formatArgs.specificFilesToFormat.join(' ')
            : `\"./**/*.+(${fileExtensions.join('|')})\"`;
        const listDifferentFlag = shouldCheckOnly ? '' : '--list-different';

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
            args: [
                await getNpmBinPath({
                    repoDir: inputs.repoDir,
                    command: 'prettier',
                    packageDirPath: inputs.packageDir,
                }),
                '--color',
                '--cache',
                '--cache-strategy',
                'content',
                listDifferentFlag,
                ...extraPrettierFlags,
                filesToFormat,
                operationString,
            ],
            logTransforms,
        };
    },
);

type FormatArgs = {
    prettierFlags: string[];
    fileExtensions: string[];
    specificFilesToFormat: string[];
};

function extractFormatArgs(args: string[]): FormatArgs {
    let foundFileTypesFlag = false;
    const formatArgs: FormatArgs = {
        prettierFlags: [],
        fileExtensions: [],
        specificFilesToFormat: [],
    };
    args.forEach((arg) => {
        if (foundFileTypesFlag) {
            formatArgs.fileExtensions.push(arg);
        } else if (arg === filesMarkerArg) {
            foundFileTypesFlag = true;
        } else if (arg.startsWith('-')) {
            formatArgs.prettierFlags.push(arg);
        } else {
            formatArgs.specificFilesToFormat.push(arg);
        }
    });

    return formatArgs;
}
